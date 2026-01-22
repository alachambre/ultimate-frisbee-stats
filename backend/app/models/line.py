"""
Line model
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .base import Base, line_players


class Line(Base):
    __tablename__ = "lines"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Unique constraint: line names must be unique per team
    __table_args__ = (
        UniqueConstraint('team_id', 'name', name='uq_team_line_name'),
    )

    # Relationships
    team = relationship("Team", back_populates="lines")
    players = relationship("Player", secondary=line_players, back_populates="lines")
