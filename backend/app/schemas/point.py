"""
Point schemas
"""
from pydantic import BaseModel, Field, computed_field, field_serializer
from datetime import datetime, timezone
from typing import List, Optional


class PointBase(BaseModel):
    starting_on_offense: bool


class PointCreate(PointBase):
    game_id: int
    player_ids: List[int] = Field(..., min_length=7, max_length=7)
    start_datetime: Optional[datetime] = None  # Defaults to now if None


class PointFinish(BaseModel):
    won: bool
    end_datetime: Optional[datetime] = None  # Defaults to now if None


class PointUpdate(BaseModel):
    starting_on_offense: Optional[bool] = None
    won: Optional[bool] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(active|completed)$")
    player_ids: Optional[List[int]] = Field(None, min_length=7, max_length=7)


class Point(PointBase):
    id: int
    game_id: int
    point_number: int
    won: Optional[bool]  # Nullable while active
    status: str  # "active" | "completed"
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
    created_at: datetime

    @field_serializer('start_datetime', 'end_datetime', 'created_at')
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        # Ensure timezone-aware and serialize to ISO format with Z suffix
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    class Config:
        from_attributes = True


class PointWithPlayers(Point):
    """Point with full player information"""
    players: List['Player']

    @computed_field
    @property
    def duration_seconds(self) -> Optional[int]:
        """Calculate duration in seconds between start and end datetime"""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            return int(delta.total_seconds())
        return None
