"""
Game schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
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
    status: Optional[GameStatus] = None
    comments: Optional[str] = None


class Game(GameBase):
    id: int
    competition_id: int
    status: GameStatus
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GameWithScore(Game):
    """Game with calculated score information"""
    our_score: int
    opponent_score: int
    team_name: str
    competition_name: str


class GameDetail(GameWithScore):
    """Complete game information with all points and players"""
    points: List['PointWithPlayers']  # Forward reference to avoid circular import
    players: List['Player']  # Selected players for this game
