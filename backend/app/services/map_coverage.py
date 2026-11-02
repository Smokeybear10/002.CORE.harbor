from __future__ import annotations

from time import monotonic
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.domain import PositionReportORM

MAX_VIEWPORT_AREA = 256
MAX_VIEWERS = 8
LEASE_SECONDS = 45
BACKGROUND_LEASE_SECONDS = 15 * 60


class MapBounds(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False, extra="forbid")

    west: float = Field(ge=-180, le=180)
    south: float = Field(ge=-85, le=85)
    east: float = Field(ge=-180, le=180)
    north: float = Field(ge=-85, le=85)

    @model_validator(mode="after")
    def check_extent(self) -> MapBounds:
        if self.north <= self.south or self.longitude_span == 0:
            raise ValueError("Map bounds must have a positive width and height")
        return self

    @property
    def longitude_span(self) -> float:
        return (self.east - self.west) % 360 or (360 if self.east != self.west else 0)

    @property
    def is_browsable(self) -> bool:
        return self.longitude_span <= 32 and self.north - self.south <= 24 and self.longitude_span * (self.north - self.south) <= MAX_VIEWPORT_AREA

    def boxes(self) -> list[list[list[float]]]:
        if self.west <= self.east:
            return [[[self.south, self.west], [self.north, self.east]]]
        return [
            [[self.south, self.west], [self.north, 180]],
            [[self.south, -180], [self.north, self.east]],
        ]


class CoverageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_id: UUID
    revision: int = Field(ge=0, le=2**53 - 1)
    bounds: MapBounds | None
    background: bool = False

    @property
    def lease_seconds(self) -> int:
        if self.background or self.bounds is None or not self.bounds.is_browsable:
            return BACKGROUND_LEASE_SECONDS
        return LEASE_SECONDS


class ViewportSubscriptions:
    def __init__(self) -> None:
        self.leases: dict[UUID, tuple[int, MapBounds | None, float]] = {}

    def prune(self) -> None:
        now = monotonic()
        self.leases = {key: lease for key, lease in self.leases.items() if lease[2] > now}

    def update(self, request: CoverageRequest) -> str:
        self.prune()
        previous = self.leases.get(request.client_id)
        if previous and request.revision < previous[0]:
            return "superseded"
        bounds = request.bounds
        if bounds and not bounds.is_browsable:
            bounds = None
        if previous and request.revision == previous[0] and bounds != previous[1]:
            return "superseded"
        active = sum(lease[1] is not None for key, lease in self.leases.items() if key != request.client_id)
        if bounds and active >= MAX_VIEWERS:
            return "busy"
        # Releases retain their revision so a delayed background renewal cannot
        # restore an area after the tab closes. Evict old releases before
        # refusing a new viewer because of the bookkeeping limit.
        if not previous and len(self.leases) >= MAX_VIEWERS * 8:
            oldest_inactive = min(
                (key for key, lease in self.leases.items() if lease[1] is None),
                key=lambda key: self.leases[key][2],
            )
            del self.leases[oldest_inactive]
        expires = monotonic() + request.lease_seconds
        if previous and request.revision == previous[0]:
            expires = max(expires, previous[2])
        self.leases[request.client_id] = (request.revision, bounds, expires)
        return "watching" if bounds else "zoom_in"

    def boxes(self) -> list[list[list[float]]]:
        self.prune()
        result = []
        for _, bounds, _ in self.leases.values():
            if bounds:
                for box in bounds.boxes():
                    if box not in result:
                        result.append(box)
        return sorted(result)


def vessels_in_bounds(db: Session, bounds: MapBounds):
    latest = db.query(
        PositionReportORM.vessel_id,
        func.max(PositionReportORM.timestamp).label("timestamp"),
    ).group_by(PositionReportORM.vessel_id).subquery()
    longitude = (
        PositionReportORM.longitude.between(bounds.west, bounds.east)
        if bounds.west <= bounds.east
        else or_(PositionReportORM.longitude >= bounds.west, PositionReportORM.longitude <= bounds.east)
    )
    return select(PositionReportORM.vessel_id).join(
        latest, (PositionReportORM.vessel_id == latest.c.vessel_id) & (PositionReportORM.timestamp == latest.c.timestamp),
    ).where(PositionReportORM.latitude.between(bounds.south, bounds.north), longitude)
