"""Bounded database history for Postgres and local Parquet archives for SQLite."""

from __future__ import annotations
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.database import SessionLocal, is_durable_storage
from app.models.domain import PositionReportORM, VesselORM

logger = logging.getLogger("harboros.archive")

# Keep this many minutes of data in SQLite; archive everything older
RETENTION_MINUTES = 30


class HistoryRetention(BaseModel):
    history_retention_days: int = Field(default=7, ge=1)
    max_position_rows: int = Field(default=250_000, ge=1)


HISTORY_RETENTION = HistoryRetention(
    history_retention_days=os.environ.get("HARBOROS_HISTORY_DAYS", 7),
    max_position_rows=os.environ.get("HARBOROS_MAX_POSITION_ROWS", 250_000),
)

# Archive output directory
ARCHIVE_DIR = Path(os.environ.get(
    "HARBOROS_ARCHIVE_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "archive", "positions")
))

# Ceiling on total Parquet size. Ingestion archives every ~5 minutes forever, so
# without a cap the archive grows until the host volume is full and every write
# fails. Oldest files are dropped first once the budget is exceeded.
MAX_ARCHIVE_MB = float(os.environ.get("HARBOROS_MAX_ARCHIVE_MB", "300"))

# Parquet schema for position reports
POSITION_SCHEMA = pa.schema([
    ("vessel_id", pa.string()),
    ("mmsi", pa.string()),
    ("vessel_name", pa.string()),
    ("timestamp", pa.timestamp("us")),
    ("latitude", pa.float64()),
    ("longitude", pa.float64()),
    ("speed_over_ground", pa.float32()),
    ("course_over_ground", pa.float32()),
    ("heading", pa.float32()),
    ("nav_status", pa.string()),
    ("region", pa.string()),
])


def get_storage_status(db: Session | None = None) -> dict:
    own_db = db is None
    if own_db:
        db = SessionLocal()
    try:
        durable = is_durable_storage(db.get_bind())
        count, oldest, newest = db.query(
            func.count(PositionReportORM.id),
            func.min(PositionReportORM.timestamp),
            func.max(PositionReportORM.timestamp),
        ).one()
        return {
            "backend": db.get_bind().dialect.name,
            "durable": durable,
            "history_retention_days": HISTORY_RETENTION.history_retention_days if durable else None,
            "max_position_rows": HISTORY_RETENTION.max_position_rows if durable else 50_000,
            "preserves_last_known_position": durable,
            "position_count": count,
            "oldest_report_at": f"{oldest.isoformat()}Z" if oldest else None,
            "newest_report_at": f"{newest.isoformat()}Z" if newest else None,
        }
    finally:
        if own_db:
            db.close()


def prune_position_history(db: Session, policy: HistoryRetention = HISTORY_RETENTION) -> int:
    """Keep recent tracks and last-known positions, bounded by a total row cap."""
    ranked = select(
        PositionReportORM.id,
        PositionReportORM.timestamp,
        func.row_number().over(
            partition_by=PositionReportORM.vessel_id,
            order_by=(PositionReportORM.timestamp.desc(), PositionReportORM.id.desc()),
        ).label("rank"),
    ).subquery()
    cutoff = datetime.utcnow() - timedelta(days=policy.history_retention_days)
    expired_ids = select(ranked.c.id).where(ranked.c.rank > 1, ranked.c.timestamp < cutoff)
    removed = db.query(PositionReportORM).filter(
        PositionReportORM.id.in_(expired_ids),
    ).delete(synchronize_session=False)

    remaining = db.query(func.count(PositionReportORM.id)).scalar()
    if remaining > policy.max_position_rows:
        overflow = remaining - policy.max_position_rows
        history_ids = select(ranked.c.id).where(ranked.c.rank > 1).order_by(
            ranked.c.timestamp, ranked.c.id,
        ).limit(overflow)
        deleted = db.query(PositionReportORM).filter(
            PositionReportORM.id.in_(history_ids),
        ).delete(synchronize_session=False)
        removed += deleted
        overflow -= deleted
        if overflow > 0:
            oldest_ids = select(PositionReportORM.id).order_by(
                PositionReportORM.timestamp, PositionReportORM.id,
            ).limit(overflow)
            removed += db.query(PositionReportORM).filter(
                PositionReportORM.id.in_(oldest_ids),
            ).delete(synchronize_session=False)
    db.commit()
    if removed:
        logger.info("Pruned %s positions under the database history limit", removed)
    return removed


def archive_old_positions(
    retention_minutes: int = RETENTION_MINUTES,
    db: Session | None = None,
    before_id: int | None = None,
) -> dict:
    """Apply durable retention, or archive older local SQLite reports to Parquet."""
    own_db = db is None
    if own_db:
        db = SessionLocal()

    try:
        if is_durable_storage(db.get_bind()):
            removed = prune_position_history(db)
            return {
                "archived": 0,
                "file": None,
                "deleted_positions": removed,
                "message": "History retained in Postgres within the configured limits",
            }
        cutoff = datetime.utcnow() - timedelta(minutes=retention_minutes)
        old_filter = PositionReportORM.timestamp < cutoff
        if before_id is not None:
            old_filter = or_(old_filter, and_(PositionReportORM.vessel_id.like("ais-%"), PositionReportORM.id < before_id))

        # Count what we're about to archive
        old_count = (
            db.query(func.count(PositionReportORM.id))
            .filter(old_filter)
            .scalar()
        )

        if old_count == 0:
            return {"archived": 0, "file": None, "message": "Nothing to archive"}

        # Fetch old positions with vessel info
        old_positions = (
            db.query(
                PositionReportORM.vessel_id,
                VesselORM.mmsi,
                VesselORM.name,
                PositionReportORM.timestamp,
                PositionReportORM.latitude,
                PositionReportORM.longitude,
                PositionReportORM.speed_over_ground,
                PositionReportORM.course_over_ground,
                PositionReportORM.heading,
                PositionReportORM.nav_status,
                VesselORM.region,
            )
            .join(VesselORM, PositionReportORM.vessel_id == VesselORM.id)
            .filter(old_filter)
            .order_by(PositionReportORM.timestamp)
            .all()
        )

        if not old_positions:
            return {"archived": 0, "file": None, "message": "Nothing to archive"}

        # Build Arrow table
        table = pa.table({
            "vessel_id": [r[0] for r in old_positions],
            "mmsi": [r[1] for r in old_positions],
            "vessel_name": [r[2] for r in old_positions],
            "timestamp": [r[3] for r in old_positions],
            "latitude": [r[4] for r in old_positions],
            "longitude": [r[5] for r in old_positions],
            "speed_over_ground": [r[6] for r in old_positions],
            "course_over_ground": [r[7] for r in old_positions],
            "heading": [r[8] for r in old_positions],
            "nav_status": [r[9] for r in old_positions],
            "region": [r[10] for r in old_positions],
        }, schema=POSITION_SCHEMA)

        # Write Parquet file
        ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S-%f")
        filename = f"positions_{timestamp_str}.parquet"
        filepath = ARCHIVE_DIR / filename

        pq.write_table(
            table,
            filepath,
            compression="snappy",
            row_group_size=50000,
        )

        file_size_mb = filepath.stat().st_size / (1024 * 1024)

        # Delete archived positions from SQLite
        deleted = (
            db.query(PositionReportORM)
            .filter(old_filter)
            .delete()
        )
        db.commit()

        logger.info(
            f"Archived {deleted} positions to {filename} "
            f"({file_size_mb:.1f}MB, {table.num_rows} rows)"
        )

        pruned = prune_archives()

        return {
            "archived": deleted,
            "file": str(filepath),
            "file_size_mb": round(file_size_mb, 2),
            "rows": table.num_rows,
            "pruned": pruned,
            "message": f"Archived {deleted} positions to {filename}",
        }

    finally:
        if own_db:
            db.close()


def prune_archives(max_mb: float = MAX_ARCHIVE_MB) -> list[str]:
    """Delete the oldest Parquet files until the archive fits in max_mb.

    Returns the filenames that were removed.
    """
    if not ARCHIVE_DIR.exists():
        return []

    files = sorted(ARCHIVE_DIR.glob("*.parquet"), key=lambda f: f.stat().st_mtime)
    total_mb = sum(f.stat().st_size for f in files) / (1024 * 1024)
    removed = []

    # Keep the newest file even if it alone exceeds the budget — dropping it would
    # discard the data we just archived.
    for f in files[:-1]:
        if total_mb <= max_mb:
            break
        total_mb -= f.stat().st_size / (1024 * 1024)
        f.unlink()
        removed.append(f.name)

    if removed:
        logger.info(f"Pruned {len(removed)} archive files, now {total_mb:.1f}MB / {max_mb}MB")
    return removed


def list_archives() -> list[dict]:
    """List all archived Parquet files with metadata."""
    if not ARCHIVE_DIR.exists():
        return []

    archives = []
    for f in sorted(ARCHIVE_DIR.glob("*.parquet")):
        try:
            meta = pq.read_metadata(f)
            archives.append({
                "file": f.name,
                "path": str(f),
                "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
                "rows": meta.num_rows,
                "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })
        except Exception:
            archives.append({
                "file": f.name,
                "path": str(f),
                "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
                "rows": None,
                "created": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
            })
    return archives


def get_archive_stats() -> dict:
    """Get summary stats of all archived data."""
    archives = list_archives()
    total_rows = sum(a["rows"] or 0 for a in archives)
    total_size = sum(a["size_mb"] for a in archives)
    return {
        "archive_count": len(archives),
        "total_rows": total_rows,
        "total_size_mb": round(total_size, 2),
        "archive_dir": str(ARCHIVE_DIR),
        "archives": archives,
    }
