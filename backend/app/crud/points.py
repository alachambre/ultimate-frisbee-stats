from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app import models, schemas


def create_point(db: Session, point: schemas.PointCreate) -> models.Point:
    # Get current max point number for this game
    max_point = db.query(models.Point).filter(
        models.Point.game_id == point.game_id
    ).order_by(models.Point.point_number.desc()).first()

    next_point_number = (max_point.point_number + 1) if max_point else 1

    # Create the point
    db_point = models.Point(
        game_id=point.game_id,
        point_number=next_point_number,
        starting_on_offense=point.starting_on_offense,
        won=point.won
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
        db_point.starting_on_offense = point_update.starting_on_offense
        db_point.won = point_update.won

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
