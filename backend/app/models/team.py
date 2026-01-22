"""
Team model
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")
    competitions = relationship("Competition", back_populates="team", cascade="all, delete-orphan")
    lines = relationship("Line", back_populates="team", cascade="all, delete-orphan")
