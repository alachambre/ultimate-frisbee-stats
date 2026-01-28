from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base


class Turnover(Base):
    __tablename__ = "turnovers"

    id = Column(Integer, primary_key=True, index=True)
    point_id = Column(Integer, ForeignKey("points.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    point = relationship("Point", back_populates="turnovers")
    player = relationship("Player", back_populates="turnovers")
