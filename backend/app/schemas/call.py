from pydantic import BaseModel, field_serializer
from datetime import datetime, timezone
from typing import Optional


class CallBase(BaseModel):
    comments: Optional[str] = None


class CallCreate(CallBase):
    point_id: int
    call_timestamp: datetime
    resume_timestamp: Optional[datetime] = None


class CallUpdate(BaseModel):
    resume_timestamp: Optional[datetime] = None
    comments: Optional[str] = None


class Call(CallBase):
    id: int
    point_id: int
    call_timestamp: datetime
    resume_timestamp: Optional[datetime]
    created_at: datetime

    @field_serializer('call_timestamp', 'resume_timestamp', 'created_at')
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    class Config:
        from_attributes = True
