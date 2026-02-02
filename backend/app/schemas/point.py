"""
Point schemas
"""
from pydantic import BaseModel, Field, computed_field, field_serializer
from datetime import datetime, timezone
from typing import List, Optional
from .enums import PointStatus


class PointBase(BaseModel):
    starting_on_offense: bool
    field_side: Optional[str] = Field(None, max_length=50)
    pull: Optional[bool] = None
    comments: Optional[str] = None


class PointCreate(PointBase):
    game_id: int
    player_ids: Optional[List[int]] = Field(default=None)  # Optional - can select players after creating point
    strategy_id: Optional[int] = None
    start_datetime: Optional[datetime] = None  # Will be set when transitioning to 'running'


class PointFinish(BaseModel):
    won: bool
    comments: Optional[str] = None  # Optional notes when finishing
    end_datetime: Optional[datetime] = None  # Defaults to now if None


class PointUpdate(BaseModel):
    starting_on_offense: Optional[bool] = None
    won: Optional[bool] = None
    field_side: Optional[str] = Field(None, max_length=50)
    pull: Optional[bool] = None
    strategy_id: Optional[int] = None
    comments: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    status: Optional[PointStatus] = None
    player_ids: Optional[List[int]] = Field(None, min_length=7, max_length=7)


class Point(PointBase):
    id: int
    game_id: int
    point_number: int
    won: Optional[bool]  # Nullable while not completed
    status: PointStatus  # ready | running | scored | completed
    strategy_id: Optional[int]
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
    strategy: Optional['Strategy'] = None

    @computed_field
    @property
    def duration_seconds(self) -> Optional[int]:
        """Calculate duration in seconds between start and end datetime"""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            return int(delta.total_seconds())
        return None
