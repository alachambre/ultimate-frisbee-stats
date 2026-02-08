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


def get_active_point_for_game(db: Session, game_id: int) -> Optional[models.Point]:
    """Get the active (ready or running) point for a game, if any"""
    return db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id,
        models.Point.status.in_([models.PointStatusEnum.ready, models.PointStatusEnum.running])
    ).first()


def create_point(db: Session, point: schemas.PointCreate) -> models.Point:
    try:
        # Validate game exists and is not ended
        from app.crud.games import get_game
        game = get_game(db, point.game_id)
        if not game:
            raise ValueError("Game not found")
        if game.status.value == "ended":
            raise ValueError("Cannot add points to an ended game")

        # Check for existing ready or running point for this game
        active_point = db.query(models.Point).filter(
            models.Point.game_id == point.game_id,
            models.Point.status.in_([models.PointStatusEnum.ready, models.PointStatusEnum.running])
        ).first()
        if active_point:
            status_name = active_point.status.value
            raise ValueError(f"Game {point.game_id} already has a {status_name} point (ID: {active_point.id})")

        # Validate strategy exists if provided
        if point.strategy_id:
            strategy = db.query(models.Strategy).filter(models.Strategy.id == point.strategy_id).first()
            if not strategy:
                raise ValueError("Strategy not found")

        # Get current max point number for this game
        max_point = db.query(models.Point).filter(
            models.Point.game_id == point.game_id
        ).order_by(models.Point.point_number.desc()).first()

        next_point_number = (max_point.point_number + 1) if max_point else 1

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
            # start_datetime is set when transitioning to 'running'
            start_datetime=None
        )
        db.add(db_point)
        db.flush()  # Get the ID without committing

        # Add the players to the point (if provided)
        if point.player_ids:
            players = db.query(models.Player).filter(models.Player.id.in_(point.player_ids)).all()
            if len(players) != len(point.player_ids):
                db.rollback()
                raise ValueError(f"Some player IDs not found: {point.player_ids}")
            # Allow any number of players during creation - validation happens at completion
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
            new_status_enum = None
            transitioned_ready_to_running = False

            # Update player_ids FIRST (before status validation)
            if point_update.player_ids is not None:
                if len(point_update.player_ids) == 0:
                    # Allow clearing players
                    db_point.players = []
                else:
                    players = db.query(models.Player).filter(models.Player.id.in_(point_update.player_ids)).all()
                    if len(players) != len(point_update.player_ids):
                        db.rollback()
                        raise ValueError(f"Some player IDs not found: {point_update.player_ids}")
                    # Allow any number of players during update
                    # Validation for exactly 7 happens when transitioning to 'completed' status
                    db_point.players = players

            # Update other fields
            if point_update.starting_on_offense is not None:
                db_point.starting_on_offense = point_update.starting_on_offense
            if "won" in point_update.model_fields_set:
                db_point.won = point_update.won
            if point_update.field_side is not None:
                db_point.field_side = point_update.field_side
            if point_update.pull is not None:
                db_point.pull = point_update.pull
            if point_update.comments is not None:
                db_point.comments = point_update.comments
            if point_update.status is not None:
                # Convert schema enum to model enum for comparison
                new_status_value = point_update.status.value if hasattr(point_update.status, 'value') else point_update.status
                new_status_enum = models.PointStatusEnum(new_status_value)

                # Validate status transitions
                current = db_point.status
                if new_status_enum == models.PointStatusEnum.running and current not in [
                    models.PointStatusEnum.ready,
                    models.PointStatusEnum.scored,
                ]:
                    raise ValueError(f"Invalid status transition: {current.value} -> running")
                if new_status_enum == models.PointStatusEnum.scored and current != models.PointStatusEnum.running:
                    raise ValueError(f"Invalid status transition: {current.value} -> scored")
                if new_status_enum == models.PointStatusEnum.completed and current not in [
                    models.PointStatusEnum.running,
                    models.PointStatusEnum.scored,
                ]:
                    raise ValueError(f"Invalid status transition: {current.value} -> completed")

                # Set start_datetime when transitioning from 'ready' to 'running' (if not already set)
                if (new_status_enum == models.PointStatusEnum.running and
                    db_point.status == models.PointStatusEnum.ready and
                    db_point.start_datetime is None):
                    transitioned_ready_to_running = True
                    db_point.start_datetime = datetime.now(timezone.utc)
                elif (
                    new_status_enum == models.PointStatusEnum.running and
                    db_point.status == models.PointStatusEnum.ready
                ):
                    transitioned_ready_to_running = True

                # Validate player count when completing a point
                if new_status_enum == models.PointStatusEnum.completed:
                    player_count = len(db_point.players)
                    if player_count != 7:
                        db.rollback()
                        raise ValueError(f"Cannot complete point: must have exactly 7 players (currently has {player_count})")
                db_point.status = new_status_enum
            if point_update.strategy_id is not None:
                # Validate strategy exists
                strategy = db.query(models.Strategy).filter(models.Strategy.id == point_update.strategy_id).first()
                if not strategy:
                    db.rollback()
                    raise ValueError(f"Strategy with ID {point_update.strategy_id} not found")
                db_point.strategy_id = point_update.strategy_id
            if "start_datetime" in point_update.model_fields_set:
                db_point.start_datetime = point_update.start_datetime
            if "end_datetime" in point_update.model_fields_set:
                db_point.end_datetime = point_update.end_datetime

            # Start game chrono when the first pull is launched (first ready -> running transition).
            # Reuse the point start timestamp so both timers stay aligned.
            if transitioned_ready_to_running:
                game = db.query(models.Game).filter(models.Game.id == db_point.game_id).first()
                if game and game.start_datetime is None:
                    game.start_datetime = db_point.start_datetime or datetime.now(timezone.utc)

            # Prevent setting won unless scored/completed
            if "won" in point_update.model_fields_set and point_update.won is not None:
                target_status = new_status_enum if new_status_enum is not None else db_point.status
                if target_status not in [models.PointStatusEnum.scored, models.PointStatusEnum.completed]:
                    db.rollback()
                    raise ValueError("Cannot set won unless point is scored or completed")

            # Validate end datetime is after start datetime
            if db_point.start_datetime and db_point.end_datetime:
                start_aware = _ensure_timezone_aware(db_point.start_datetime)
                end_aware = _ensure_timezone_aware(db_point.end_datetime)
                if start_aware and end_aware and end_aware <= start_aware:
                    db.rollback()
                    raise ValueError("end_datetime must be after start_datetime")

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
