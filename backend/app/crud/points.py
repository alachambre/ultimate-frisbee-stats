from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app import models, schemas


def get_active_point_for_game(db: Session, game_id: int) -> Optional[models.Point]:
    """Get the active point for a game, if any"""
    return db.query(models.Point).options(joinedload(models.Point.players)).filter(
        models.Point.game_id == game_id,
        models.Point.status == "active"
    ).first()


def create_point(db: Session, point: schemas.PointCreate) -> models.Point:
    # Check for existing active point for this game
    active_point = get_active_point_for_game(db, point.game_id)
    if active_point:
        raise ValueError(f"Game {point.game_id} already has an active point (ID: {active_point.id})")

    # Get current max point number for this game
    max_point = db.query(models.Point).filter(
        models.Point.game_id == point.game_id
    ).order_by(models.Point.point_number.desc()).first()

    next_point_number = (max_point.point_number + 1) if max_point else 1

    # Create the point with active status
    db_point = models.Point(
        game_id=point.game_id,
        point_number=next_point_number,
        starting_on_offense=point.starting_on_offense,
        won=None,  # Nullable while active
        status="active",
        start_datetime=point.start_datetime if point.start_datetime else datetime.utcnow()
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


def get_point(db: Session, point_id: int) -> Optional[models.Point]:
    return db.query(models.Point).options(joinedload(models.Point.players)).filter(
        models.Point.id == point_id
    ).first()


def get_points_by_game(db: Session, game_id: int) -> List[models.Point]:
    return db.query(models.Point).options(joinedload(models.Point.players)).filter(
        models.Point.game_id == game_id
    ).order_by(models.Point.point_number).all()


def update_point(db: Session, point_id: int, point_update: schemas.PointUpdate) -> Optional[models.Point]:
    db_point = get_point(db, point_id)
    if db_point:
        # Update fields if provided
        if point_update.starting_on_offense is not None:
            db_point.starting_on_offense = point_update.starting_on_offense
        if point_update.won is not None:
            db_point.won = point_update.won
        if point_update.status is not None:
            db_point.status = point_update.status
        if point_update.start_datetime is not None:
            db_point.start_datetime = point_update.start_datetime
        if point_update.end_datetime is not None:
            db_point.end_datetime = point_update.end_datetime

        # Validate end datetime is after start datetime
        if db_point.start_datetime and db_point.end_datetime:
            if db_point.end_datetime <= db_point.start_datetime:
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
    return db_point


def delete_point(db: Session, point_id: int) -> bool:
    db_point = get_point(db, point_id)
    if db_point:
        db.delete(db_point)
        db.commit()
        return True
    return False


def finish_point(db: Session, point_id: int, finish_data: schemas.PointFinish) -> Optional[models.Point]:
    """Complete an active point by setting won and end_datetime"""
    db_point = get_point(db, point_id)
    if not db_point:
        return None

    if db_point.status != "active":
        raise ValueError(f"Point {point_id} is not active (status: {db_point.status})")

    # Set the result and end datetime
    db_point.won = finish_data.won
    db_point.end_datetime = finish_data.end_datetime if finish_data.end_datetime else datetime.utcnow()
    db_point.status = "completed"

    # Validate end datetime is after start datetime
    if db_point.start_datetime and db_point.end_datetime <= db_point.start_datetime:
        db.rollback()
        raise ValueError("end_datetime must be after start_datetime")

    db.commit()
    db.refresh(db_point)
    return db_point


def cancel_point(db: Session, point_id: int) -> bool:
    """Cancel (delete) an active point. Only active points can be cancelled."""
    db_point = get_point(db, point_id)
    if not db_point:
        return False

    if db_point.status != "active":
        raise ValueError(f"Can only cancel active points. Point {point_id} has status: {db_point.status}")

    db.delete(db_point)
    db.commit()
    return True
