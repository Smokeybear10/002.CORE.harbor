from datetime import datetime, timedelta, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes import router
from app.database import Base, get_db
from app.models.domain import AlertAuditORM, AlertORM, PositionReportORM, VesselORM


@pytest.fixture
def history_client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'reports.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False)
    with factory() as db:
        app = FastAPI()
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_db] = lambda: db
        db.add(VesselORM(id="saved", mmsi="123456789", name="Saved vessel"))
        db.commit()
        with TestClient(app) as client:
            yield client, db
    engine.dispose()


def add_positions(db, count=75):
    start = datetime(2026, 10, 31, 8)
    db.add_all([
        PositionReportORM(vessel_id="saved", timestamp=start + timedelta(minutes=index), latitude=33.7, longitude=-118.2)
        for index in range(count)
    ])
    db.commit()
    return start


def test_report_keeps_full_retained_range_and_pages_older_positions(history_client):
    client, db = history_client
    start = add_positions(db)
    first = client.get("/api/vessels/saved/report").json()
    assert len(first["position_trail"]) == 50
    assert first["history"]["position_count"] == 75
    assert first["history"]["oldest_report_at"] == start.replace(tzinfo=timezone.utc).isoformat()
    assert first["history"]["durable"] is False
    second = client.get("/api/vessels/saved/report", params=next_positions(first)).json()
    assert len(second["position_trail"]) == 25
    assert second["position_trail"][0]["timestamp"] == first["history"]["oldest_report_at"]
    assert second["latest_position"] == first["latest_position"]
    assert {point["timestamp"] for point in first["position_trail"]}.isdisjoint(
        point["timestamp"] for point in second["position_trail"]
    )


def test_historical_alerts_notes_and_audit_survive_resolution(history_client):
    client, db = history_client
    for index, status in enumerate(("dismissed", "acknowledged", "pinned", "active")):
        db.add(AlertORM(
            id=f"alert-{index}", vessel_id="saved", created_at=datetime(2026, 10, 31, index),
            status=status, risk_score=40 + index, recommended_action="monitor", operator_notes=f"Saved note {status}",
        ))
        db.add(AlertAuditORM(alert_id=f"alert-{index}", action=status, timestamp=datetime(2026, 10, 31, index)))
    db.commit()
    report = client.get("/api/vessels/saved/report").json()
    assert {alert["status"] for alert in report["alert_history"]} == {"dismissed", "acknowledged", "pinned", "active"}
    assert all(alert["operator_notes"].startswith("Saved note") for alert in report["alert_history"])
    assert report["alert_history_total"] == 4
    assert len(report["alert_audit_trail"]) == 4
    assert report["risk_assessment"]["score"] == 43
    db.query(AlertORM).filter(AlertORM.status == "active").update({"status": "dismissed"})
    db.commit()
    resolved = client.get("/api/vessels/saved/report").json()
    assert resolved["risk_assessment"]["score"] == 0
    assert len(resolved["alert_history"]) == 4
    assert any(alert["operator_notes"] == "Saved note active" for alert in resolved["alert_history"])


def test_alert_history_is_paginated_and_report_cutoff_stays_stable(history_client):
    client, db = history_client
    start = add_positions(db, 2)
    for index in range(55):
        db.add(AlertORM(id=f"alert-{index:02d}", vessel_id="saved", created_at=start + timedelta(minutes=index), status="dismissed"))
    db.commit()
    cutoff = (start + timedelta(minutes=54)).replace(tzinfo=timezone.utc).isoformat()
    first = client.get("/api/vessels/saved/report", params={"until": cutoff}).json()
    older = client.get("/api/vessels/saved/report", params={"until": cutoff, "alert_offset": 50}).json()
    assert len(first["alert_history"]) == 50
    assert len(older["alert_history"]) == 5
    assert first["alert_history_total"] == older["alert_history_total"] == 55
    db.add(PositionReportORM(vessel_id="saved", timestamp=start + timedelta(hours=1), latitude=34, longitude=-118))
    db.commit()
    assert client.get("/api/vessels/saved/report", params={"until": cutoff}).json()["history"]["position_count"] == 2


def test_positions_api_filters_utc_time_and_paginates(history_client):
    client, db = history_client
    add_positions(db, 10)
    filters = {"since": "2026-10-31T04:02:00-04:00", "until": "2026-10-31T08:06:00Z", "limit": 2}
    first = client.get("/api/vessels/saved/positions", params=filters)
    assert first.status_code == 200
    body = first.json()
    assert body["total"] == 5
    assert [point["timestamp"] for point in body["items"]] == ["2026-10-31T08:06:00+00:00", "2026-10-31T08:05:00+00:00"]
    second = client.get("/api/vessels/saved/positions", params={**filters, "offset": 2}).json()
    assert second["items"][0]["timestamp"] == "2026-10-31T08:04:00+00:00"
    assert client.get("/api/vessels/saved/positions", params={"since": "2026-11-01", "until": "2026-10-31"}).status_code == 422
    assert client.get("/api/vessels/saved/positions", params={"limit": 1001}).status_code == 422
    assert client.get("/api/vessels/saved/report", params={"position_before_id": -1}).status_code == 422
    assert client.get("/api/vessels/saved/report", params={"position_before_id": 1}).status_code == 422
    assert client.get("/api/vessels/saved/report", params={"position_before": "2026-10-31T08:00:00Z"}).status_code == 422


def test_missing_and_empty_history_are_explicit(history_client):
    client, _ = history_client
    for endpoint in ("report", "positions"):
        assert client.get(f"/api/vessels/missing/{endpoint}").status_code == 404
    report = client.get("/api/vessels/saved/report").json()
    assert report["history"]["position_count"] == 0
    assert report["history"]["oldest_report_at"] is None
    assert report["position_trail"] == []
    status = client.get("/api/storage/status").json()
    assert status["backend"] == "sqlite"
    assert status["durable"] is False
    assert status["position_count"] == 0


def next_positions(report):
    cursor = report["history"]["next_position_cursor"]
    return {"position_before": cursor["timestamp"], "position_before_id": cursor["id"], "until": report["history"]["until"]}


def test_cursor_does_not_skip_a_position_when_latest_bucket_advances_past_cutoff(history_client):
    client, db = history_client
    start = add_positions(db)
    first = client.get("/api/vessels/saved/report").json()
    latest = db.query(PositionReportORM).order_by(PositionReportORM.timestamp.desc()).first()
    latest.timestamp = datetime.fromisoformat(first["history"]["until"]).replace(tzinfo=None) + timedelta(seconds=1)
    db.commit()
    second = client.get("/api/vessels/saved/report", params=next_positions(first)).json()
    assert second["history"]["position_count"] == 74
    assert second["history"]["position_offset"] == 49
    assert len(second["position_trail"]) == 25
    assert second["position_trail"][-1]["timestamp"] == (start + timedelta(minutes=24)).replace(tzinfo=timezone.utc).isoformat()
    assert second["history"]["next_position_cursor"] is None


def test_cursor_uses_id_to_disambiguate_identical_timestamps(history_client):
    client, db = history_client
    start = datetime(2026, 10, 31, 8)
    db.add_all([
        PositionReportORM(vessel_id="saved", timestamp=start, latitude=33 + index / 1000, longitude=-118)
        for index in range(75)
    ])
    db.commit()
    first = client.get("/api/vessels/saved/report").json()
    second = client.get("/api/vessels/saved/report", params=next_positions(first)).json()
    assert len(first["position_trail"]) == 50
    assert len(second["position_trail"]) == 25
    assert len({point["latitude"] for point in first["position_trail"] + second["position_trail"]}) == 75


def test_cursor_does_not_skip_retained_positions_when_other_samples_are_pruned(history_client):
    client, db = history_client
    start = add_positions(db)
    first = client.get("/api/vessels/saved/report").json()
    db.query(PositionReportORM).filter(
        PositionReportORM.timestamp >= start + timedelta(minutes=60),
    ).delete()
    db.commit()
    second = client.get("/api/vessels/saved/report", params=next_positions(first)).json()
    assert second["history"]["position_count"] == 60
    assert second["history"]["position_offset"] == 35
    assert len(second["position_trail"]) == 25


def test_pruned_older_page_is_empty_and_first_page_remains_accessible(history_client):
    client, db = history_client
    start = add_positions(db)
    first = client.get("/api/vessels/saved/report").json()
    db.query(PositionReportORM).filter(PositionReportORM.timestamp < start + timedelta(minutes=25)).delete()
    db.commit()
    older = client.get("/api/vessels/saved/report", params=next_positions(first)).json()
    assert older["history"]["position_count"] == 50
    assert older["history"]["position_offset"] == 50
    assert older["position_trail"] == []
    assert older["history"]["next_position_cursor"] is None
    newer = client.get("/api/vessels/saved/report", params={"until": first["history"]["until"]}).json()
    assert newer["history"]["position_offset"] == 0
    assert len(newer["position_trail"]) == 50
