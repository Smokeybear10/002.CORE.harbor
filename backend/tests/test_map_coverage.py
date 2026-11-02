import asyncio
from contextlib import suppress
from datetime import datetime, timedelta, timezone
import json
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from websockets.asyncio.server import serve

from app.api.routes import router
from app.database import Base, get_db
from app.data_sources import aisstream_adapter
from app.models.domain import AlertORM, PositionReportORM, RiskHistoryORM, VerificationRequestORM, VesselORM
from app.services import alert_service, archive_service, ingestion_service, map_coverage
from app.services.map_coverage import CoverageRequest, MapBounds, ViewportSubscriptions, vessels_in_bounds


def bounds(west=-2, south=49, east=2, north=51):
    return MapBounds(west=west, south=south, east=east, north=north)


def request(client_id=None, revision=1, area=None):
    return CoverageRequest(client_id=client_id or uuid4(), revision=revision, bounds=area or bounds())


@pytest.fixture
def database(tmp_path, monkeypatch):
    engine = create_engine(f"sqlite:///{tmp_path / 'map.db'}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False)
    monkeypatch.setattr(ingestion_service, "SessionLocal", factory)
    with factory() as db:
        yield db
    engine.dispose()


def position(vessel_id, timestamp, lon=0, lat=50):
    return PositionReportORM(vessel_id=vessel_id, timestamp=timestamp, longitude=lon, latitude=lat, speed_over_ground=12)


def test_viewers_share_coverage_without_overwriting_each_other(monkeypatch):
    clock = [0.0]
    monkeypatch.setattr(map_coverage, "monotonic", lambda: clock[0])
    subscriptions = ViewportSubscriptions()
    first = request()
    second = request(area=bounds(100, 0, 105, 4))
    assert subscriptions.update(first) == "watching"
    assert subscriptions.update(second) == "watching"
    assert len(subscriptions.boxes()) == 2
    clock[0] = 30
    subscriptions.update(second)
    clock[0] = 46
    assert subscriptions.boxes() == second.bounds.boxes()
    clock[0] = 76
    assert subscriptions.boxes() == []


def test_old_requests_cannot_restore_released_coverage():
    subscriptions = ViewportSubscriptions()
    first = request()
    subscriptions.update(first)
    subscriptions.update(CoverageRequest(client_id=first.client_id, revision=3, bounds=None))
    assert subscriptions.update(first) == "superseded"
    assert subscriptions.boxes() == []


def test_large_views_release_subscription_and_busy_viewers_do_not_steal_slots():
    subscriptions = ViewportSubscriptions()
    viewers = [request() for _ in range(map_coverage.MAX_VIEWERS)]
    for viewer in viewers:
        assert subscriptions.update(viewer) == "watching"
    assert subscriptions.update(request()) == "busy"
    assert subscriptions.update(request(viewers[0].client_id, 2, bounds(-180, -85, 180, 85))) == "zoom_in"
    assert subscriptions.update(request()) == "watching"
    assert len(subscriptions.leases) == map_coverage.MAX_VIEWERS + 1


@pytest.mark.parametrize("changes", [{"west": float("nan")}, {"north": float("inf")}, {"west": -181}, {"north": 49}, {"east": -2}])
def test_invalid_bounds_are_rejected(changes):
    with pytest.raises(ValidationError):
        MapBounds.model_validate({**bounds().model_dump(), **changes})


@pytest.mark.parametrize("timestamp", ["2026-11-02T12:00:00", "2026-11-02T12:00:00Z"])
def test_reports_outside_named_regions_are_accepted_with_utc_time(timestamp):
    client = aisstream_adapter.AISStreamClient(api_key="test", region_keys=["la_harbor"])
    report = client._parse_message({
        "MessageType": "PositionReport",
        "MetaData": {"MMSI": 123456789, "time_utc": timestamp},
        "Message": {"PositionReport": {"Latitude": -33.8, "Longitude": 151.2}},
    })
    assert report["data"]["longitude"] == 151.2
    assert report["region"] is None
    assert report["timestamp"].utcoffset() == timedelta(0)


def test_date_line_boxes_and_latest_position_filter(database):
    crossing = bounds(178, -20, -178, -16)
    assert crossing.is_browsable
    assert len(crossing.boxes()) == 2
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for name in ("west", "east", "outside", "moved"):
        database.add(VesselORM(id=name, mmsi=name))
    database.flush()
    database.add_all([
        position("west", now, 179, -18), position("east", now, -179, -18),
        position("outside", now, 0, -18), position("moved", now, 0, -18),
        position("moved", now - timedelta(minutes=1), 179, -18),
    ])
    database.commit()
    assert set(database.scalars(vessels_in_bounds(database, crossing))) == {"west", "east"}


def test_http_viewport_filters_vessels_and_alerts_and_validates_input(database, monkeypatch):
    service = ingestion_service.IngestionService(api_key="test-key", region_keys=["la_harbor"])
    monkeypatch.setattr(ingestion_service, "_ingestion_service", service)
    app = FastAPI()
    app.include_router(router, prefix="/api")
    app.dependency_overrides[get_db] = lambda: database
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for name, lon in (("here", 0), ("elsewhere", 100)):
        database.add(VesselORM(id=name, mmsi=name, name=name, vessel_type="cargo", flag_state="Unknown"))
        database.add(position(name, now, lon))
        database.add(AlertORM(id=name, vessel_id=name, risk_score=40, recommended_action="monitor", explanation="Test alert"))
    database.commit()
    client = TestClient(app)
    for endpoint in ("vessels", "alerts"):
        response = client.get(f"/api/{endpoint}", params={"bounds": bounds().model_dump_json()})
        assert response.status_code == 200, response.text
        assert response.json()["total"] == 1
        assert response.json()["items"][0]["id"] == "here"
    payload = request().model_dump(mode="json")
    assert client.post("/api/map/coverage", json=payload).json() == {"state": "watching", "subscribed": False, "expires_in": 45}
    assert client.post("/api/map/coverage", json={**payload, "client_id": "invalid"}).status_code == 422
    assert client.get("/api/vessels", params={"bounds": "bad"}).status_code == 422
    assert "english_channel" in client.get("/api/regions?explore=true").json()


def test_pruning_preserves_notes_and_ignores_null_verification_ids(database):
    service = ingestion_service.IngestionService(api_key="test", region_keys=["la_harbor"])
    database.add_all([VesselORM(id=name, mmsi=name) for name in ("ais-orphan", "ais-notes", "ais-current")])
    database.add(VerificationRequestORM(id="coordinates-only", vessel_id=None))
    database.add(AlertORM(id="notes", vessel_id="ais-notes", operator_notes="Keep this note"))
    database.add(RiskHistoryORM(vessel_id="ais-orphan", risk_score=0))
    database.add(position("ais-current", datetime.now(timezone.utc).replace(tzinfo=None)))
    database.commit()
    service._prune_live_cache(database)
    assert database.get(VesselORM, "ais-orphan") is None
    assert database.get(VesselORM, "ais-current") is not None
    assert database.get(AlertORM, "notes").operator_notes == "Keep this note"
    assert database.query(RiskHistoryORM).count() == 0


def test_static_metadata_waits_for_position_and_position_samples_stay_current(database):
    service = ingestion_service.IngestionService(api_key="test", region_keys=["la_harbor"])
    start = datetime(2026, 11, 2, 10, 0, tzinfo=timezone.utc)
    static = {"type": "static", "mmsi": "123456789", "timestamp": start, "data": {"name": "TEST SHIP", "vessel_type": "cargo"}}
    service._flush_batch([static])
    assert database.query(VesselORM).count() == 0
    message = {"type": "position", "mmsi": "123456789", "timestamp": start, "data": {"latitude": 50, "longitude": 0, "speed_over_ground": 12}}
    for seconds in (0, 5, 10, 31, 35, 4):
        service._flush_batch([{**message, "timestamp": start + timedelta(seconds=seconds)}])
    database.expire_all()
    vessel = database.get(VesselORM, "ais-123456789")
    assert vessel.name == "TEST SHIP" and vessel.vessel_type == "cargo"
    positions = database.query(PositionReportORM).order_by(PositionReportORM.timestamp).all()
    assert len(positions) == 2
    assert positions[-1].timestamp == (start + timedelta(seconds=35)).replace(tzinfo=None)


def test_live_cache_archives_evicted_reports_and_stays_bounded(database, tmp_path, monkeypatch):
    monkeypatch.setattr(archive_service, "ARCHIVE_DIR", tmp_path / "archive")
    service = ingestion_service.IngestionService(api_key="test", region_keys=["la_harbor"])
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    database.add(VesselORM(id="ais-capacity", mmsi="123456789"))
    database.commit()
    database.bulk_insert_mappings(PositionReportORM, [
        {"vessel_id": "ais-capacity", "timestamp": now + timedelta(microseconds=index), "latitude": 50, "longitude": 0}
        for index in range(50_010)
    ])
    database.commit()
    service._prune_live_cache(database)
    assert database.query(PositionReportORM).count() == 50_000
    assert archive_service.get_archive_stats()["total_rows"] == 10


def test_shutdown_drains_reports_received_between_flushes(database):
    service = ingestion_service.IngestionService(api_key="test", region_keys=["la_harbor"])
    message = {"type": "position", "mmsi": "987654321", "timestamp": datetime.now(timezone.utc), "data": {"latitude": 50, "longitude": 0}}
    service._pending_messages[("position", message["mmsi"])] = message
    asyncio.run(service.stop())
    assert service._pending_messages == {}
    assert database.get(VesselORM, "ais-987654321") is not None


def test_live_alert_scans_rotate_and_exclude_unobserved_history(database, monkeypatch):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    epoch = now - timedelta(minutes=1)
    for index in range(3):
        name = f"ais-{index}"
        database.add(VesselORM(id=name, mmsi=name, name=name, vessel_type="cargo", flag_state="Unknown"))
        database.add_all([position(name, now - timedelta(minutes=15)), position(name, now)])
    database.commit()
    scans = []
    def detect(vessel, positions, *args, **kwargs):
        scans.append((vessel.id, [p.timestamp for p in positions], {neighbor[0] for neighbor in kwargs["nearby_vessels"]}))
        return []
    monkeypatch.setattr(alert_service, "run_anomaly_detection", detect)
    monkeypatch.setattr(alert_service, "get_weather", lambda *args, **kwargs: None)
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)
    for offset in (0, 2):
        alert_service.generate_alerts_for_all_vessels(database, vessel_limit=2, vessel_offset=offset, observed_since=epoch)
    assert {item[0] for item in scans} == {"ais-0", "ais-1", "ais-2"}
    assert all(times == [now] for _, times, _ in scans)
    assert all(neighbors == {"ais-0", "ais-1", "ais-2"} for _, _, neighbors in scans)


def test_other_viewers_do_not_reset_continuous_observation():
    client = aisstream_adapter.AISStreamClient(api_key="test", region_keys=["la_harbor"])
    first = bounds()
    second = bounds(100, 0, 105, 4)
    client._pending_boxes = first.boxes()
    client._confirm_subscription()
    first_started = client.coverage_windows[0][1]
    client._pending_boxes = first.boxes() + second.boxes()
    client._confirm_subscription()
    assert client.coverage_windows[0] == (first, first_started)
    assert client.coverage_windows[1][1] > first_started
    smaller = bounds(-1, 49.5, 1, 50.5)
    client._pending_boxes = smaller.boxes() + second.boxes()
    client._confirm_subscription()
    assert client.coverage_windows[0] == (smaller, first_started)


def test_new_observation_window_cannot_resolve_existing_alert(database, monkeypatch):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    database.add(VesselORM(id="ais-alert", mmsi="123456789", vessel_type="cargo"))
    database.add(position("ais-alert", now))
    database.add(AlertORM(id="keep-alert", vessel_id="ais-alert", risk_score=52, status="active", explanation="Previously observed behavior"))
    database.commit()
    monkeypatch.setattr(alert_service, "get_weather", lambda *args, **kwargs: None)
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)
    alert_service.generate_alerts_for_all_vessels(database, vessel_limit=500, coverage_windows=[(bounds(), now - timedelta(seconds=2))])
    alert = database.get(AlertORM, "keep-alert")
    assert alert.status == "active" and alert.risk_score == 52


def test_live_weather_refresh_is_bounded_and_independent_of_details(database, monkeypatch):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    for index in range(8):
        database.add(VesselORM(id=f"ais-weather-{index}", mmsi=str(index), vessel_type="cargo", flag_state="US"))
        database.add(position(f"ais-weather-{index}", now, -74, 35 + index))
    database.commit()
    warmed = []
    def weather(lat, lon, *, cached_only=False):
        if not cached_only:
            warmed.append((lat, lon))
        return None
    monkeypatch.setattr(alert_service, "get_weather", weather)
    monkeypatch.setattr(alert_service, "run_anomaly_detection", lambda *args, **kwargs: [])
    monkeypatch.setattr(alert_service, "refresh_baseline", lambda db: None)
    alert_service.generate_alerts_for_all_vessels(database, vessel_limit=500, vessel_offset=0)
    assert len(warmed) == len(set(warmed)) == 4
    alert_service.generate_alerts_for_all_vessels(database, vessel_limit=500, vessel_offset=500)
    assert len(warmed) == len(set(warmed)) == 8


def test_upstream_replaces_subscription_without_another_connection(monkeypatch):
    async def run():
        subscriptions = asyncio.Queue()
        async def upstream(ws):
            async for raw in ws:
                data = json.loads(raw)
                await subscriptions.put(data)
                await ws.send(json.dumps({"MessageType": "SubscriptionConfirmation", "Message": {"CompressionEnabled": True}}))
        async with serve(upstream, "127.0.0.1", 0) as server:
            monkeypatch.setattr(aisstream_adapter, "AISSTREAM_WS_URL", f"ws://127.0.0.1:{server.sockets[0].getsockname()[1]}")
            client = aisstream_adapter.AISStreamClient(api_key="test", region_keys=["la_harbor"])
            async def consume():
                async for _ in client.connect():
                    pass
            task = asyncio.create_task(consume())
            try:
                first = await asyncio.wait_for(subscriptions.get(), 3)
                assert first["BoundingBoxes"] == client.bounding_boxes
                await asyncio.sleep(0.05)
                first_epoch = client.coverage_started
                assert client.is_connected
                view = request(area=bounds(100, 0, 105, 4))
                client.viewports.update(view)
                second = await asyncio.wait_for(subscriptions.get(), 3)
                assert second["BoundingBoxes"] == view.bounds.boxes()
                await asyncio.sleep(0.05)
                assert client.applied_boxes == view.bounds.boxes()
                assert client.coverage_started > first_epoch
            finally:
                await client.disconnect()
                task.cancel()
                with suppress(asyncio.CancelledError):
                    await task
    asyncio.run(run())
