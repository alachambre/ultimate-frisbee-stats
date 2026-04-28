"""Formatting helpers for statistics CSV exports."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime, timezone
from typing import List, Literal, Optional

from app.models.point import Point
from app.models.stoppage import Stoppage


def to_csv(rows: List[List[str]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(rows)
    return buffer.getvalue()


def enum_value(value: object) -> str:
    if hasattr(value, "value"):
        return str(value.value)
    return str(value)


def format_percent(value: float) -> str:
    return f"{value * 100:.0f}%"


def format_time_mmss(seconds: int) -> str:
    minutes = seconds // 60
    remaining = seconds % 60
    return f"{minutes}:{remaining:02d}"


def format_datetime(value: Optional[datetime]) -> str:
    if not value:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def format_date(value: Optional[date]) -> str:
    if not value:
        return ""
    return value.isoformat()


def point_duration_seconds(point: Point) -> Optional[int]:
    if not point.start_datetime or not point.end_datetime:
        return None

    start = point.start_datetime
    end = point.end_datetime
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    return max(0, int((end - start).total_seconds()))


def stoppage_dead_time_seconds(stoppage: Stoppage) -> int:
    if not stoppage.call_timestamp or not stoppage.resume_timestamp:
        return 0

    start = stoppage.call_timestamp
    end = stoppage.resume_timestamp
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    return max(0, int((end - start).total_seconds()))


def normalize_detail_mode(detail_mode: str) -> Literal["summary", "full"]:
    return "full" if detail_mode == "full" else "summary"
