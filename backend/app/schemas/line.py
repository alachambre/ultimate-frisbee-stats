"""
Line schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class LineBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class LineCreate(LineBase):
    team_id: int
    player_ids: Optional[List[int]] = []  # Initial players


class LineUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None


class Line(LineBase):
    id: int
    team_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LineWithPlayers(Line):
    """Line with its players"""
    players: List['Player']  # Forward reference to avoid circular import
