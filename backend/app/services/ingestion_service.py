"""
Live AIS ingestion service.

Runs as a background asyncio task within FastAPI.
Receives parsed AIS messages from AISStreamClient,
upserts vessels and position reports into the database,
and periodically re-runs anomaly detection.
"""

from __future__ import annotations
import asyncio
import logging
from time import sleep
from typing import Literal
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import func
from sqlalchemy.exc import InterfaceError, OperationalError
from sqlalchemy.orm import Session

from app.database import SessionLocal, is_durable_storage
from app.models.domain import VesselORM, PositionReportORM, AlertORM, VerificationRequestORM, RiskHistoryORM
from app.data_sources.aisstream_adapter import AISStreamClient
from app.services.alert_service import generate_alerts_for_all_vessels

logger = logging.getLogger("harboros.ingestion")


class IngestionService:
    """Manages live AIS data ingestion as a background task."""

    def __init__(self, api_key: str | None = None, region_keys: list[str] | None = None):
        self.client = AISStreamClient(api_key=api_key, region_keys=region_keys)
        self._task: asyncio.Task | None = None
        self._alert_task: asyncio.Task | None = None
        self._flush_task: asyncio.Task | None = None
        self._pending_messages: dict[tuple[str, str], dict] = {}
        self._unmatched_static: dict[str, dict] = {}
        self._scan_offset = 0
        self._running = False
        self._vessels_seen: set[str] = set()
        self._positions_ingested = 0
        self._vessels_created = 0
        self._vessels_updated = 0
        self._last_alert_run: datetime | None = None

    @property
    def status(self) -> dict:
        return {
            "running": self._running,
            "connected": self.client.is_connected,
            "available": self.client.is_available,
            "vessels_seen": len(self._vessels_seen),
            "positions_ingested": self._positions_ingested,
            "vessels_created": self._vessels_created,
            "vessels_updated": self._vessels_updated,
            "last_alert_run": self._last_alert_run.isoformat() if self._last_alert_run else None,
            "stream_stats": {
                **self.client.stats,
                "coverage_mode": "map" if self.client.applied_boxes != self.client.bounding_boxes else "configured",
                "bounding_boxes": self.client.applied_boxes,
            },
        }

    async def start(self):
        """Start the ingestion background task."""
        if self._running:
            logger.warning("Ingestion already running")
            return

        if not self.client.is_available:
            logger.error("No AISStream API key — cannot start live ingestion")
            return

        self._running = True
        self._task = asyncio.create_task(self._ingest_loop())
        self._flush_task = asyncio.create_task(self._flush_loop())
        self._alert_task = asyncio.create_task(self._alert_loop())
        logger.info("Ingestion service started")

    async def stop(self):
        """Stop the ingestion background task."""
        self._running = False
        await self.client.disconnect()

        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        if self._alert_task:
            self._alert_task.cancel()
            try:
                await self._alert_task
            except asyncio.CancelledError:
                pass
            self._alert_task = None

        if self._flush_task:
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
            self._flush_task = None
        if self._pending_messages:
            await self._flush_pending()

        logger.info("Ingestion service stopped")

    async def _ingest_loop(self):
        """Main ingestion loop — connect and process messages."""
        try:
            async for message in self.client.connect():
                if not self._running:
                    break

                key = (message["type"], message["mmsi"])
                previous = self._pending_messages.get(key)
                if previous and message["timestamp"] <= previous["timestamp"]:
                    continue
                if key not in self._pending_messages and len(self._pending_messages) >= 1000:
                    self._pending_messages.pop(next(iter(self._pending_messages)))
                self._pending_messages[key] = message

        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Ingestion loop error: {e}")

    async def _flush_loop(self) -> None:
        while self._running:
            await asyncio.sleep(2)
            await self._flush_pending()

    async def _flush_pending(self) -> None:
        batch = list(self._pending_messages.values())
        if not batch:
            return
        result = await asyncio.to_thread(self._flush_batch, batch)
        if result == "retry":
            return
        for message in batch:
            key = (message["type"], message["mmsi"])
            if self._pending_messages.get(key) is message:
                del self._pending_messages[key]

    def _flush_batch(self, batch: list[dict]) -> Literal["saved", "retry", "rejected"]:
        """Write a batch of AIS messages to the database."""
        if not batch:
            return "saved"

        counters_before = (self._vessels_created, self._vessels_updated, self._positions_ingested)
        seen_before = self._vessels_seen.copy()
        static_before = self._unmatched_static.copy()
        for attempt in range(2):
            db = SessionLocal()
            try:
                self._write_batch(db, batch)
                db.commit()
                return "saved"
            except Exception as error:
                db.rollback()
                self._vessels_created, self._vessels_updated, self._positions_ingested = counters_before
                self._vessels_seen = seen_before.copy()
                self._unmatched_static = static_before.copy()
                transient = isinstance(error, (OperationalError, InterfaceError))
                if attempt or not transient:
                    logger.error("Batch flush error: %s", error)
                    return "retry" if transient else "rejected"
                logger.warning("Temporary database failure; retrying AIS batch")
            finally:
                db.close()
            sleep(0.5)

    def _write_batch(self, db: Session, batch: list[dict]) -> None:
        mmsis = {msg["mmsi"] for msg in batch}
        vessels = {
            vessel.mmsi: vessel for vessel in db.query(VesselORM).filter(VesselORM.mmsi.in_(mmsis)).all()
        }
        position_ids = {
            vessels[msg["mmsi"]].id for msg in batch
            if msg["type"] == "position" and msg["mmsi"] in vessels
        }
        latest_positions = {}
        if position_ids:
            latest_times = db.query(
                PositionReportORM.vessel_id,
                func.max(PositionReportORM.timestamp).label("timestamp"),
            ).filter(PositionReportORM.vessel_id.in_(position_ids)).group_by(PositionReportORM.vessel_id).subquery()
            latest_positions = {
                position.vessel_id: position for position in db.query(PositionReportORM).join(
                    latest_times,
                    (PositionReportORM.vessel_id == latest_times.c.vessel_id)
                    & (PositionReportORM.timestamp == latest_times.c.timestamp),
                ).order_by(PositionReportORM.id).all()
            }
        for msg in batch:
            if msg["type"] == "position":
                self._upsert_position(db, msg, vessels, latest_positions)
            elif msg["type"] == "static":
                self._upsert_vessel_static(msg, vessels)

    def _upsert_position(
        self, db: Session, msg: dict,
        vessels: dict[str, VesselORM], latest_positions: dict[str, PositionReportORM],
    ):
        """Insert a position report and ensure the vessel exists."""
        mmsi = msg["mmsi"]
        data = msg["data"]
        timestamp = msg["timestamp"]

        region = msg.get("region")

        # Ensure vessel record exists
        vessel = vessels.get(mmsi)
        if not vessel:
            vessel = VesselORM(
                id=f"ais-{mmsi}",
                mmsi=mmsi,
                name=msg.get("ship_name") or f"MMSI {mmsi}",
                vessel_type="other",
                flag_state="Unknown",
                region=region,
                inspection_deficiencies=0,
            )
            db.add(vessel)
            vessels[mmsi] = vessel
            self._vessels_created += 1
            logger.info(f"New vessel: {vessel.name} (MMSI {mmsi}) in {region}")
        else:
            if msg.get("ship_name") and vessel.name.startswith("MMSI "):
                vessel.name = msg["ship_name"]
            # Update region to most recent sighting
            if region:
                vessel.region = region

        static = self._unmatched_static.pop(mmsi, None)
        if static:
            self._upsert_vessel_static(static, vessels)

        if len(self._vessels_seen) < 5000:
            self._vessels_seen.add(mmsi)

        # AIS protocol: raw SOG value 1023 (102.3 kt) means "not available".
        # Heading 511 also means "not available". Filter these sentinel values.
        sog = data.get("speed_over_ground")
        if sog is not None and sog >= 102.2:
            sog = None  # Discard AIS "not available" sentinel

        timestamp = timestamp.astimezone(timezone.utc).replace(tzinfo=None) if timestamp.tzinfo else timestamp
        latest = latest_positions.get(vessel.id)
        if latest and timestamp <= latest.timestamp:
            return
        # Keep the newest position current without storing every AIS transmission.
        # A separate sample every 30 seconds retains a bounded movement trail.
        if latest and (timestamp - latest.timestamp).total_seconds() < 30:
            bucket = int(timestamp.replace(tzinfo=timezone.utc).timestamp()) // 30
            if bucket == int(latest.timestamp.replace(tzinfo=timezone.utc).timestamp()) // 30:
                latest.timestamp = timestamp
                latest.latitude = data["latitude"]
                latest.longitude = data["longitude"]
                latest.speed_over_ground = sog
                latest.course_over_ground = data.get("course_over_ground")
                latest.heading = data.get("heading") if data.get("heading") != 511 else None
                latest.nav_status = data.get("nav_status")
                self._positions_ingested += 1
                return

        pos = PositionReportORM(
            vessel_id=vessel.id,
            timestamp=timestamp,
            latitude=data["latitude"],
            longitude=data["longitude"],
            speed_over_ground=sog,
            course_over_ground=data.get("course_over_ground"),
            heading=data.get("heading") if data.get("heading") != 511 else None,
            nav_status=data.get("nav_status"),
        )
        db.add(pos)
        latest_positions[vessel.id] = pos
        self._positions_ingested += 1

    def _upsert_vessel_static(self, msg: dict, vessels: dict[str, VesselORM]):
        """Update vessel metadata from static data message."""
        mmsi = msg["mmsi"]
        data = msg["data"]

        vessel = vessels.get(mmsi)
        if not vessel:
            if mmsi not in self._unmatched_static and len(self._unmatched_static) >= 1000:
                self._unmatched_static.pop(next(iter(self._unmatched_static)))
            self._unmatched_static[mmsi] = msg
            return
        self._vessels_updated += 1

        # Update fields if we got better data
        if data.get("name") and data["name"] != vessel.name:
            vessel.name = data["name"]
        if data.get("imo") and data["imo"] != "0":
            vessel.imo = data["imo"]
        if data.get("callsign"):
            vessel.callsign = data["callsign"]
        if data.get("destination"):
            vessel.destination = data["destination"]
        if data.get("vessel_type"):
            vessel.vessel_type = data["vessel_type"]
        if data.get("length"):
            vessel.length = data["length"]
        if data.get("beam"):
            vessel.beam = data["beam"]
        if data.get("draft"):
            vessel.draft = data["draft"]

        if len(self._vessels_seen) < 5000:
            self._vessels_seen.add(mmsi)

    async def _alert_loop(self):
        """Periodically re-run anomaly detection and prune old data."""
        cycle = 0
        try:
            while self._running:
                await asyncio.sleep(30)

                if not self._running:
                    break

                cycle += 1
                # Weather lookups and scoring must not block the AIS socket or API.
                await asyncio.to_thread(self._run_alert_scan, cycle % 10 == 0)

        except asyncio.CancelledError:
            pass

    def _run_alert_scan(self, archive: bool) -> None:
        db = SessionLocal()
        try:
            self._prune_live_cache(db)
            alerts = generate_alerts_for_all_vessels(
                db, vessel_limit=500, vessel_offset=self._scan_offset,
                observed_since=self.client.coverage_started,
                coverage_windows=self.client.coverage_windows,
            ) if self.client.is_connected else []
            self._scan_offset += 500
            self._last_alert_run = datetime.now(timezone.utc)
            if alerts:
                logger.info(f"Alert scan: {len(alerts)} alerts generated/updated")

            if archive and not is_durable_storage(db.get_bind()):
                from app.services.archive_service import archive_old_positions
                result = archive_old_positions(db=db)
                if result["archived"] > 0:
                    logger.info(f"Archived {result['archived']} positions to Parquet")
        except Exception as e:
            logger.error(f"Alert generation error: {e}")
        finally:
            db.close()

    def _prune_live_cache(self, db: Session) -> None:
        from app.services.archive_service import archive_old_positions
        if is_durable_storage(db.get_bind()):
            archive_old_positions(db=db)
        else:
            live = PositionReportORM.vessel_id.like("ais-%")
            oldest_kept = db.query(PositionReportORM.id).filter(live).order_by(PositionReportORM.id.desc()).offset(49_999).first()
            if oldest_kept:
                archive_old_positions(db=db, before_id=oldest_kept[0])
        orphan_ids = db.query(VesselORM.id).filter(
            VesselORM.id.like("ais-%"),
            ~db.query(PositionReportORM.id).filter(PositionReportORM.vessel_id == VesselORM.id).exists(),
            ~db.query(AlertORM.id).filter(AlertORM.vessel_id == VesselORM.id).exists(),
            ~db.query(VerificationRequestORM.id).filter(VerificationRequestORM.vessel_id == VesselORM.id).exists(),
        ).subquery()
        from sqlalchemy import select
        db.query(RiskHistoryORM).filter(RiskHistoryORM.vessel_id.in_(select(orphan_ids.c.id))).delete(synchronize_session=False)
        db.query(VesselORM).filter(VesselORM.id.in_(select(orphan_ids.c.id))).delete(synchronize_session=False)
        db.query(AlertORM).filter(
            AlertORM.vessel_id.like("ais-%"), AlertORM.status == "active",
            ~db.query(PositionReportORM.id).filter(PositionReportORM.vessel_id == AlertORM.vessel_id).exists(),
        ).update({"status": "resolved", "explanation": "Position history is no longer retained for this vessel."}, synchronize_session=False)
        risk_cutoff = db.query(RiskHistoryORM.id).order_by(RiskHistoryORM.id.desc()).offset(49_999).first()
        if risk_cutoff:
            db.query(RiskHistoryORM).filter(RiskHistoryORM.id < risk_cutoff[0]).delete(synchronize_session=False)
        db.commit()



# Singleton instance
_ingestion_service: IngestionService | None = None


def get_ingestion_service() -> IngestionService:
    global _ingestion_service
    if _ingestion_service is None:
        _ingestion_service = IngestionService()
    return _ingestion_service


def create_ingestion_service(api_key: str | None = None, region_keys: list[str] | None = None) -> IngestionService:
    global _ingestion_service
    _ingestion_service = IngestionService(api_key=api_key, region_keys=region_keys)
    return _ingestion_service
