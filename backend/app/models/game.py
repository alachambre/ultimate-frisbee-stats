"""
Game model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, GameStatusEnum, game_players


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    opponent_name = Column(String, nullable=False)
    date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(Enum(GameStatusEnum), default=GameStatusEnum.ready, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="games")
    points = relationship("Point", back_populates="game", cascade="all, delete-orphan")
    players = relationship("Player", secondary=game_players, back_populates="games")
