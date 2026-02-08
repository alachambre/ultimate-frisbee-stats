from pydantic import BaseModel, field_serializer
from datetime import datetime, timezone
from typing import Optional

from .enums import StoppageType


class StoppageBase(BaseModel):
    stoppage_type: StoppageType = StoppageType.call
    comments: Optional[str] = None


class StoppageCreate(StoppageBase):
    point_id: int
    call_timestamp: datetime
    resume_timestamp: Optional[datetime] = None


class StoppageUpdate(BaseModel):
    stoppage_type: Optional[StoppageType] = None
    resume_timestamp: Optional[datetime] = None
    comments: Optional[str] = None


class Stoppage(StoppageBase):
    id: int
    point_id: int
    call_timestamp: datetime
    resume_timestamp: Optional[datetime]
    created_at: datetime

    @field_serializer("call_timestamp", "resume_timestamp", "created_at")
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace("+00:00", "Z")

    class Config:
        from_attributes = True
