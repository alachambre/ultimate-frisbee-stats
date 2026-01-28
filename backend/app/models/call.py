from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    point_id = Column(Integer, ForeignKey("points.id", ondelete="CASCADE"), nullable=False)
    call_timestamp = Column(DateTime, nullable=False)
    resume_timestamp = Column(DateTime, nullable=True)  # Null until resolved
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    point = relationship("Point", back_populates="calls")
