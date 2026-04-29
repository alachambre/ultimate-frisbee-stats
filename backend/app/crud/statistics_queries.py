"""
Query helpers for statistics calculations.
"""
from collections import defaultdict
from typing import Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Query, Session, selectinload

from app.models.game import Game
from app.models.point import Point
from app.models.player import Player
from app.models.competition import Competition
from app.models.team import Team
from app.models.stoppage import Stoppage
from app.models.turnover import Turnover
from app.models.strategy import Strategy
from app.models.base import PointStatusEnum, point_players


def get_game(db: Session, game_id: int) -> Optional[Game]:
    return db.query(Game).filter(Game.id == game_id).first()


def get_competition(db: Session, competition_id: int) -> Optional[Competition]:
    return db.query(Competition).filter(Competition.id == competition_id).first()


def get_team(db: Session, team_id: int) -> Optional[Team]:
    return db.query(Team).filter(Team.id == team_id).first()


def _apply_team_dataset_filters(
    query: Query,
    team_id: int,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Query:
    query = query.join(Game).join(Competition).filter(Competition.team_id == team_id)

    if competition_ids:
        query = query.filter(Game.competition_id.in_(competition_ids))

    if game_ids:
        query = query.filter(Game.id.in_(game_ids))

    return query


def _normalize_required_player_ids(required_player_ids: Optional[List[int]]) -> List[int]:
    if not required_player_ids:
        return []
    return sorted(set(required_player_ids))


def _apply_required_player_filter(
    query: Query,
    required_player_ids: Optional[List[int]],
) -> Query:
    normalized_player_ids = _normalize_required_player_ids(required_player_ids)
    if not normalized_player_ids:
        return query

    matching_point_ids = (
        select(point_players.c.point_id)
        .where(point_players.c.player_id.in_(normalized_player_ids))
        .group_by(point_players.c.point_id)
        .having(func.count(func.distinct(point_players.c.player_id)) == len(normalized_player_ids))
    )
    return query.filter(Point.id.in_(matching_point_ids))


def _apply_point_load_options(
    query: Query,
    *,
    load_players: bool = False,
    load_strategy: bool = False,
    load_game: bool = False,
) -> Query:
    options = []
    if load_players:
        options.append(selectinload(Point.players))
    if load_strategy:
        options.append(selectinload(Point.strategy))
    if load_game:
        options.append(selectinload(Point.game).selectinload(Game.competition))

    if not options:
        return query
    return query.options(*options)


def get_completed_points(
    db: Session,
    game_id: int,
    require_timestamps: bool = False,
    required_player_ids: Optional[List[int]] = None,
    load_players: bool = False,
    load_strategy: bool = False,
    load_game: bool = False,
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
    query = _apply_required_player_filter(query, required_player_ids)
    query = _apply_point_load_options(
        query,
        load_players=load_players,
        load_strategy=load_strategy,
        load_game=load_game,
    )
    return query.all()


def get_completed_points_for_competition(
    db: Session,
    competition_id: int,
    require_timestamps: bool = False,
    required_player_ids: Optional[List[int]] = None,
    load_players: bool = False,
    load_strategy: bool = False,
    load_game: bool = False,
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
    query = _apply_required_player_filter(query, required_player_ids)
    query = _apply_point_load_options(
        query,
        load_players=load_players,
        load_strategy=load_strategy,
        load_game=load_game,
    )
    return query.all()


def get_completed_points_for_team(
    db: Session,
    team_id: int,
    require_timestamps: bool = False,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
    load_players: bool = False,
    load_strategy: bool = False,
    load_game: bool = False,
) -> List[Point]:
    query = _apply_team_dataset_filters(
        db.query(Point),
        team_id,
        competition_ids=competition_ids,
        game_ids=game_ids,
    ).filter(
        Point.status == PointStatusEnum.completed,
    )
    if require_timestamps:
        query = query.filter(
            Point.start_datetime.isnot(None),
            Point.end_datetime.isnot(None),
        )
    query = _apply_required_player_filter(query, required_player_ids)
    query = _apply_point_load_options(
        query,
        load_players=load_players,
        load_strategy=load_strategy,
        load_game=load_game,
    )
    return query.all()


def get_game_players(db: Session, game_id: int) -> List[Player]:
    return db.query(Player).join(Game.players).filter(Game.id == game_id).all()


def get_competition_players(db: Session, competition_id: int) -> List[Player]:
    competition = get_competition(db, competition_id)
    if not competition:
        return []
    return list(competition.players)


def get_team_players(
    db: Session,
    team_id: int,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> List[Player]:
    if game_ids:
        query = (
            db.query(Player)
            .join(Player.games)
            .join(Game.competition)
            .filter(
                Player.team_id == team_id,
                Competition.team_id == team_id,
                Game.id.in_(game_ids),
            )
        )
        if competition_ids:
            query = query.filter(Game.competition_id.in_(competition_ids))
        return query.distinct().all()

    if competition_ids:
        return (
            db.query(Player)
            .join(Player.competitions)
            .filter(
                Player.team_id == team_id,
                Competition.team_id == team_id,
                Competition.id.in_(competition_ids),
            )
            .distinct()
            .all()
        )

    return db.query(Player).filter(Player.team_id == team_id).all()


def get_stoppages_for_point(db: Session, point_id: int) -> List[Stoppage]:
    return db.query(Stoppage).filter(Stoppage.point_id == point_id).all()


def get_stoppages_for_points(db: Session, point_ids: List[int]) -> Dict[int, List[Stoppage]]:
    if not point_ids:
        return {}

    point_id_set = set(point_ids)
    stoppages = (
        db.query(Stoppage)
        .filter(Stoppage.point_id.in_(list(point_id_set)))
        .order_by(Stoppage.point_id)
        .all()
    )

    stoppages_by_point: Dict[int, List[Stoppage]] = defaultdict(list)
    for stoppage in stoppages:
        stoppages_by_point[stoppage.point_id].append(stoppage)

    return {point_id: stoppages_by_point.get(point_id, []) for point_id in point_id_set}


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


def filter_points_by_player_ids(points: List[Point], required_player_ids: Optional[List[int]]) -> List[Point]:
    """
    Keep only points where all required players were on the point.
    """
    if not required_player_ids:
        return points

    required_ids = set(required_player_ids)
    if not required_ids:
        return points

    filtered_points: List[Point] = []
    for point in points:
        point_player_ids = {player.id for player in point.players}
        if required_ids.issubset(point_player_ids):
            filtered_points.append(point)

    return filtered_points
