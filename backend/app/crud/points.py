from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app import models, schemas
from app.crud.statistics_calculations import count_turnovers_by_possession
from app.crud.statistics_queries import get_turnovers_for_points
from app.logging_config import get_logger
from app.services import live_game

logger = get_logger("crud.points")


def _annotate_point_turnover_counts(
    point: models.Point,
    turnovers: List[models.Turnover],
) -> models.Point:
    our_turnovers, opponent_turnovers = count_turnovers_by_possession(
        point.starting_on_offense,
        turnovers,
    )
    setattr(point, "our_turnovers", our_turnovers)
    setattr(point, "opponent_turnovers", opponent_turnovers)
    return point


def _annotate_points_turnover_counts(
    db: Session,
    points: List[models.Point],
) -> List[models.Point]:
    if not points:
        return points

    turnovers_by_point = get_turnovers_for_points(db, [point.id for point in points])
    for point in points:
        _annotate_point_turnover_counts(point, turnovers_by_point.get(point.id, []))
    return points


def _annotate_point_turnover_counts_for_single(
    db: Session,
    point: Optional[models.Point],
) -> Optional[models.Point]:
    if point is None:
        return None

    _annotate_points_turnover_counts(db, [point])
    return point


def get_running_point_for_game(db: Session, game_id: int) -> Optional[models.Point]:
    """Get the running point for a game, if any"""
    point = db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id,
        models.Point.status == models.PointStatusEnum.running
    ).first()
    return _annotate_point_turnover_counts_for_single(db, point)


def get_active_point_for_game(db: Session, game_id: int) -> Optional[models.Point]:
    """Get the active (ready or running) point for a game, if any"""
    point = db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id,
        models.Point.status.in_([models.PointStatusEnum.ready, models.PointStatusEnum.running])
    ).first()
    return _annotate_point_turnover_counts_for_single(db, point)


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
        return _annotate_point_turnover_counts_for_single(db, db_point)
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
    point = db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.id == point_id
    ).first()
    return _annotate_point_turnover_counts_for_single(db, point)


def get_points_by_game(db: Session, game_id: int) -> List[models.Point]:
    points = db.query(models.Point).options(
        joinedload(models.Point.players),
        joinedload(models.Point.strategy)
    ).filter(
        models.Point.game_id == game_id
    ).order_by(models.Point.point_number.desc()).all()
    return _annotate_points_turnover_counts(db, points)


def update_point(db: Session, point_id: int, point_update: schemas.PointUpdate) -> Optional[models.Point]:
    db_point = get_point(db, point_id)
    if db_point:
        try:
            new_status_enum = None

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
                requested_start_datetime = (
                    point_update.start_datetime
                    if "start_datetime" in point_update.model_fields_set
                    else None
                )
                live_game.transition_point_status(
                    db,
                    db_point,
                    new_status_enum,
                    requested_start_datetime=requested_start_datetime,
                )
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

            # Prevent setting won unless scored/completed
            target_status = new_status_enum if new_status_enum is not None else db_point.status
            try:
                live_game.validate_point_result_allowed(
                    db_point,
                    "won" in point_update.model_fields_set,
                    point_update.won,
                    target_status,
                )
            except ValueError:
                db.rollback()
                raise

            # Validate end datetime is after start datetime
            try:
                live_game.validate_point_timestamps(db_point)
            except ValueError:
                db.rollback()
                raise

            db.commit()
            db.refresh(db_point)
            _annotate_point_turnover_counts_for_single(db, db_point)
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
        live_game.finish_point(
            db_point,
            won=finish_data.won,
            end_datetime=finish_data.end_datetime,
            comments=finish_data.comments,
        )

        db.commit()
        db.refresh(db_point)
        return _annotate_point_turnover_counts_for_single(db, db_point)
    except ValueError:
        db.rollback()
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

    live_game.cancel_point(db, db_point)
    db.commit()
    return True
