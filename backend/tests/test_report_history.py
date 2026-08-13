from datetime import datetime, timedelta, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.api.routes import router
from app.database import Base, get_db
from app.models.domain import AlertAuditORM, AlertORM, PositionReportORM, RiskHistoryORM, VesselORM


@pytest.fixture
def history_client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'reports.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False)
    with factory() as db:
        app = FastAPI()
        app.include_router(router, prefix="/api")
        app.dependency_overrides[get_db] = lambda: db
        db.add(VesselORM(id="saved", mmsi="123456789", name="Saved vessel", vessel_type="cargo", flag_state="US"))
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
    assert resolved["risk_assessment"]["score"] == 43
    assert len(resolved["alert_history"]) == 4
    assert any(alert["operator_notes"] == "Saved note active" for alert in resolved["alert_history"])


def test_vessel_detail_restores_notes_and_feedback_for_the_selected_alert(history_client):
    client, db = history_client
    for index, status in enumerate(("active", "dismissed")):
        db.add(AlertORM(
            id=f"review-{index}", vessel_id="saved", created_at=datetime(2026, 10, 31, index),
            status=status, risk_score=45, recommended_action="monitor", explanation="Fixture alert",
        ))
    db.commit()
    for alert_id, note in (("review-0", "Older alert note"), ("review-1", "First note"), ("review-1", "Second note")):
        assert client.post(f"/api/alerts/{alert_id}/action", json={"action": "note", "notes": note}).status_code == 200
    assert client.post("/api/alerts/review-1/action", json={"action": "feedback", "feedback": "confirmed"}).status_code == 200

    latest = client.get("/api/vessels/saved").json()
    assert latest["alert_id"] == "review-1"
    assert latest["alert_status"] == "dismissed"
    assert latest["alert_feedback"] == "confirmed"
    assert latest["operator_notes"] == ["First note", "Second note"]

    older = client.get("/api/vessels/saved", params={"alert_id": "review-0"}).json()
    assert older["alert_id"] == "review-0"
    assert older["alert_status"] == "active"
    assert older["alert_feedback"] is None
    assert older["operator_notes"] == ["Older alert note"]


def test_vessel_detail_rejects_alerts_from_another_vessel(history_client):
    client, db = history_client
    db.add(VesselORM(id="other", mmsi="987654321", vessel_type="cargo", flag_state="US"))
    db.flush()
    db.add(AlertORM(id="foreign-alert", vessel_id="other", status="active"))
    db.commit()
    for alert_id in ("foreign-alert", "missing-alert"):
        assert client.get("/api/vessels/saved", params={"alert_id": alert_id}).status_code == 404
    detail = client.get("/api/vessels/saved").json()
    assert detail["alert_id"] is None
    assert detail["operator_notes"] == []


def test_vessel_detail_preserves_legacy_note_storage(history_client):
    client, db = history_client
    db.add(AlertORM(id="legacy", vessel_id="saved", status="acknowledged", operator_notes="Legacy note"))
    db.commit()
    assert client.get("/api/vessels/saved").json()["operator_notes"] == ["Legacy note"]
    db.add(AlertAuditORM(alert_id="legacy", action="noted", details="Legacy note"))
    db.add(AlertAuditORM(alert_id="legacy", action="feedback", details="not json"))
    db.commit()
    assert client.get("/api/vessels/saved").json()["operator_notes"] == ["Legacy note"]


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


@pytest.mark.parametrize("score", [None, 0, 12.5, 42])
def test_vessel_views_use_saved_assessments_without_active_alerts(history_client, score):
    client, db = history_client
    assessed_at = datetime(2026, 10, 31, 8)
    action = "monitor" if score == 42 else "ignore"
    if score is not None:
        db.add(RiskHistoryORM(vessel_id="saved", risk_score=score, recommended_action=action, timestamp=assessed_at))
        db.commit()
    expected_time = assessed_at.replace(tzinfo=timezone.utc) if score is not None else None
    for data in (client.get("/api/vessels").json()["items"][0], client.get("/api/vessels/saved").json()):
        assert data["risk_score"] == score
        assert data["recommended_action"] == (action if score is not None else None)
        assert (datetime.fromisoformat(data["risk_assessed_at"]) if data["risk_assessed_at"] else None) == expected_time
    report = client.get("/api/vessels/saved/report").json()["risk_assessment"]
    assert report["score"] == score
    assert report["recommended_action"] == (action if score is not None else None)
    assert (datetime.fromisoformat(report["assessed_at"]) if report["assessed_at"] else None) == expected_time


def test_latest_assessment_overrides_old_alert_and_uses_timestamp_then_id(history_client):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    db.add(AlertORM(
        id="old-active", vessel_id="saved", risk_score=80, recommended_action="escalate",
        created_at=now - timedelta(minutes=10), explanation="Old finding",
        anomaly_signals_json='[{"anomaly_type":"ais_gap","severity":0.8,"description":"Old gap"}]',
    ))
    db.add_all([
        RiskHistoryORM(vessel_id="saved", risk_score=20, recommended_action="ignore", timestamp=now),
        RiskHistoryORM(vessel_id="saved", risk_score=12, recommended_action="ignore", timestamp=now),
        RiskHistoryORM(vessel_id="saved", risk_score=70, recommended_action="verify", timestamp=now - timedelta(minutes=1)),
    ])
    db.commit()
    listed = client.get("/api/vessels").json()["items"][0]
    detail = client.get("/api/vessels/saved").json()
    report = client.get("/api/vessels/saved/report").json()
    for data in (listed, detail):
        assert data["risk_score"] == 12
        assert datetime.fromisoformat(data["risk_assessed_at"]) == now.replace(tzinfo=timezone.utc)
    assert detail["explanation"] is None
    assert detail["anomaly_signals"] == []
    assert report["risk_assessment"]["score"] == 12
    assert report["risk_assessment"]["explanation"] is None
    assert report["anomaly_signals"] == []
    assert report["alert_history"][0]["risk_score"] == 80


def test_report_and_replay_use_assessments_at_the_requested_cutoff(history_client, monkeypatch):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    monkeypatch.setattr("app.data_sources.nws_adapter.get_weather", lambda *args: None)
    db.add(PositionReportORM(vessel_id="saved", timestamp=now, latitude=33.7, longitude=-118.2))
    db.add_all([
        RiskHistoryORM(vessel_id="saved", risk_score=12, recommended_action="ignore", timestamp=now),
        RiskHistoryORM(vessel_id="saved", risk_score=70, recommended_action="verify", timestamp=now + timedelta(minutes=1)),
    ])
    db.commit()
    cutoff = now.replace(tzinfo=timezone.utc).isoformat()
    report = client.get("/api/vessels/saved/report", params={"until": cutoff}).json()["risk_assessment"]
    assert report["score"] == 12
    assert report["assessed_at"] == cutoff
    replay = client.get("/api/vessels/positions/at-time", params={"timestamp": cutoff}).json()[0]
    assert replay["risk_score"] == 12
    assert replay["risk_assessed_at"] == cutoff
    before = client.get("/api/vessels/saved/report", params={"until": (now - timedelta(seconds=1)).isoformat()}).json()
    assert before["risk_assessment"]["score"] is None


@pytest.mark.parametrize("status", ["active", "dismissed", "resolved"])
def test_alert_only_assessment_keeps_score_without_inventing_assessment_time(history_client, status):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    db.add_all([
        AlertORM(id="a", vessel_id="saved", risk_score=40, recommended_action="monitor", created_at=now, status=status),
        AlertORM(id="b", vessel_id="saved", risk_score=52, recommended_action="monitor", created_at=now, status=status),
    ])
    db.commit()
    for data in (client.get("/api/vessels").json()["items"][0], client.get("/api/vessels/saved").json()):
        assert data["risk_score"] == 52
        assert data["risk_assessed_at"] is None
    report = client.get("/api/vessels/saved/report").json()["risk_assessment"]
    assert report["score"] == 52
    assert report["assessed_at"] is None
    before = client.get("/api/vessels/saved/report", params={"until": (now - timedelta(seconds=1)).isoformat()}).json()
    assert before["risk_assessment"]["score"] is None


@pytest.mark.parametrize("has_snapshot", [False, True])
def test_historical_views_do_not_reuse_mutable_alert_score_or_findings(history_client, has_snapshot):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    alert = AlertORM(
        id="mutable", vessel_id="saved", risk_score=40, recommended_action="monitor",
        created_at=now, explanation="Original finding",
    )
    db.add(alert)
    db.add(PositionReportORM(vessel_id="saved", timestamp=now, latitude=33.7, longitude=-118.2))
    if has_snapshot:
        db.add(RiskHistoryORM(vessel_id="saved", risk_score=52, recommended_action="monitor", timestamp=now))
    db.commit()
    alert.risk_score = 52
    alert.explanation = "Finding added after the report cutoff"
    alert.anomaly_signals_json = '[{"anomaly_type":"ais_gap","severity":0.8,"description":"Later gap"}]'
    db.commit()
    cutoff = (now + timedelta(minutes=30)).replace(tzinfo=timezone.utc).isoformat()
    report = client.get("/api/vessels/saved/report", params={"until": cutoff}).json()
    assert report["risk_assessment"]["score"] == (52 if has_snapshot else None)
    assert report["risk_assessment"]["explanation"] is None
    assert report["anomaly_signals"] == []
    replay = client.get("/api/vessels/positions/at-time", params={"timestamp": cutoff}).json()[0]
    assert replay["risk_score"] == (52 if has_snapshot else None)
    current = client.get("/api/vessels/saved/report").json()
    assert current["risk_assessment"]["score"] == 52
    assert current["risk_assessment"]["explanation"] == alert.explanation


def test_vessel_list_fetches_assessments_in_batches(history_client):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    for index in range(500):
        db.add(VesselORM(id=f"v{index}", mmsi=str(index), name=f"Vessel {index}", vessel_type="cargo", flag_state="US"))
        db.add(RiskHistoryORM(vessel_id=f"v{index}", risk_score=index % 35, recommended_action="ignore", timestamp=now))
    db.commit()
    queries = []
    def record_query(connection, cursor, statement, parameters, context, executemany):
        queries.append(statement)
    event.listen(db.bind, "before_cursor_execute", record_query)
    try:
        response = client.get("/api/vessels", params={"limit": 1000})
    finally:
        event.remove(db.bind, "before_cursor_execute", record_query)
    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["items"]}
    assert len(items) == 501
    assert items["saved"]["risk_score"] is None
    assert all(items[f"v{index}"]["risk_score"] == index % 35 for index in range(500))
    assert len(queries) <= 5


def test_distribution_excludes_unassessed_vessels_and_uses_actual_scores(history_client):
    client, db = history_client
    now = datetime(2026, 10, 31, 8)
    for name, score, action in (("zero", 0, "ignore"), ("low", 12, "ignore"), ("critical", 100, "escalate"), ("updated", 20, "ignore"), ("resolved", 60, "verify")):
        db.add(VesselORM(id=name, mmsi=name, name=name, vessel_type="cargo", flag_state="US"))
        if name != "resolved":
            db.add(RiskHistoryORM(vessel_id=name, risk_score=score, recommended_action=action, timestamp=now))
    db.add_all([
        AlertORM(id="old", vessel_id="updated", risk_score=80, recommended_action="escalate", created_at=now - timedelta(minutes=1),
                 anomaly_signals_json='[{"anomaly_type":"old_gap"}]'),
        AlertORM(id="critical", vessel_id="critical", risk_score=100, recommended_action="escalate", created_at=now,
                 anomaly_signals_json='[{"anomaly_type":"ais_gap"}]'),
        AlertORM(id="resolved", vessel_id="resolved", risk_score=60, recommended_action="verify", created_at=now, status="resolved"),
    ])
    db.commit()
    response = client.get("/api/analytics/distribution")
    assert response.status_code == 200
    data = response.json()
    assert data["unassessed_count"] == 1
    bins = {entry["bin_start"]: entry for entry in data["histogram"]}
    assert sum(entry["count_active"] for entry in bins.values()) == 5
    assert bins[0]["count_active"] == 1
    assert bins[10]["count_active"] == 1
    assert bins[20]["count_active"] == 1
    assert bins[95]["count_active"] == 1
    assert bins[95]["bin_end"] == 100
    assert bins[60]["count_active"] == 1
    assert sum(entry["count_resolved"] for entry in bins.values()) == 0
    tiers = {entry["action"]: entry for entry in data["tiers"]}
    assert tiers["normal"]["count"] == 3
    assert tiers["escalate"]["count"] == 1
    assert tiers["escalate"]["top_signals"] == {"ais_gap": 1}


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
