from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app import models, schemas
from app.logging_config import get_logger

logger = get_logger("crud.turnovers")


def create_turnover(db: Session, turnover: schemas.TurnoverCreate) -> models.Turnover:
    """Create a new turnover. Validates point and optional player exist."""
    try:
        # Verify point exists
        point = db.query(models.Point).filter(models.Point.id == turnover.point_id).first()
        if not point:
            raise ValueError(f"Point with ID {turnover.point_id} not found")

        # Verify player exists if provided
        if turnover.player_id is not None:
            player = db.query(models.Player).filter(models.Player.id == turnover.player_id).first()
            if not player:
                raise ValueError(f"Player with ID {turnover.player_id} not found")

        db_turnover = models.Turnover(
            point_id=turnover.point_id,
            player_id=turnover.player_id,
            timestamp=turnover.timestamp,
            comments=turnover.comments
        )
        db.add(db_turnover)
        db.commit()
        db.refresh(db_turnover)
        return db_turnover
    except ValueError:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating turnover for point {turnover.point_id}: {e}", exc_info=True)
        raise


def get_turnover(db: Session, turnover_id: int) -> Optional[models.Turnover]:
    """Get a single turnover by ID with player relationship loaded."""
    return db.query(models.Turnover).options(
        joinedload(models.Turnover.player)
    ).filter(models.Turnover.id == turnover_id).first()


def get_turnovers_by_point(db: Session, point_id: int) -> List[models.Turnover]:
    """Get all turnovers for a specific point, ordered by timestamp."""
    return db.query(models.Turnover).options(
        joinedload(models.Turnover.player)
    ).filter(
        models.Turnover.point_id == point_id
    ).order_by(models.Turnover.timestamp).all()


def get_turnovers_by_player(db: Session, player_id: int) -> List[models.Turnover]:
    """Get all turnovers for a specific player."""
    return db.query(models.Turnover).filter(
        models.Turnover.player_id == player_id
    ).order_by(models.Turnover.timestamp.desc()).all()


def update_turnover(db: Session, turnover_id: int, turnover_update: schemas.TurnoverUpdate) -> Optional[models.Turnover]:
    """Update a turnover."""
    db_turnover = get_turnover(db, turnover_id)
    if db_turnover:
        try:
            if turnover_update.player_id is not None:
                # Verify player exists
                player = db.query(models.Player).filter(models.Player.id == turnover_update.player_id).first()
                if not player:
                    raise ValueError(f"Player with ID {turnover_update.player_id} not found")
                db_turnover.player_id = turnover_update.player_id

            if turnover_update.timestamp is not None:
                db_turnover.timestamp = turnover_update.timestamp

            if turnover_update.comments is not None:
                db_turnover.comments = turnover_update.comments

            db.commit()
            db.refresh(db_turnover)
        except ValueError:
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating turnover {turnover_id}: {e}", exc_info=True)
            raise
    return db_turnover


def delete_turnover(db: Session, turnover_id: int) -> bool:
    """Delete a turnover."""
    db_turnover = get_turnover(db, turnover_id)
    if db_turnover:
        db.delete(db_turnover)
        db.commit()
        return True
    return False
