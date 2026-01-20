"""
Player model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, GenderEnum, point_players, competition_players


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    number = Column(Integer, nullable=True)  # Jersey number (optional)
    gender = Column(Enum(GenderEnum), nullable=False)  # M or W
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    team = relationship("Team", back_populates="players")
    points = relationship("Point", secondary=point_players, back_populates="players")
    competitions = relationship("Competition", secondary=competition_players, back_populates="players")
