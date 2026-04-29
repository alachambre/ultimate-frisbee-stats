"""
Statistics CRUD operations (facade).
"""

from datetime import datetime
from typing import Callable, Dict, List, Optional

from sqlalchemy.orm import Session

from app.crud.statistics_dataset import (
    StatisticsScope,
    build_statistics_dataset,
)
from app.crud.statistics_calculations import (
    build_competition_team_stats,
    build_game_strategy_stats,
    build_game_team_stats,
    build_live_player_stats,
    calculate_point_duration_seconds,
    count_turnovers_by_possession,
    build_team_team_stats,
)
from app.crud.statistics_evolution import get_team_evolution
from app.crud.statistics_queries import (
    get_completed_points,
)


def _sort_points_for_timeline(points: List) -> List:
    def point_sort_key(point) -> tuple:
        timestamp = point.end_datetime or point.start_datetime or point.created_at
        return (
            point.point_number,
            timestamp or datetime.min,
            point.id,
        )

    return sorted(points, key=point_sort_key)


def _get_point_reference_timestamp(point) -> Optional[datetime]:
    return point.end_datetime or point.start_datetime or point.created_at


def _get_halftime_after_point_number(all_completed_points: List, halftime) -> Optional[int]:
    if halftime is None:
        return None

    halftime_timestamp = halftime.halftime_timestamp
    points_before_halftime = [
        point.point_number
        for point in all_completed_points
        if (
            (reference_timestamp := _get_point_reference_timestamp(point)) is not None
            and reference_timestamp <= halftime_timestamp
        )
    ]

    if not points_before_halftime:
        return 0

    return max(points_before_halftime)


def _build_scope_player_stats(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    *,
    include_players_from_points: bool = False,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[List[Dict]]:
    dataset = build_statistics_dataset(
        db,
        scope_type,
        scope_id,
        require_timestamps=True,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
        include_players=True,
        include_players_from_points=include_players_from_points,
        include_turnovers=True,
        include_stoppages=True,
    )
    if dataset is None:
        return None

    return build_live_player_stats(
        dataset.completed_points,
        dataset.players,
        dataset.stoppages_by_point,
        dataset.turnovers_by_point,
    )


def _build_scope_team_stats(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    calculator: Callable[[int, List, Dict[int, List]], Dict],
    *,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    dataset = build_statistics_dataset(
        db,
        scope_type,
        scope_id,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
        include_turnovers=True,
    )
    if dataset is None:
        return None

    return calculator(scope_id, dataset.completed_points, dataset.turnovers_by_point)


def _build_scope_strategy_stats(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    scope_key: str,
    *,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    dataset = build_statistics_dataset(
        db,
        scope_type,
        scope_id,
        require_timestamps=True,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
        include_turnovers=True,
        include_strategies=True,
    )
    if dataset is None:
        return None

    strategy_stats = build_game_strategy_stats(
        dataset.completed_points,
        dataset.strategies_by_id,
        dataset.turnovers_by_point,
    )

    return {
        scope_key: scope_id,
        "offense_strategies": strategy_stats["offense_strategies"],
        "defense_strategies": strategy_stats["defense_strategies"],
    }


def get_live_game_player_stats(
    db: Session,
    game_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> List[Dict]:
    """
    Get live statistics for all players in a game.
    Only considers completed points.

    Returns list of dicts with:
    - player_id: int
    - player_name: str
    - player_number: int
    - points_played: int (number of completed points)
    - effective_time_seconds: int (total playing time minus stoppage durations)
    - offense: dict (points_played, points_won, points_lost, hold_rate, points_won_no_turnover, clean_hold_rate)
    - defense: dict (points_played, points_won, points_lost, break_rate, points_with_turnover, turnover_rate, points_won_no_turnover, clean_break_rate, points_lost_no_turnover)
    """
    player_stats = _build_scope_player_stats(
        db,
        "game",
        game_id,
        required_player_ids=required_player_ids,
    )
    return player_stats or []


def get_game_point_timeline(
    db: Session,
    game_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """Return a point-by-point timeline payload for a single game."""
    dataset = build_statistics_dataset(
        db,
        "game",
        game_id,
        required_player_ids=required_player_ids,
        include_turnovers=True,
    )
    if dataset is None:
        return None

    game = dataset.scope
    filtered_points = _sort_points_for_timeline(dataset.completed_points)
    all_completed_points = (
        _sort_points_for_timeline(get_completed_points(db, game_id))
        if required_player_ids
        else filtered_points
    )
    filtered_turnovers_by_point = dataset.turnovers_by_point

    cumulative_scores_by_point_id: Dict[int, tuple[int, int]] = {}
    our_score = 0
    opponent_score = 0
    for point in all_completed_points:
        if point.won is True:
            our_score += 1
        else:
            opponent_score += 1
        cumulative_scores_by_point_id[point.id] = (our_score, opponent_score)

    timeline_points = []
    for point in filtered_points:
        turnovers = filtered_turnovers_by_point.get(point.id, [])
        our_turnovers, opponent_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )
        score_after = cumulative_scores_by_point_id.get(point.id, (0, 0))
        duration_seconds = (
            calculate_point_duration_seconds(point)
            if point.start_datetime and point.end_datetime
            else 0
        )
        timeline_points.append({
            "point_id": point.id,
            "point_number": point.point_number,
            "starting_on_offense": point.starting_on_offense,
            "won": point.won is True,
            "field_side": point.field_side,
            "duration_seconds": duration_seconds,
            "our_turnovers": our_turnovers,
            "opponent_turnovers": opponent_turnovers,
            "our_score_after": score_after[0],
            "opponent_score_after": score_after[1],
        })

    return {
        "game_id": game_id,
        "halftime_after_point_number": _get_halftime_after_point_number(
            all_completed_points,
            game.halftime,
        ),
        "points": timeline_points,
    }


def get_competition_player_stats(
    db: Session,
    competition_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[List[Dict]]:
    """
    Get aggregated player statistics for a competition.
    Only considers completed points with valid timestamps from games in this competition.

    Returns None if competition not found.
    """
    return _build_scope_player_stats(
        db,
        "competition",
        competition_id,
        include_players_from_points=True,
        required_player_ids=required_player_ids,
    )


def get_team_player_stats(
    db: Session,
    team_id: int,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[List[Dict]]:
    """
    Get aggregated player statistics for a team across all competitions.
    Only considers completed points with valid timestamps.

    Returns None if team not found.
    """
    return _build_scope_player_stats(
        db,
        "team",
        team_id,
        include_players_from_points=bool(competition_ids or game_ids),
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
    )


def get_game_team_stats(
    db: Session,
    game_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get team statistics for a game.
    Only considers completed points.

    Returns dict with:
    - game_id: int
    - total_completed_points: int
    - offense: OffenseStats dict
    - defense: DefenseStats dict (includes pull_stats)

    Returns None if game not found.
    """
    return _build_scope_team_stats(
        db,
        "game",
        game_id,
        build_game_team_stats,
        required_player_ids=required_player_ids,
    )


def get_competition_team_stats(
    db: Session,
    competition_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get aggregated team statistics for an entire competition.
    Only considers completed points from all games in the competition.

    Returns None if competition not found.
    """
    return _build_scope_team_stats(
        db,
        "competition",
        competition_id,
        build_competition_team_stats,
        required_player_ids=required_player_ids,
    )


def get_team_team_stats(
    db: Session,
    team_id: int,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get aggregated team statistics across all competitions for a team.
    Only considers completed points from all games tied to the team.

    Returns None if team not found.
    """
    return _build_scope_team_stats(
        db,
        "team",
        team_id,
        build_team_team_stats,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
    )


def get_game_strategy_stats(
    db: Session,
    game_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get strategy statistics for a game.
    Only considers completed points with assigned strategies.

    Returns dict with:
    - game_id: int
    - offense_strategies: list of dicts (strategy stats for offense)
    - defense_strategies: list of dicts (strategy stats for defense)

    Returns None if game not found.
    """
    return _build_scope_strategy_stats(
        db,
        "game",
        game_id,
        "game_id",
        required_player_ids=required_player_ids,
    )


def get_competition_strategy_stats(
    db: Session,
    competition_id: int,
    required_player_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get strategy statistics for a competition.
    Only considers completed points with assigned strategies and valid timestamps.

    Returns None if competition not found.
    """
    return _build_scope_strategy_stats(
        db,
        "competition",
        competition_id,
        "competition_id",
        required_player_ids=required_player_ids,
    )


def get_team_strategy_stats(
    db: Session,
    team_id: int,
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[Dict]:
    """
    Get strategy statistics for a team across all competitions.
    Only considers completed points with assigned strategies and valid timestamps.

    Returns None if team not found.
    """
    return _build_scope_strategy_stats(
        db,
        "team",
        team_id,
        "team_id",
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
    )
