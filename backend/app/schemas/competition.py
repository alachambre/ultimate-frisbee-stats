"""
Competition schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional

from .enums import CompetitionStatus


class CompetitionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    start_date: date
    end_date: date


class CompetitionCreate(CompetitionBase):
    team_id: int
    player_ids: Optional[List[int]] = []  # Initial roster


class CompetitionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[CompetitionStatus] = None


class Competition(CompetitionBase):
    id: int
    team_id: int
    status: CompetitionStatus
    created_at: datetime

    class Config:
        from_attributes = True


class CompetitionWithPlayers(Competition):
    """Competition with its player roster"""
    players: List['Player']  # Forward reference to avoid circular import


class CompetitionWithTeam(Competition):
    """Competition with team name"""
    team_name: str
