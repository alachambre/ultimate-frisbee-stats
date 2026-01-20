"""
Player schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

from .enums import Gender


class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    number: Optional[int] = Field(None, ge=0, le=99)
    gender: Gender


class PlayerCreate(PlayerBase):
    team_id: int


class PlayerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    number: Optional[int] = Field(None, ge=0, le=99)
    gender: Optional[Gender] = None


class Player(PlayerBase):
    id: int
    team_id: int
    created_at: datetime

    class Config:
        from_attributes = True
