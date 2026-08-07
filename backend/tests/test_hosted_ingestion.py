import asyncio
import json
import threading

import pytest

from app.api.routes import list_regions
from app.data_sources.aisstream_adapter import AISStreamClient, DEFAULT_REGIONS, REGIONS
from app.services import ingestion_service


def test_hosted_subscription_and_region_picker_use_configured_area(monkeypatch):
    monkeypatch.setenv("HARBOROS_AIS_REGIONS", " la_harbor,la_harbor ")
    client = AISStreamClient(api_key="test-key")
    subscription = json.loads(client._build_subscription())
    assert subscription["BoundingBoxes"] == [REGIONS["la_harbor"]["bbox"]]
    assert client.stats["regions"] == ["la_harbor"]

    monkeypatch.setattr(ingestion_service, "_ingestion_service", None)
    assert list(list_regions()) == ["la_harbor"]


@pytest.mark.parametrize("value", ["", " , ", "unknown", "la_harbor,unknown"])
def test_invalid_region_config_cannot_fall_back_to_all_regions(monkeypatch, value):
    monkeypatch.setenv("HARBOROS_AIS_REGIONS", value)
    with pytest.raises(ValueError, match="valid monitoring region"):
        AISStreamClient(api_key="test-key")


def test_unconfigured_local_deployment_retains_all_regions(monkeypatch):
    monkeypatch.delenv("HARBOROS_AIS_REGIONS", raising=False)
    assert AISStreamClient().region_keys == DEFAULT_REGIONS


def test_explicit_region_selection_takes_precedence(monkeypatch):
    monkeypatch.setenv("HARBOROS_AIS_REGIONS", "la_harbor")
    assert AISStreamClient(region_keys=["black_sea"]).region_keys == ["black_sea"]
    with pytest.raises(ValueError):
        AISStreamClient(region_keys=[])


def test_alert_scan_runs_outside_the_ingestion_event_loop(monkeypatch):
    monkeypatch.setenv("HARBOROS_AIS_REGIONS", "la_harbor")
    service = ingestion_service.IngestionService(api_key="test-key")
    service._running = True
    event_loop_thread = threading.get_ident()
    scan_threads = []

    async def immediate_tick(delay):
        assert delay == 30

    def scan(archive):
        scan_threads.append(threading.get_ident())
        assert archive is False
        service._running = False

    monkeypatch.setattr(ingestion_service.asyncio, "sleep", immediate_tick)
    monkeypatch.setattr(service, "_run_alert_scan", scan)
    asyncio.run(service._alert_loop())
    assert len(scan_threads) == 1
    assert scan_threads[0] != event_loop_thread
