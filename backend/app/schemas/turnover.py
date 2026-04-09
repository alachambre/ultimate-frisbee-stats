from pydantic import BaseModel, field_serializer
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from .enums import TurnoverType


class TurnoverBase(BaseModel):
    player_id: Optional[int] = None  # Optional - may not know who
    turnover_type: TurnoverType = TurnoverType.other
    comments: Optional[str] = None


class TurnoverCreate(TurnoverBase):
    point_id: int
    timestamp: datetime


class TurnoverUpdate(BaseModel):
    player_id: Optional[int] = None
    timestamp: Optional[datetime] = None
    turnover_type: Optional[TurnoverType] = None
    comments: Optional[str] = None


class Turnover(TurnoverBase):
    id: int
    point_id: int
    timestamp: datetime
    created_at: datetime

    @field_serializer('timestamp', 'created_at')
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    class Config:
        from_attributes = True


# Optional: With player details
class TurnoverWithPlayer(Turnover):
    if TYPE_CHECKING:
        from .player import Player
    player: Optional['Player'] = None
