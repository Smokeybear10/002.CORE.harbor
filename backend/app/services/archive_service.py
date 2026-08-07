"""
Position data archival service.

Archives older position reports to compressed Parquet files while keeping
recent data in SQLite for fast queries. This gives us:
- Permanent history (Parquet files, ~10x compression vs SQLite)
- Fast real-time queries on recent data (SQLite)
- Replay capability from archived files

Archive structure:
  data/archive/positions/
    positions_2026-03-27_08-00.parquet
    positions_2026-03-27_09-00.parquet
    ...
"""

from __future__ import annotations
import logging
import os
from datetime import datetime, timedelta
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.domain import PositionReportORM, VesselORM

logger = logging.getLogger("harboros.archive")

# Keep this many minutes of data in SQLite; archive everything older
RETENTION_MINUTES = 30

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


def archive_old_positions(
    retention_minutes: int = RETENTION_MINUTES,
    db: Session | None = None,
    before_id: int | None = None,
) -> dict:
    """Archive position reports older than retention window to Parquet.

    Returns stats about what was archived.
    """
    own_db = db is None
    if own_db:
        db = SessionLocal()

    try:
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
