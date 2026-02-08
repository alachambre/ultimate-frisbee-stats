from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base


class Halftime(Base):
    __tablename__ = "halftimes"
    __table_args__ = (
        UniqueConstraint("game_id", name="uq_halftimes_game_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    halftime_timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    game = relationship("Game", back_populates="halftime")
