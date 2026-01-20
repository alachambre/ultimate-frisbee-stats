"""
Point model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, point_players


class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    point_number = Column(Integer, nullable=False)  # Sequential number within the game
    starting_on_offense = Column(Boolean, nullable=False)  # True if we started with the disc
    won = Column(Boolean, nullable=True)  # True if we won the point (nullable while active)
    status = Column(String, default="active", nullable=False)  # "active" | "completed"
    start_datetime = Column(DateTime, nullable=True)  # When point started
    end_datetime = Column(DateTime, nullable=True)  # When point finished
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    game = relationship("Game", back_populates="points")
    players = relationship("Player", secondary=point_players, back_populates="points")
