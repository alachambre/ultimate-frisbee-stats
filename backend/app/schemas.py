from pydantic import BaseModel, Field, computed_field, field_serializer
from datetime import datetime, timezone
from typing import List, Optional


# ============================================
# Team Schemas
# ============================================

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamBase):
    pass


class Team(TeamBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Player Schemas
# ============================================

class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    number: Optional[int] = Field(None, ge=0, le=99)


class PlayerCreate(PlayerBase):
    team_id: int


class PlayerUpdate(PlayerBase):
    pass


class Player(PlayerBase):
    id: int
    team_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Game Schemas
# ============================================

class GameBase(BaseModel):
    opponent_name: str = Field(..., min_length=1, max_length=100)
    date: Optional[datetime] = None


class GameCreate(GameBase):
    team_id: int


class GameUpdate(BaseModel):
    opponent_name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, pattern="^(in_progress|finished)$")


class Game(GameBase):
    id: int
    team_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class GameWithScore(Game):
    """Game with calculated score information"""
    our_score: int
    opponent_score: int
    team_name: str


# ============================================
# Point Schemas
# ============================================

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
    players: List[Player]

    @computed_field
    @property
    def duration_seconds(self) -> Optional[int]:
        """Calculate duration in seconds between start and end datetime"""
        if self.start_datetime and self.end_datetime:
            delta = self.end_datetime - self.start_datetime
            return int(delta.total_seconds())
        return None


# ============================================
# Game Detail Schemas (for review)
# ============================================

class GameDetail(GameWithScore):
    """Complete game information with all points and players"""
    points: List[PointWithPlayers]


# ============================================
# Team Detail Schemas
# ============================================

class TeamWithPlayers(Team):
    """Team with all its players"""
    players: List[Player]
