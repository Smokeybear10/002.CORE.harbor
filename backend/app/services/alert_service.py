"""Alert generation and management service."""

from __future__ import annotations
from collections import defaultdict
from datetime import datetime, timedelta
import json
import logging
import math
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.domain import (
    VesselORM, PositionReportORM, GeofenceORM,
    AlertORM, AnomalySignalORM, AlertStatus,
    AlertSchema, AnomalySignalSchema, AnomalyType,
    RiskHistoryORM,
)
from app.services.anomaly_detection import run_anomaly_detection, compute_regional_stats
from app.services.risk_scoring import compute_risk_assessment
from app.services.pattern_learning import get_learned_baseline, refresh_baseline
from app.data_sources.nws_adapter import get_weather
from app.services.map_coverage import MapBounds, vessels_in_bounds

logger = logging.getLogger("harboros.alerts")
MAX_ANALYSIS_POSITIONS = 120


def generate_alerts_for_all_vessels(
    db: Session,
    vessel_limit: int | None = None,
    vessel_offset: int = 0,
    observed_since: datetime | None = None,
    coverage_windows: list[tuple[MapBounds, datetime]] | None = None,
) -> list[AlertORM]:
    """Run detection + scoring for all vessels, create/update alerts.

    Includes:
    - Vessel-type-aware anomaly detection (behavior profiles)
    - Regional statistical context (outlier detection)
    - Nearby-vessel data (collision risk)
    - Learned historical baselines (route deviation, pattern matching)
    """
    observation_cutoff = min((since for _, since in coverage_windows), default=observed_since) if coverage_windows is not None else observed_since
    latest_query = db.query(
        PositionReportORM.vessel_id,
        func.max(PositionReportORM.timestamp).label("timestamp"),
    )
    if observation_cutoff is not None:
        latest_query = latest_query.filter(PositionReportORM.timestamp >= observation_cutoff)
    latest_times = latest_query.group_by(PositionReportORM.vessel_id).subquery()
    latest_rows = db.query(PositionReportORM, VesselORM.name).join(
        latest_times,
        (PositionReportORM.vessel_id == latest_times.c.vessel_id)
        & (PositionReportORM.timestamp == latest_times.c.timestamp),
    ).join(VesselORM, VesselORM.id == PositionReportORM.vessel_id).all()
    latest_positions = {}
    observation_starts = {}
    for latest, name in latest_rows:
        started = observed_since
        if coverage_windows is not None:
            starts = [
                since for bounds, since in coverage_windows
                if bounds.south <= latest.latitude <= bounds.north
                and (
                    bounds.west <= latest.longitude <= bounds.east
                    if bounds.west <= bounds.east
                    else latest.longitude >= bounds.west or latest.longitude <= bounds.east
                )
            ]
            if not starts:
                continue
            started = min(starts)
        if started is not None and latest.timestamp < started:
            continue
        observation_starts[latest.vessel_id] = started
        latest_positions[latest.vessel_id] = (
            latest.vessel_id, latest.latitude, latest.longitude,
            latest.speed_over_ground, latest.course_over_ground, name,
        )

    vessel_query = db.query(VesselORM)
    if vessel_limit or coverage_windows is not None or observed_since is not None:
        vessel_ids = sorted(latest_positions)
        if vessel_limit:
            batches = max(1, (len(vessel_ids) + vessel_limit - 1) // vessel_limit)
            offset = (vessel_offset // vessel_limit % batches) * vessel_limit
            vessel_ids = vessel_ids[offset:offset + vessel_limit]
        vessel_query = vessel_query.filter(VesselORM.id.in_(vessel_ids))
    vessels = vessel_query.order_by(VesselORM.id).all()
    vessel_ids = [vessel.id for vessel in vessels]
    positions_by_vessel = defaultdict(list)
    history_query = select(
        PositionReportORM.id,
        func.row_number().over(
            partition_by=PositionReportORM.vessel_id,
            order_by=(PositionReportORM.timestamp.desc(), PositionReportORM.id.desc()),
        ).label("rank"),
    ).where(
        PositionReportORM.vessel_id.in_(vessel_ids),
    )
    if observation_cutoff is not None:
        history_query = history_query.where(PositionReportORM.timestamp >= observation_cutoff)
    ranked_history = history_query.subquery()
    positions = db.query(PositionReportORM).filter(
        PositionReportORM.id.in_(
            select(ranked_history.c.id).where(ranked_history.c.rank <= MAX_ANALYSIS_POSITIONS),
        ),
    ).order_by(PositionReportORM.timestamp, PositionReportORM.id).all()
    for position in positions:
        started = observation_starts.get(position.vessel_id)
        if started is None or position.timestamp >= started:
            positions_by_vessel[position.vessel_id].append(position)
    active_alerts = {
        alert.vessel_id: alert for alert in db.query(AlertORM).filter(
            AlertORM.vessel_id.in_(vessel_ids), AlertORM.status == "active",
        ).all()
    }
    geofences = db.query(GeofenceORM).all()
    alerts_created = []

    # Pre-compute regional stats for statistical outlier detection
    all_recent_positions = (
        db.query(PositionReportORM)
        .order_by(PositionReportORM.timestamp.desc())
        .limit(5000)
        .all()
    )
    regional_stats = compute_regional_stats(all_recent_positions)

    # Load or refresh learned baselines from Parquet archives + SQLite
    learned = get_learned_baseline()
    if learned.last_refresh is None:
        logger.info("Initializing learned baselines from historical data...")
        refresh_baseline(db)

    nearby_list = list(latest_positions.values())

    weather_cells = {}
    for _, lat, lon, *_ in nearby_list:
        if 15 <= lat <= 72 and -180 <= lon <= -60:
            weather_cells.setdefault((round(lat * 2) / 2, round(lon * 2) / 2), (lat, lon))
    cells = [weather_cells[key] for key in sorted(weather_cells)]
    if cells:
        weather_offset = (vessel_offset // (vessel_limit or 500) * 4) % len(cells)
        for index in range(min(4, len(cells))):
            lat, lon = cells[(weather_offset + index) % len(cells)]
            get_weather(lat, lon)

    weather_by_vessel: dict[str, object] = {}
    for vessel in vessels:
        latest = latest_positions.get(vessel.id)
        if latest:
            _, lat, lon, *_ = latest
            weather_by_vessel[vessel.id] = get_weather(lat, lon, cached_only=True)

    for vessel in vessels:
        positions = positions_by_vessel[vessel.id]
        existing = active_alerts.get(vessel.id)

        # Skip edge node vessels — their alerts are managed by the edge endpoint
        if vessel.id.startswith("dark-") or vessel.id.startswith("seapod-"):
            continue

        # Skip demo vessels whose alerts are manually seeded
        if vessel.id in ("v-jade-star", "v-dark-optical-1", "v-dark-horizon"):
            continue

        if existing and (coverage_windows is not None or observed_since is not None) and len(positions) < 3:
            continue

        if not positions:
            # Resolve any ghost alerts for vessels with no position data
            if existing:
                existing.status = "resolved"
                existing.explanation = "No position data available for behavioral assessment."
            continue

        latest = positions[-1]
        longitude_margin = 0.026 / max(math.cos(math.radians(latest.latitude)), 0.001)
        nearby = [
            other for other in nearby_list
            if abs(other[1] - latest.latitude) <= 0.026
            and abs((other[2] - latest.longitude + 180) % 360 - 180) <= longitude_margin
        ]
        signals = run_anomaly_detection(
            vessel, positions, geofences,
            regional_stats=regional_stats,
            nearby_vessels=nearby,
            learned_baseline=learned,
            weather=weather_by_vessel.get(vessel.id),
        )

        assessment = compute_risk_assessment(vessel, signals)

        # Record risk score snapshot for sparkline trend visualization
        db.add(RiskHistoryORM(
            vessel_id=vessel.id,
            risk_score=assessment.risk_score,
            recommended_action=assessment.recommended_action,
        ))

        # Skip low-confidence assessments, but clear active alerts if they exist
        if assessment.risk_score < 35:
            if existing:
                existing.status = "resolved"
                existing.explanation = "Behavior returned to normal; risk score dropped below threshold."
            continue

        # COLREGS non-compliance alone isn't enough for an alert — it
        # boosts other suspicious signals but needs additional context
        # (AIS gap, spoofing, identity deception) to warrant operator attention.
        signal_types = set(s.anomaly_type for s in signals)
        if signal_types <= {AnomalyType.COLLISION_RISK}:
            if existing:
                existing.status = "resolved"
                existing.explanation = "Elevated risk resolved down to standard COLREGS warning."
            continue

        if existing:
            existing.risk_score = assessment.risk_score
            existing.recommended_action = assessment.recommended_action
            existing.explanation = assessment.explanation
            existing.anomaly_signals_json = json.dumps([s.model_dump() for s in signals])
            alert = existing
        else:
            alert = AlertORM(
                id=str(uuid.uuid4()),
                vessel_id=vessel.id,
                risk_score=assessment.risk_score,
                recommended_action=assessment.recommended_action,
                explanation=assessment.explanation,
                anomaly_signals_json=json.dumps([s.model_dump() for s in signals]),
            )
            db.add(alert)

        # Replace signal records (delete old, insert new — fixes duplication)
        db.query(AnomalySignalORM).filter(AnomalySignalORM.alert_id == alert.id).delete()
        for signal in signals:
            signal_orm = AnomalySignalORM(
                alert_id=alert.id,
                anomaly_type=signal.anomaly_type,
                severity=signal.severity,
                description=signal.description,
                details_json=json.dumps(signal.details) if signal.details else None,
            )
            db.add(signal_orm)

        alerts_created.append(alert)

    # Keep the last assessment even when a vessel leaves the observed area.
    db.flush()
    cutoff = datetime.utcnow() - timedelta(hours=24)
    ranked_risks = select(
        RiskHistoryORM.id,
        func.row_number().over(
            partition_by=RiskHistoryORM.vessel_id,
            order_by=(RiskHistoryORM.timestamp.desc(), RiskHistoryORM.id.desc()),
        ).label("rank"),
    ).subquery()
    db.query(RiskHistoryORM).filter(
        RiskHistoryORM.timestamp < cutoff,
        RiskHistoryORM.id.in_(select(ranked_risks.c.id).where(ranked_risks.c.rank > 1)),
    ).delete(synchronize_session=False)

    db.commit()
    return alerts_created


def get_alerts(
    db: Session,
    status: str | None = None,
    region: str | None = None,
    limit: int = 50,
    offset: int = 0,
    bounds: MapBounds | None = None,
) -> tuple[list[AlertSchema], int]:
    """Get alerts with vessel info, sorted by risk score desc (paginated)."""
    query = db.query(AlertORM).join(VesselORM)
    if status:
        query = query.filter(AlertORM.status == status)
    if region:
        query = query.filter(VesselORM.region == region)
    if bounds:
        query = query.filter(VesselORM.id.in_(vessels_in_bounds(db, bounds)))
    query = query.order_by(AlertORM.risk_score.desc())

    total = query.count()
    alerts = query.offset(offset).limit(limit).all()

    result = []
    for alert in alerts:
        signals = json.loads(alert.anomaly_signals_json) if alert.anomaly_signals_json else []
        result.append(AlertSchema(
            id=alert.id,
            vessel_id=alert.vessel_id,
            vessel_name=alert.vessel.name if alert.vessel else None,
            vessel_mmsi=alert.vessel.mmsi if alert.vessel else None,
            created_at=alert.created_at,
            status=alert.status,
            risk_score=alert.risk_score,
            recommended_action=alert.recommended_action,
            explanation=alert.explanation,
            anomaly_signals=[AnomalySignalSchema(**s) for s in signals],
        ))
    return result, total


def update_alert_status(db: Session, alert_id: str, status: str, notes: str | None = None) -> AlertORM | None:
    """Update alert status (acknowledge, dismiss, pin)."""
    alert = db.query(AlertORM).filter(AlertORM.id == alert_id).first()
    if not alert:
        return None
    alert.status = status
    if notes:
        alert.operator_notes = notes
    db.commit()
    db.refresh(alert)
    return alert
