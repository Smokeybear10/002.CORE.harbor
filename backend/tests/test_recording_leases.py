from uuid import uuid4

import pytest

from app.services import map_coverage
from app.services.map_coverage import CoverageRequest, MapBounds, ViewportSubscriptions


@pytest.fixture
def clock(monkeypatch):
    value = [0.0]
    monkeypatch.setattr(map_coverage, "monotonic", lambda: value[0])
    return value


def request(client_id=None, revision=1, background=False, bounds=None):
    return CoverageRequest(
        client_id=client_id or uuid4(), revision=revision, background=background,
        bounds=bounds or MapBounds(west=-2, south=49, east=2, north=51),
    )


def test_background_renewals_survive_timer_throttling_but_eventually_expire(clock):
    subscriptions = ViewportSubscriptions()
    watch = request(background=True)
    assert subscriptions.update(watch) == "watching"
    assert watch.lease_seconds == 900
    clock[0] = 120
    assert subscriptions.boxes() == watch.bounds.boxes()
    subscriptions.update(watch)
    clock[0] = 1019
    assert subscriptions.boxes() == watch.bounds.boxes()
    clock[0] = 1020
    assert subscriptions.boxes() == []


def test_late_foreground_renewal_does_not_shorten_background_watch(clock):
    subscriptions = ViewportSubscriptions()
    foreground = request()
    subscriptions.update(foreground)
    clock[0] = 10
    subscriptions.update(foreground.model_copy(update={"background": True}))
    clock[0] = 11
    subscriptions.update(foreground)
    clock[0] = 100
    assert subscriptions.boxes() == foreground.bounds.boxes()
    assert subscriptions.leases[foreground.client_id][2] == 910


def test_resuming_with_new_revision_restores_short_foreground_expiry(clock):
    subscriptions = ViewportSubscriptions()
    background = request(background=True)
    subscriptions.update(background)
    clock[0] = 10
    resumed = background.model_copy(update={"revision": 2, "background": False})
    subscriptions.update(resumed)
    assert resumed.lease_seconds == 45
    clock[0] = 56
    assert subscriptions.boxes() == []


def test_close_releases_immediately_and_rejects_delayed_background_requests(clock):
    subscriptions = ViewportSubscriptions()
    watch = request(background=True)
    subscriptions.update(watch)
    clock[0] = 10
    release = watch.model_copy(update={"revision": 2, "bounds": None})
    assert subscriptions.update(release) == "zoom_in"
    assert subscriptions.boxes() == []
    clock[0] = 120
    assert subscriptions.update(watch) == "superseded"
    assert subscriptions.update(watch.model_copy(update={"revision": 2})) == "superseded"
    assert subscriptions.boxes() == []
    assert subscriptions.update(watch.model_copy(update={"revision": 3})) == "watching"


def test_same_revision_cannot_change_the_watched_area(clock):
    subscriptions = ViewportSubscriptions()
    watch = request(background=True)
    subscriptions.update(watch)
    other = watch.model_copy(update={"bounds": MapBounds(west=100, south=0, east=104, north=3)})
    assert subscriptions.update(other) == "superseded"
    assert subscriptions.boxes() == watch.bounds.boxes()


def test_background_watch_still_obeys_viewer_capacity(clock):
    subscriptions = ViewportSubscriptions()
    for _ in range(map_coverage.MAX_VIEWERS):
        assert subscriptions.update(request(background=True)) == "watching"
    assert subscriptions.update(request(background=True)) == "busy"
    clock[0] = 901
    assert subscriptions.update(request(background=True)) == "watching"


@pytest.mark.parametrize("active_count", [0, 3])
def test_closed_sessions_do_not_exhaust_capacity(clock, active_count):
    subscriptions = ViewportSubscriptions()
    active = [request(background=True) for _ in range(active_count)]
    for watch in active:
        assert subscriptions.update(watch) == "watching"

    closed = []
    for index in range(map_coverage.MAX_VIEWERS * 8 + 1):
        clock[0] = index + 1
        watch = request(background=True)
        assert subscriptions.update(watch) == "watching"
        assert subscriptions.update(watch.model_copy(update={"revision": 2, "bounds": None})) == "zoom_in"
        closed.append(watch)

    assert len(subscriptions.leases) == map_coverage.MAX_VIEWERS * 8
    assert closed[0].client_id not in subscriptions.leases
    assert subscriptions.update(closed[-1]) == "superseded"
    assert subscriptions.update(closed[-1].model_copy(update={"revision": 2})) == "superseded"
    assert subscriptions.update(request(background=True)) == "watching"
    assert len(subscriptions.leases) == map_coverage.MAX_VIEWERS * 8
    assert sum(lease[1] is not None for lease in subscriptions.leases.values()) == active_count + 1
    assert all(watch.client_id in subscriptions.leases for watch in active)
