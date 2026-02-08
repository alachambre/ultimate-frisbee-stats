from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import models, schemas
from app.logging_config import get_logger

logger = get_logger("crud.halftimes")


def create_halftime(db: Session, halftime: schemas.HalftimeCreate) -> models.Halftime:
    """Create halftime marker for a running game."""
    try:
        game = db.query(models.Game).filter(models.Game.id == halftime.game_id).first()
        if not game:
            raise ValueError(f"Game with ID {halftime.game_id} not found")
        if game.status != models.GameStatusEnum.started:
            raise ValueError("Can only create halftime on a started game")

        existing = get_halftime_by_game(db, halftime.game_id)
        if existing:
            raise ValueError(f"Halftime already exists for game {halftime.game_id}")

        halftime_timestamp = halftime.halftime_timestamp or datetime.now(timezone.utc)
        db_halftime = models.Halftime(
            game_id=halftime.game_id,
            halftime_timestamp=halftime_timestamp,
            comments=halftime.comments,
        )
        db.add(db_halftime)
        db.commit()
        db.refresh(db_halftime)
        return db_halftime
    except ValueError:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating halftime for game {halftime.game_id}: {e}", exc_info=True)
        raise


def get_halftime(db: Session, halftime_id: int) -> Optional[models.Halftime]:
    return db.query(models.Halftime).filter(models.Halftime.id == halftime_id).first()


def get_halftime_by_game(db: Session, game_id: int) -> Optional[models.Halftime]:
    return db.query(models.Halftime).filter(models.Halftime.game_id == game_id).first()


def update_halftime(
    db: Session,
    halftime_id: int,
    halftime_update: schemas.HalftimeUpdate,
) -> Optional[models.Halftime]:
    db_halftime = get_halftime(db, halftime_id)
    if db_halftime:
        try:
            if halftime_update.halftime_timestamp is not None:
                db_halftime.halftime_timestamp = halftime_update.halftime_timestamp
            if halftime_update.comments is not None:
                db_halftime.comments = halftime_update.comments
            db.commit()
            db.refresh(db_halftime)
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating halftime {halftime_id}: {e}", exc_info=True)
            raise
    return db_halftime


def delete_halftime(db: Session, halftime_id: int) -> bool:
    db_halftime = get_halftime(db, halftime_id)
    if db_halftime:
        db.delete(db_halftime)
        db.commit()
        return True
    return False
