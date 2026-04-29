from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .base import Base


class Stoppage(Base):
    __tablename__ = "stoppages"
    __table_args__ = (
        CheckConstraint(
            "stoppage_type IN ('call', 'injury', 'timeout', 'other')",
            name="stoppages_stoppage_type_check",
        ),
        Index("idx_stoppages_point_time", "point_id", "call_timestamp"),
    )

    id = Column(Integer, primary_key=True, index=True)
    point_id = Column(Integer, ForeignKey("points.id", ondelete="CASCADE"), nullable=False)
    stoppage_type = Column(String(20), nullable=False, default="call")
    call_timestamp = Column(DateTime, nullable=False)
    resume_timestamp = Column(DateTime, nullable=True)  # Null until resolved
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    point = relationship("Point", back_populates="stoppages")
