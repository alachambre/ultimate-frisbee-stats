"""
Query helpers for statistics calculations.
"""
from collections import defaultdict
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.game import Game
from app.models.point import Point
from app.models.player import Player
from app.models.competition import Competition
from app.models.team import Team
from app.models.call import Call
from app.models.turnover import Turnover
from app.models.strategy import Strategy
from app.models.base import PointStatusEnum


def get_game(db: Session, game_id: int) -> Optional[Game]:
    return db.query(Game).filter(Game.id == game_id).first()


def get_competition(db: Session, competition_id: int) -> Optional[Competition]:
    return db.query(Competition).filter(Competition.id == competition_id).first()


def get_team(db: Session, team_id: int) -> Optional[Team]:
    return db.query(Team).filter(Team.id == team_id).first()


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


def get_completed_points_for_competition(
    db: Session,
    competition_id: int,
    require_timestamps: bool = False,
) -> List[Point]:
    query = db.query(Point).join(Game).filter(
        Game.competition_id == competition_id,
        Point.status == PointStatusEnum.completed,
    )
    if require_timestamps:
        query = query.filter(
            Point.start_datetime.isnot(None),
            Point.end_datetime.isnot(None),
        )
    return query.all()


def get_completed_points_for_team(
    db: Session,
    team_id: int,
    require_timestamps: bool = False,
) -> List[Point]:
    query = db.query(Point).join(Game).join(Competition).filter(
        Competition.team_id == team_id,
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


def get_calls_for_points(db: Session, point_ids: List[int]) -> Dict[int, List[Call]]:
    if not point_ids:
        return {}

    point_id_set = set(point_ids)
    calls = db.query(Call).filter(Call.point_id.in_(list(point_id_set))).order_by(Call.point_id).all()

    calls_by_point: Dict[int, List[Call]] = defaultdict(list)
    for call in calls:
        calls_by_point[call.point_id].append(call)

    return {point_id: calls_by_point.get(point_id, []) for point_id in point_id_set}


def get_turnovers_for_point(db: Session, point_id: int) -> List[Turnover]:
    return db.query(Turnover).filter(Turnover.point_id == point_id).order_by(Turnover.timestamp).all()


def get_turnovers_for_points(db: Session, point_ids: List[int]) -> Dict[int, List[Turnover]]:
    if not point_ids:
        return {}

    point_id_set = set(point_ids)
    turnovers = (
        db.query(Turnover)
        .filter(Turnover.point_id.in_(list(point_id_set)))
        .order_by(Turnover.point_id, Turnover.timestamp)
        .all()
    )

    turnovers_by_point: Dict[int, List[Turnover]] = defaultdict(list)
    for turnover in turnovers:
        turnovers_by_point[turnover.point_id].append(turnover)

    return {point_id: turnovers_by_point.get(point_id, []) for point_id in point_id_set}


def get_strategy(db: Session, strategy_id: int) -> Optional[Strategy]:
    return db.query(Strategy).filter(Strategy.id == strategy_id).first()


def get_strategies_by_ids(db: Session, strategy_ids: List[int]) -> Dict[int, Strategy]:
    if not strategy_ids:
        return {}
    strategies = db.query(Strategy).filter(Strategy.id.in_(list(set(strategy_ids)))).all()
    return {strategy.id: strategy for strategy in strategies}
