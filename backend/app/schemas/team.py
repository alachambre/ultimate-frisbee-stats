"""
Team schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List


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


class TeamWithPlayers(Team):
    """Team with all its players"""
    players: List['Player']  # Forward reference to avoid circular import
