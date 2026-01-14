from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app import models, schemas


def create_game(db: Session, game: schemas.GameCreate) -> models.Game:
    db_game = models.Game(
        team_id=game.team_id,
        opponent_name=game.opponent_name,
        date=game.date,
        status="in_progress"
    )
    db.add(db_game)
    db.commit()
    db.refresh(db_game)
    return db_game


def get_game(db: Session, game_id: int) -> Optional[models.Game]:
    return db.query(models.Game).filter(models.Game.id == game_id).first()


def get_games_by_team(db: Session, team_id: int) -> List[models.Game]:
    return db.query(models.Game).filter(models.Game.team_id == team_id).order_by(models.Game.date.desc()).all()


def update_game(db: Session, game_id: int, game_update: schemas.GameUpdate) -> Optional[models.Game]:
    db_game = get_game(db, game_id)
    if db_game:
        if game_update.opponent_name is not None:
            db_game.opponent_name = game_update.opponent_name
        if game_update.status is not None:
            db_game.status = game_update.status
        db.commit()
        db.refresh(db_game)
    return db_game


def finish_game(db: Session, game_id: int) -> Optional[models.Game]:
    return update_game(db, game_id, schemas.GameUpdate(status="finished"))


def delete_game(db: Session, game_id: int) -> bool:
    db_game = get_game(db, game_id)
    if db_game:
        db.delete(db_game)
        db.commit()
        return True
    return False


def get_game_score(db: Session, game_id: int) -> tuple[int, int]:
    """Calculate the score for a game (our_score, opponent_score)"""
    from app.crud.points import get_points_by_game
    points = get_points_by_game(db, game_id)
    our_score = sum(1 for p in points if p.won)
    opponent_score = len(points) - our_score
    return our_score, opponent_score


def get_game_detail(db: Session, game_id: int) -> Optional[dict]:
    """Get complete game information with score and all points"""
    from app.crud.points import get_points_by_game
    game = get_game(db, game_id)
    if not game:
        return None

    points = get_points_by_game(db, game_id)
    our_score, opponent_score = get_game_score(db, game_id)

    return {
        **game.__dict__,
        "our_score": our_score,
        "opponent_score": opponent_score,
        "points": points
    }
