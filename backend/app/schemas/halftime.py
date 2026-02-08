from pydantic import BaseModel, field_serializer
from datetime import datetime, timezone
from typing import Optional


class HalftimeBase(BaseModel):
    comments: Optional[str] = None


class HalftimeCreate(HalftimeBase):
    game_id: int
    halftime_timestamp: Optional[datetime] = None


class HalftimeUpdate(BaseModel):
    halftime_timestamp: Optional[datetime] = None
    comments: Optional[str] = None


class Halftime(HalftimeBase):
    id: int
    game_id: int
    halftime_timestamp: datetime
    created_at: datetime

    @field_serializer("halftime_timestamp", "created_at")
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")

    class Config:
        from_attributes = True
