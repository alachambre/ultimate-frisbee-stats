"""
Point model
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, point_players, PointStatusEnum


class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    point_number = Column(Integer, nullable=False)  # Sequential number within the game
    starting_on_offense = Column(Boolean, nullable=False)  # True if we started with the disc
    won = Column(Boolean, nullable=True)  # True if we won the point (nullable while not completed)
    status = Column(Enum(PointStatusEnum), default=PointStatusEnum.ready, nullable=False)  # ready | running | scored | completed
    field_side = Column(String(50), nullable=True)  # Which side of the field (optional tracking)
    pull = Column(Boolean, nullable=True)  # Was there a pull at start
    strategy_id = Column(Integer, ForeignKey("strategies.id", ondelete="SET NULL"), nullable=True)
    comments = Column(Text, nullable=True)  # Point narrative/notes
    start_datetime = Column(DateTime, nullable=True)  # When point started
    end_datetime = Column(DateTime, nullable=True)  # When point finished
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    game = relationship("Game", back_populates="points")
    strategy = relationship("Strategy", back_populates="points")
    players = relationship("Player", secondary=point_players, back_populates="points")
