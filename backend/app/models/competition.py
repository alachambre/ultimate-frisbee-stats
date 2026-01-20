"""
Competition model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, CompetitionStatusEnum, competition_players


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(CompetitionStatusEnum), default=CompetitionStatusEnum.ongoing, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    team = relationship("Team", back_populates="competitions")
    games = relationship("Game", back_populates="competition", cascade="all, delete-orphan")
    players = relationship("Player", secondary=competition_players, back_populates="competitions")
