"""
Game schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class GameBase(BaseModel):
    opponent_name: str = Field(..., min_length=1, max_length=100)
    date: Optional[datetime] = None


class GameCreate(GameBase):
    competition_id: int


class GameUpdate(BaseModel):
    opponent_name: Optional[str] = Field(None, min_length=1, max_length=100)
    status: Optional[str] = Field(None, pattern="^(in_progress|finished)$")


class Game(GameBase):
    id: int
    competition_id: int
    status: str
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
