"""
Game schemas
"""
from pydantic import BaseModel, Field, field_serializer
from datetime import datetime, timezone
from typing import List, Optional

from .enums import GameStatus


class GameBase(BaseModel):
    opponent_name: str = Field(..., min_length=1, max_length=100)
    date: Optional[datetime] = None
    comments: Optional[str] = None


class GameCreate(GameBase):
    competition_id: int
    player_ids: Optional[List[int]] = []  # Initial selected players


class GameUpdate(BaseModel):
    opponent_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[datetime] = None
    status: Optional[GameStatus] = None
    comments: Optional[str] = None


class Game(GameBase):
    id: int
    competition_id: int
    status: GameStatus
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    created_at: datetime

    @field_serializer('date', 'start_datetime', 'end_datetime', 'created_at')
    def serialize_dt(self, dt: Optional[datetime], _info) -> Optional[str]:
        if dt is None:
            return None
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    class Config:
        from_attributes = True


class GameWithScore(Game):
    """Game with calculated score information"""
    our_score: int
    opponent_score: int
    team_name: str
    competition_name: str


class GameHistoryTimelinePoint(BaseModel):
    """Public-safe point-level game history timeline entry."""
    point_id: int
    point_number: int
    starting_on_offense: bool
    won: bool
    field_side: Optional[str] = None
    duration_seconds: int
    our_turnovers: int
    opponent_turnovers: int
    our_score_after: int
    opponent_score_after: int
    markers: List[str] = Field(default_factory=list)


class GameHistoryKeyMoment(BaseModel):
    """Public-safe notable game history moment."""
    id: str
    type: str
    primary_point_id: int
    point_ids: List[int]
    importance: int
    reasons: List[str]


class GameHistoryTimeline(BaseModel):
    """Public-safe game history timeline annotations."""
    game_id: int
    halftime_after_point_number: Optional[int]
    points: List[GameHistoryTimelinePoint]
    key_moments: List[GameHistoryKeyMoment] = Field(default_factory=list)


class GameDetail(GameWithScore):
    """Complete game information with all points and players"""
    points: List['PointWithPlayers']  # Forward reference to avoid circular import
    players: List['Player']  # Selected players for this game
    halftime: Optional['Halftime'] = None
    timeline: Optional[GameHistoryTimeline] = None


class GameLiveState(BaseModel):
    """Condensed live-game payload for sideline polling."""
    game_id: int
    status: GameStatus
    our_score: int
    opponent_score: int
    active_point: Optional['PointWithPlayers'] = None
    active_point_turnovers: List['TurnoverWithPlayer'] = Field(default_factory=list)
    active_point_stoppages: List['Stoppage'] = Field(default_factory=list)
