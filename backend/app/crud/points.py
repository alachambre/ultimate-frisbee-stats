from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from datetime import datetime, timezone
from app import models, schemas
from app.logging_config import get_logger

logger = get_logger("crud.points")


def _ensure_timezone_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Convert timezone-naive datetime to timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume naive datetime is UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_running_point_for_game(db: Session, game_id: int) -> Optional[models.Point]:
    """Get the running point for a game, if any"""
    return db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id,
        models.Point.status == models.PointStatusEnum.running
    ).first()


def create_point(db: Session, point: schemas.PointCreate) -> models.Point:
    try:
        # Check for existing running point for this game
        running_point = get_running_point_for_game(db, point.game_id)
        if running_point:
            raise ValueError(f"Game {point.game_id} already has a running point (ID: {running_point.id})")

        # Validate strategy exists if provided
        if point.strategy_id:
            strategy = db.query(models.Strategy).filter(models.Strategy.id == point.strategy_id).first()
            if not strategy:
                raise ValueError(f"Strategy with ID {point.strategy_id} not found")

        # Get current max point number for this game
        max_point = db.query(models.Point).filter(
            models.Point.game_id == point.game_id
        ).order_by(models.Point.point_number.desc()).first()

        next_point_number = (max_point.point_number + 1) if max_point else 1

        # If this is the first point, set (or reset) the game's start_datetime
        if next_point_number == 1:
            from app.crud.games import get_game
            game = get_game(db, point.game_id)
            if game:
                game.start_datetime = datetime.now(timezone.utc)
                db.flush()  # Save the game start time

        # Create the point with ready status
        db_point = models.Point(
            game_id=point.game_id,
            point_number=next_point_number,
            starting_on_offense=point.starting_on_offense,
            field_side=point.field_side,
            pull=point.pull,
            strategy_id=point.strategy_id,
            comments=point.comments,
            won=None,  # Nullable while not completed
            status=models.PointStatusEnum.ready,
            start_datetime=point.start_datetime if point.start_datetime else datetime.now(timezone.utc)
        )
        db.add(db_point)
        db.flush()  # Get the ID without committing

        # Add the players to the point
        players = db.query(models.Player).filter(models.Player.id.in_(point.player_ids)).all()
        if len(players) != 7:
            db.rollback()
            raise ValueError(f"Expected 7 players, but found {len(players)}")

        db_point.players = players
        db.commit()
        db.refresh(db_point)
        return db_point
    except ValueError:
        # Re-raise ValueError (business logic errors) without logging as error
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            f"Database error creating point for game {point.game_id}: {e}",
            exc_info=True
        )
        raise


def get_point(db: Session, point_id: int) -> Optional[models.Point]:
    return db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.id == point_id
    ).first()


def get_points_by_game(db: Session, game_id: int) -> List[models.Point]:
    return db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id
    ).order_by(models.Point.point_number.desc()).all()


def update_point(db: Session, point_id: int, point_update: schemas.PointUpdate) -> Optional[models.Point]:
    db_point = get_point(db, point_id)
    if db_point:
        try:
            # Update fields if provided
            if point_update.starting_on_offense is not None:
                db_point.starting_on_offense = point_update.starting_on_offense
            if point_update.won is not None:
                db_point.won = point_update.won
            if point_update.field_side is not None:
                db_point.field_side = point_update.field_side
            if point_update.pull is not None:
                db_point.pull = point_update.pull
            if point_update.comments is not None:
                db_point.comments = point_update.comments
            if point_update.status is not None:
                db_point.status = point_update.status
            if point_update.strategy_id is not None:
                # Validate strategy exists
                strategy = db.query(models.Strategy).filter(models.Strategy.id == point_update.strategy_id).first()
                if not strategy:
                    db.rollback()
                    raise ValueError(f"Strategy with ID {point_update.strategy_id} not found")
                db_point.strategy_id = point_update.strategy_id
            if point_update.start_datetime is not None:
                db_point.start_datetime = point_update.start_datetime
            if point_update.end_datetime is not None:
                db_point.end_datetime = point_update.end_datetime

            # Validate end datetime is after start datetime
            if db_point.start_datetime and db_point.end_datetime:
                start_aware = _ensure_timezone_aware(db_point.start_datetime)
                end_aware = _ensure_timezone_aware(db_point.end_datetime)
                if start_aware and end_aware and end_aware <= start_aware:
                    db.rollback()
                    raise ValueError("end_datetime must be after start_datetime")

            if point_update.player_ids is not None:
                players = db.query(models.Player).filter(models.Player.id.in_(point_update.player_ids)).all()
                if len(players) != 7:
                    db.rollback()
                    raise ValueError(f"Expected 7 players, but found {len(players)}")
                db_point.players = players

            db.commit()
            db.refresh(db_point)
        except ValueError:
            # Re-raise ValueError (business logic errors) without logging as error
            raise
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(
                f"Database error updating point {point_id}: {e}",
                exc_info=True
            )
            raise
    return db_point


def delete_point(db: Session, point_id: int) -> bool:
    db_point = get_point(db, point_id)
    if db_point:
        game_id = db_point.game_id
        db.delete(db_point)
        db.flush()  # Commit the delete first

        # Check if this was the last point - if so, reset game's start_datetime
        remaining_points = db.query(models.Point).filter(
            models.Point.game_id == game_id
        ).count()

        if remaining_points == 0:
            from app.crud.games import get_game
            game = get_game(db, game_id)
            if game:
                game.start_datetime = None

        db.commit()
        return True
    return False


def finish_point(db: Session, point_id: int, finish_data: schemas.PointFinish) -> Optional[models.Point]:
    """Complete a running or scored point by setting won and end_datetime"""
    db_point = get_point(db, point_id)
    if not db_point:
        return None

    try:
        # Can only finish running or scored points
        if db_point.status not in [models.PointStatusEnum.running, models.PointStatusEnum.scored]:
            raise ValueError(
                f"Point {point_id} cannot be finished (status: {db_point.status.value}). "
                f"Only running or scored points can be finished."
            )

        # Set the result and end datetime
        db_point.won = finish_data.won
        db_point.end_datetime = finish_data.end_datetime if finish_data.end_datetime else datetime.now(timezone.utc)
        db_point.status = models.PointStatusEnum.completed

        # Update comments if provided
        if finish_data.comments is not None:
            db_point.comments = finish_data.comments

        # Validate end datetime is after start datetime
        start_aware = _ensure_timezone_aware(db_point.start_datetime)
        end_aware = _ensure_timezone_aware(db_point.end_datetime)
        if start_aware and end_aware and end_aware <= start_aware:
            db.rollback()
            raise ValueError("end_datetime must be after start_datetime")

        db.commit()
        db.refresh(db_point)
        return db_point
    except ValueError:
        # Re-raise ValueError (business logic errors) without logging as error
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(
            f"Database error finishing point {point_id}: {e}",
            exc_info=True
        )
        raise


def cancel_point(db: Session, point_id: int) -> bool:
    """Cancel (delete) a ready or running point. Only non-finalized points can be cancelled."""
    db_point = get_point(db, point_id)
    if not db_point:
        return False

    # Can only cancel ready or running points
    if db_point.status not in [models.PointStatusEnum.ready, models.PointStatusEnum.running]:
        raise ValueError(
            f"Can only cancel ready or running points. Point {point_id} has status: {db_point.status.value}"
        )

    db.delete(db_point)
    db.commit()
    return True
