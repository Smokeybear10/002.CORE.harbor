import asyncio
from datetime import datetime, timedelta
import os
from types import SimpleNamespace

import pytest
from sqlalchemy import event, text
from sqlalchemy.exc import IntegrityError, InterfaceError, OperationalError
from sqlalchemy.orm import Session, sessionmaker

from app import database
from app.models.domain import (
    AlertAuditORM, AlertORM, AnomalySignalORM, AnomalySignalSchema,
    PositionReportORM, RiskHistoryORM, VerificationRequestORM, VesselORM,
)
from app.services import alert_service, archive_service, ingestion_service


@pytest.fixture(params=["sqlite", "postgresql"])
def storage_engine(request, tmp_path):
    url = f"sqlite:///{tmp_path / 'history.db'}"
    if request.param == "postgresql":
        url = os.environ.get("TEST_DATABASE_URL")
        if not url:
            pytest.skip("TEST_DATABASE_URL is not configured")
    engines = []

    def create_engine():
        engine = database.create_database_engine(url)
        if request.param == "postgresql":
            @event.listens_for(engine, "connect")
            def set_test_schema(connection, _):
                with connection.cursor() as cursor:
                    cursor.execute("SET search_path TO h4bor_persistence_test")
                connection.commit()
        else:
            @event.listens_for(engine, "connect")
            def enforce_foreign_keys(connection, _):
                connection.execute("PRAGMA foreign_keys = ON")
        engines.append(engine)
        return engine

    engine = create_engine()
    database.Base.metadata.create_all(engine)
    yield engine, create_engine
    database.Base.metadata.drop_all(engine)
    for instance in engines:
        instance.dispose()


def add_vessel(db: Session, vessel_id: str) -> None:
    db.add(VesselORM(id=vessel_id, mmsi=vessel_id, vessel_type="cargo"))
    db.flush()


def report(vessel_id: str, timestamp: datetime) -> PositionReportORM:
    return PositionReportORM(
        vessel_id=vessel_id, timestamp=timestamp, latitude=50, longitude=0,
        speed_over_ground=12, course_over_ground=90,
    )


def test_history_survives_archive_and_new_engine(storage_engine, tmp_path, monkeypatch):
    engine, reconnect = storage_engine
    monkeypatch.setattr(archive_service, "is_durable_storage", lambda bind: True)
    monkeypatch.setattr(archive_service, "ARCHIVE_DIR", tmp_path / "archive")
    now = datetime.utcnow()
    with Session(engine) as db:
        add_vessel(db, "ais-retained")
        db.add_all([report("ais-retained", now - timedelta(hours=2)), report("ais-retained", now)])
        db.commit()
        result = archive_service.archive_old_positions(db=db, retention_minutes=1, before_id=999_999)
        assert result["archived"] == 0
        assert result["deleted_positions"] == 0
        assert not archive_service.ARCHIVE_DIR.exists()
    engine.dispose()
    with Session(reconnect()) as db:
        assert db.query(PositionReportORM).count() == 2
        assert db.query(PositionReportORM).order_by(PositionReportORM.timestamp).first().timestamp == now - timedelta(hours=2)
        status = archive_service.get_storage_status(db)
        assert status["durable"] is True
        assert status["history_retention_days"] == 7
        assert status["max_position_rows"] == 250_000
        assert status["position_count"] == 2
        assert status["oldest_report_at"] == f"{(now - timedelta(hours=2)).isoformat()}Z"


def test_retention_prunes_old_history_before_last_known_positions(storage_engine):
    engine, _ = storage_engine
    now = datetime.utcnow()
    with Session(engine) as db:
        for vessel_id in ("ais-a", "ais-b", "ais-c"):
            add_vessel(db, vessel_id)
        samples = [
            ("ais-a", 9), ("ais-a", 8), ("ais-a", 0),
            ("ais-b", 10), ("ais-b", 9),
            ("ais-c", 6), ("ais-c", 5), ("ais-c", 4),
        ]
        db.add_all([report(vessel_id, now - timedelta(days=days)) for vessel_id, days in samples])
        db.commit()
        removed = archive_service.prune_position_history(
            db, archive_service.HistoryRetention(history_retention_days=7, max_position_rows=4),
        )
        assert removed == 4
        remaining = {(row.vessel_id, row.timestamp) for row in db.query(PositionReportORM).all()}
        assert remaining == {
            ("ais-a", now), ("ais-b", now - timedelta(days=9)),
            ("ais-c", now - timedelta(days=5)), ("ais-c", now - timedelta(days=4)),
        }


def test_position_cap_preserves_alert_notes_audit_and_verification(storage_engine):
    engine, _ = storage_engine
    now = datetime.utcnow()
    with Session(engine) as db:
        for index in range(4):
            vessel_id = f"ais-{index}"
            add_vessel(db, vessel_id)
            db.add(report(vessel_id, now - timedelta(hours=4 - index)))
        db.add(AlertORM(id="saved-alert", vessel_id="ais-0", status="resolved", operator_notes="Keep this report"))
        db.flush()
        db.add(AlertAuditORM(alert_id="saved-alert", action="noted", details="Operator review"))
        db.add(VerificationRequestORM(id="saved-verification", vessel_id="ais-0", alert_id="saved-alert"))
        db.commit()
        assert archive_service.prune_position_history(
            db, archive_service.HistoryRetention(max_position_rows=2),
        ) == 2
        assert {row.vessel_id for row in db.query(PositionReportORM).all()} == {"ais-2", "ais-3"}
        service = ingestion_service.IngestionService(api_key="test")
        service._prune_live_cache(db)
        assert db.get(AlertORM, "saved-alert").operator_notes == "Keep this report"
        assert db.query(AlertAuditORM).one().details == "Operator review"
        assert db.get(VerificationRequestORM, "saved-verification") is not None
        assert db.get(VesselORM, "ais-0") is not None


def test_schema_upgrade_handles_both_dialects(storage_engine, monkeypatch):
    engine, _ = storage_engine
    monkeypatch.setattr(database, "engine", engine)
    monkeypatch.setattr(database, "SessionLocal", sessionmaker(bind=engine))
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE verification_requests DROP COLUMN scene_acquired_at"))
    assert "scene_acquired_at" not in database._table_columns("verification_requests")
    database.init_db()
    database.init_db()
    assert "scene_acquired_at" in database._table_columns("verification_requests")


def test_alert_scan_bounds_saved_history(storage_engine, monkeypatch):
    engine, _ = storage_engine
    now = datetime.utcnow()
    scanned = []
    monkeypatch.setattr(alert_service, "get_weather", lambda *args, **kwargs: None)
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)

    def detect(vessel, positions, *args, **kwargs):
        scanned.extend(positions)
        return []

    monkeypatch.setattr(alert_service, "run_anomaly_detection", detect)
    with Session(engine) as db:
        add_vessel(db, "ais-many")
        db.add_all([report("ais-many", now - timedelta(minutes=index)) for index in range(500)])
        db.commit()
        alert_service.generate_alerts_for_all_vessels(db, vessel_limit=500)
        assert len(scanned) == alert_service.MAX_ANALYSIS_POSITIONS
        assert scanned[0].timestamp == now - timedelta(minutes=alert_service.MAX_ANALYSIS_POSITIONS - 1)
        assert scanned[-1].timestamp == now
        scanned.clear()
        alert_service.generate_alerts_for_all_vessels(db, vessel_limit=500, observed_since=now - timedelta(minutes=2))
        assert len(scanned) == 3


def test_risk_retention_keeps_last_assessment_outside_current_coverage(storage_engine, monkeypatch):
    engine, _ = storage_engine
    now = datetime.utcnow()
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)
    with Session(engine, autoflush=False) as db:
        for vessel_id in ("ais-old", "ais-recent", "ais-tied", "ais-pending"):
            add_vessel(db, vessel_id)
        samples = [
            (1, "ais-old", 72, 90),
            (2, "ais-old", 48, 10),
            (3, "ais-recent", 48, 70),
            (4, "ais-recent", 12, 20),
            (5, "ais-recent", 1, 5),
            (6, "ais-tied", 48, 80),
            (7, "ais-tied", 48, 0),
            (8, "ais-pending", 48, 80),
        ]
        db.add_all([
            RiskHistoryORM(
                id=history_id, vessel_id=vessel_id, timestamp=now - timedelta(hours=hours),
                risk_score=score, recommended_action="monitor" if score >= 35 else "ignore",
            )
            for history_id, vessel_id, hours, score in samples
        ])
        db.commit()
        db.add(RiskHistoryORM(
            id=9, vessel_id="ais-pending", timestamp=now,
            risk_score=0, recommended_action="ignore",
        ))

        alert_service.generate_alerts_for_all_vessels(db, coverage_windows=[])

        remaining = {row.id: row.risk_score for row in db.query(RiskHistoryORM).all()}
        assert remaining == {2: 10, 4: 20, 5: 5, 7: 0, 9: 0}


def test_postgres_engine_uses_bounded_pool_and_keeps_tls(monkeypatch):
    captured = {}

    def capture(url, **kwargs):
        captured.update(url=url, **kwargs)
        return object()

    monkeypatch.setattr(database, "create_engine", capture)
    database.create_database_engine("postgres://user:password@example.invalid/harbor?sslmode=require")
    assert captured["url"].drivername == "postgresql+psycopg"
    assert captured["url"].query["sslmode"] == "require"
    assert captured["pool_size"] + captured["max_overflow"] == 5
    assert captured["pool_pre_ping"] is True
    assert captured["connect_args"]["prepare_threshold"] is None


def test_ingestion_batch_and_alert_foreign_keys(storage_engine, monkeypatch):
    engine, _ = storage_engine
    factory = sessionmaker(bind=engine, autoflush=False)
    monkeypatch.setattr(ingestion_service, "SessionLocal", factory)
    monkeypatch.setattr(alert_service, "get_weather", lambda *args, **kwargs: None)
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)
    monkeypatch.setattr(alert_service, "run_anomaly_detection", lambda *args, **kwargs: [
        AnomalySignalSchema(anomaly_type="ais_gap", severity=0.9, description="Observed gap"),
    ])
    monkeypatch.setattr(alert_service, "compute_risk_assessment", lambda *args: SimpleNamespace(
        risk_score=80, recommended_action="verify", explanation="Observed gap needs review",
    ))
    service = ingestion_service.IngestionService(api_key="test")
    service._flush_batch([{
        "type": "position", "mmsi": "987654321", "timestamp": datetime.utcnow(),
        "data": {"latitude": 50, "longitude": 0, "speed_over_ground": 12},
    }, {
        "type": "static", "mmsi": "987654321", "data": {"name": "Retained vessel"},
    }])
    with factory() as db:
        assert db.query(PositionReportORM).count() == 1
        assert db.get(VesselORM, "ais-987654321").name == "Retained vessel"
        generated = alert_service.generate_alerts_for_all_vessels(db, vessel_limit=500)
        assert len(generated) == 1
        assert db.query(AnomalySignalORM).one().alert_id == generated[0].id
        assert db.query(RiskHistoryORM).one().vessel_id == "ais-987654321"


def test_ingestion_batch_keeps_database_round_trips_bounded(storage_engine, monkeypatch):
    engine, _ = storage_engine
    factory = sessionmaker(bind=engine, autoflush=False)
    monkeypatch.setattr(ingestion_service, "SessionLocal", factory)
    service = ingestion_service.IngestionService(api_key="test")
    now = datetime.utcnow().replace(second=0, microsecond=0)
    statements = []

    def count_statements(connection, cursor, statement, *args):
        statements.append(statement)

    event.listen(engine, "before_cursor_execute", count_statements)
    try:
        for minute in (0, 1):
            statements.clear()
            service._flush_batch([{
                "type": "position", "mmsi": str(index), "timestamp": now + timedelta(minutes=minute),
                "data": {"latitude": 50, "longitude": 0, "speed_over_ground": 12},
            } for index in range(50)])
            assert sum(statement.lstrip().startswith("SELECT") for statement in statements) <= 2
            if engine.dialect.name == "postgresql":
                assert len(statements) <= 5
    finally:
        event.remove(engine, "before_cursor_execute", count_statements)
    with factory() as db:
        assert db.query(VesselORM).count() == 50
        assert db.query(PositionReportORM).count() == 100


def test_postgres_never_runs_sqlite_vacuum(monkeypatch):
    monkeypatch.setattr(database, "engine", SimpleNamespace(dialect=SimpleNamespace(name="postgresql")))
    assert database.reclaim_free_pages() == 0


@pytest.mark.parametrize("error_type, failures, attempts", [
    (OperationalError, 1, 2), (InterfaceError, 1, 2),
    (OperationalError, 2, 2), (IntegrityError, 1, 1),
])
def test_ingestion_retries_transient_failures_once_with_fresh_session(tmp_path, monkeypatch, error_type, failures, attempts):
    engine = database.create_database_engine(f"sqlite:///{tmp_path / 'retry.db'}")
    database.Base.metadata.create_all(engine)
    commits = []

    class UnreliableSession(Session):
        def commit(self):
            commits.append(self)
            if len(commits) <= failures:
                self.flush()
                raise error_type("COMMIT", {}, Exception("simulated database failure"))
            super().commit()

    monkeypatch.setattr(ingestion_service, "SessionLocal", sessionmaker(bind=engine, class_=UnreliableSession, autoflush=False))
    waits = []
    monkeypatch.setattr(ingestion_service, "sleep", waits.append)
    service = ingestion_service.IngestionService(api_key="test")
    service._unmatched_static["123"] = {"mmsi": "123", "data": {"name": "Saved metadata"}}
    service._pending_messages[("position", "123")] = {
        "type": "position", "mmsi": "123", "timestamp": datetime.utcnow(),
        "data": {"latitude": 50, "longitude": 0, "speed_over_ground": 12},
    }
    asyncio.run(service._flush_pending())
    assert len(commits) == len(set(commits)) == attempts
    assert waits == ([0.5] if attempts == 2 else [])
    saved = failures < attempts
    assert bool(service._pending_messages) == (not saved and error_type in (OperationalError, InterfaceError))
    with Session(engine) as db:
        assert db.query(PositionReportORM).count() == int(saved)
        if saved:
            assert db.get(VesselORM, "ais-123").name == "Saved metadata"
        else:
            assert service._unmatched_static["123"]["data"]["name"] == "Saved metadata"
    assert service._positions_ingested == int(saved)
    assert service._vessels_created == int(saved)
    assert service._vessels_updated == int(saved)
    engine.dispose()


@pytest.mark.parametrize("error_type", [OperationalError, InterfaceError])
def test_ingestion_keeps_pending_reports_until_database_recovers(tmp_path, monkeypatch, error_type):
    engine = database.create_database_engine(f"sqlite:///{tmp_path / 'recovery.db'}")
    database.Base.metadata.create_all(engine)
    commits = []

    class RecoveringSession(Session):
        def commit(self):
            commits.append(self)
            if len(commits) <= 2:
                self.flush()
                raise error_type("COMMIT", {}, Exception("database temporarily unavailable"))
            super().commit()

    monkeypatch.setattr(ingestion_service, "SessionLocal", sessionmaker(bind=engine, class_=RecoveringSession, autoflush=False))
    monkeypatch.setattr(ingestion_service, "sleep", lambda _: None)
    service = ingestion_service.IngestionService(api_key="test")
    service._pending_messages[("position", "123")] = {
        "type": "position", "mmsi": "123", "timestamp": datetime(2026, 1, 1),
        "data": {"latitude": 50, "longitude": 0, "speed_over_ground": 12},
    }
    service._running = True
    ticks = 0

    async def tick(_):
        nonlocal ticks
        ticks += 1
        if ticks == 2:
            service._running = False

    monkeypatch.setattr(ingestion_service.asyncio, "sleep", tick)
    asyncio.run(service._flush_loop())

    with Session(engine) as db:
        assert db.query(PositionReportORM).count() == 1
    assert len(commits) == 3
    assert service._positions_ingested == 1
    assert service._pending_messages == {}
    engine.dispose()


def test_ingestion_flush_preserves_reports_received_during_commit(monkeypatch):
    service = ingestion_service.IngestionService(api_key="test")
    key = ("position", "123")
    original = {"type": "position", "mmsi": "123", "timestamp": datetime(2026, 1, 1)}
    newer = {**original, "timestamp": original["timestamp"] + timedelta(minutes=1)}
    service._pending_messages[key] = original
    service._running = True

    async def tick(_):
        service._running = False

    async def commit(_, batch):
        assert batch == [original]
        service._pending_messages[key] = newer
        return "saved"

    monkeypatch.setattr(ingestion_service.asyncio, "sleep", tick)
    monkeypatch.setattr(ingestion_service.asyncio, "to_thread", commit)
    asyncio.run(service._flush_loop())
    assert service._pending_messages == {key: newer}


@pytest.mark.parametrize("url", ["not-a-url", "mysql://user:private@example.invalid/db"])
def test_invalid_database_url_does_not_echo_credentials(url):
    with pytest.raises(ValueError) as error:
        database.create_database_engine(url)
    assert "private" not in str(error.value)
