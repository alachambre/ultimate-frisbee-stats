from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app import models, schemas
from app.logging_config import get_logger

logger = get_logger("crud.stoppages")


def create_stoppage(db: Session, stoppage: schemas.StoppageCreate) -> models.Stoppage:
    """Create a new stoppage. Validates that point exists."""
    try:
        point = db.query(models.Point).filter(models.Point.id == stoppage.point_id).first()
        if not point:
            raise ValueError(f"Point with ID {stoppage.point_id} not found")

        if stoppage.call_timestamp and stoppage.resume_timestamp:
            start_ts = (
                stoppage.call_timestamp.replace(tzinfo=None)
                if stoppage.call_timestamp.tzinfo
                else stoppage.call_timestamp
            )
            resume_ts = (
                stoppage.resume_timestamp.replace(tzinfo=None)
                if stoppage.resume_timestamp.tzinfo
                else stoppage.resume_timestamp
            )
            if resume_ts <= start_ts:
                raise ValueError("resume_timestamp must be after call_timestamp")

        db_stoppage = models.Stoppage(
            point_id=stoppage.point_id,
            stoppage_type=stoppage.stoppage_type.value,
            call_timestamp=stoppage.call_timestamp,
            resume_timestamp=stoppage.resume_timestamp,
            comments=stoppage.comments,
        )
        db.add(db_stoppage)
        db.commit()
        db.refresh(db_stoppage)
        return db_stoppage
    except ValueError:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            f"Database error creating stoppage for point {stoppage.point_id}: {e}",
            exc_info=True,
        )
        raise


def get_stoppage(db: Session, stoppage_id: int) -> Optional[models.Stoppage]:
    """Get a single stoppage by ID."""
    return db.query(models.Stoppage).filter(models.Stoppage.id == stoppage_id).first()


def get_stoppages_by_point(db: Session, point_id: int) -> List[models.Stoppage]:
    """Get all stoppages for a specific point, ordered by timestamp."""
    return (
        db.query(models.Stoppage)
        .filter(models.Stoppage.point_id == point_id)
        .order_by(models.Stoppage.call_timestamp)
        .all()
    )


def update_stoppage(
    db: Session,
    stoppage_id: int,
    stoppage_update: schemas.StoppageUpdate,
) -> Optional[models.Stoppage]:
    """Update a stoppage."""
    db_stoppage = get_stoppage(db, stoppage_id)
    if db_stoppage:
        try:
            if stoppage_update.stoppage_type is not None:
                db_stoppage.stoppage_type = stoppage_update.stoppage_type.value

            if stoppage_update.resume_timestamp is not None:
                start_ts = (
                    db_stoppage.call_timestamp.replace(tzinfo=None)
                    if db_stoppage.call_timestamp.tzinfo
                    else db_stoppage.call_timestamp
                )
                resume_ts = (
                    stoppage_update.resume_timestamp.replace(tzinfo=None)
                    if stoppage_update.resume_timestamp.tzinfo
                    else stoppage_update.resume_timestamp
                )
                if resume_ts <= start_ts:
                    raise ValueError("resume_timestamp must be after call_timestamp")
                db_stoppage.resume_timestamp = stoppage_update.resume_timestamp

            if stoppage_update.comments is not None:
                db_stoppage.comments = stoppage_update.comments

            db.commit()
            db.refresh(db_stoppage)
        except ValueError:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating stoppage {stoppage_id}: {e}", exc_info=True)
            raise
    return db_stoppage


def delete_stoppage(db: Session, stoppage_id: int) -> bool:
    """Delete a stoppage."""
    db_stoppage = get_stoppage(db, stoppage_id)
    if db_stoppage:
        db.delete(db_stoppage)
        db.commit()
        return True
    return False
