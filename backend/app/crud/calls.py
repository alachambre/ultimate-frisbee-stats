from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app import models, schemas
from app.logging_config import get_logger

logger = get_logger("crud.calls")


def create_call(db: Session, call: schemas.CallCreate) -> models.Call:
    """Create a new call. Validates that point exists."""
    try:
        # Verify point exists
        point = db.query(models.Point).filter(models.Point.id == call.point_id).first()
        if not point:
            raise ValueError(f"Point with ID {call.point_id} not found")

        # Validate timestamps if both provided
        if call.call_timestamp and call.resume_timestamp:
            # Handle timezone-aware/naive datetime comparison
            call_ts = call.call_timestamp.replace(tzinfo=None) if call.call_timestamp.tzinfo else call.call_timestamp
            resume_ts = call.resume_timestamp.replace(tzinfo=None) if call.resume_timestamp.tzinfo else call.resume_timestamp
            if resume_ts <= call_ts:
                raise ValueError("resume_timestamp must be after call_timestamp")

        db_call = models.Call(
            point_id=call.point_id,
            call_timestamp=call.call_timestamp,
            resume_timestamp=call.resume_timestamp,
            comments=call.comments
        )
        db.add(db_call)
        db.commit()
        db.refresh(db_call)
        return db_call
    except ValueError:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating call for point {call.point_id}: {e}", exc_info=True)
        raise


def get_call(db: Session, call_id: int) -> Optional[models.Call]:
    """Get a single call by ID."""
    return db.query(models.Call).filter(models.Call.id == call_id).first()


def get_calls_by_point(db: Session, point_id: int) -> List[models.Call]:
    """Get all calls for a specific point, ordered by call_timestamp."""
    return db.query(models.Call).filter(
        models.Call.point_id == point_id
    ).order_by(models.Call.call_timestamp).all()


def update_call(db: Session, call_id: int, call_update: schemas.CallUpdate) -> Optional[models.Call]:
    """Update a call (typically to set resume_timestamp)."""
    db_call = get_call(db, call_id)
    if db_call:
        try:
            if call_update.resume_timestamp is not None:
                # Validate resume is after call (handle timezone-aware/naive comparison)
                call_ts = db_call.call_timestamp.replace(tzinfo=None) if db_call.call_timestamp.tzinfo else db_call.call_timestamp
                resume_ts = call_update.resume_timestamp.replace(tzinfo=None) if call_update.resume_timestamp.tzinfo else call_update.resume_timestamp
                if resume_ts <= call_ts:
                    raise ValueError("resume_timestamp must be after call_timestamp")
                db_call.resume_timestamp = call_update.resume_timestamp

            if call_update.comments is not None:
                db_call.comments = call_update.comments

            db.commit()
            db.refresh(db_call)
        except ValueError:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating call {call_id}: {e}", exc_info=True)
            raise
    return db_call


def delete_call(db: Session, call_id: int) -> bool:
    """Delete a call."""
    db_call = get_call(db, call_id)
    if db_call:
        db.delete(db_call)
        db.commit()
        return True
    return False
