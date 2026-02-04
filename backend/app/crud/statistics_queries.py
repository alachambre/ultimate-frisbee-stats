"""
Query helpers for statistics calculations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.point import Point
from app.models.player import Player
from app.models.call import Call
from app.models.turnover import Turnover
from app.models.strategy import Strategy
from app.models.base import PointStatusEnum


def get_game(db: Session, game_id: int) -> Optional[Game]:
    return db.query(Game).filter(Game.id == game_id).first()


def get_completed_points(
    db: Session,
    game_id: int,
    require_timestamps: bool = False,
) -> List[Point]:
    query = db.query(Point).filter(
        Point.game_id == game_id,
        Point.status == PointStatusEnum.completed,
    )
    if require_timestamps:
        query = query.filter(
            Point.start_datetime.isnot(None),
            Point.end_datetime.isnot(None),
        )
    return query.all()


def get_game_players(db: Session, game_id: int) -> List[Player]:
    return db.query(Player).join(Game.players).filter(Game.id == game_id).all()


def get_calls_for_point(db: Session, point_id: int) -> List[Call]:
    return db.query(Call).filter(Call.point_id == point_id).all()


def get_turnovers_for_point(db: Session, point_id: int) -> List[Turnover]:
    return db.query(Turnover).filter(Turnover.point_id == point_id).order_by(Turnover.timestamp).all()


def get_strategy(db: Session, strategy_id: int) -> Optional[Strategy]:
    return db.query(Strategy).filter(Strategy.id == strategy_id).first()
