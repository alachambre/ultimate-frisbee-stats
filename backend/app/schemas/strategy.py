"""
Strategy schemas
"""
from pydantic import BaseModel, Field, field_serializer
from datetime import datetime, timezone
from typing import Optional
from .enums import StrategyCategory


class StrategyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category: StrategyCategory


class StrategyCreate(StrategyBase):
    pass


class StrategyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    category: Optional[StrategyCategory] = None


class Strategy(StrategyBase):
    id: int
    created_at: datetime

    @field_serializer('created_at')
    def serialize_dt(self, dt: datetime, _info) -> str:
        # Ensure timezone-aware and serialize to ISO format with Z suffix
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat().replace('+00:00', 'Z')

    class Config:
        from_attributes = True
