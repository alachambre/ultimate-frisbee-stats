"""
Statistics CRUD operations (facade).
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from app.crud.statistics_queries import (
    get_game,
    get_completed_points,
    get_game_players,
    get_calls_for_point,
    get_turnovers_for_point,
    get_strategy,
)
from app.crud.statistics_calculations import (
    build_live_player_stats,
    build_game_team_stats,
    build_game_strategy_stats,
)


def get_live_game_player_stats(db: Session, game_id: int) -> List[Dict]:
    """
    Get live statistics for all players in a game.
    Only considers completed points.

    Returns list of dicts with:
    - player_id: int
    - player_name: str
    - player_number: int
    - points_played: int (number of completed points)
    - effective_time_seconds: int (total playing time minus call durations)
    - offense: dict (points_played, points_won, points_lost, win_rate, points_won_no_turnover, clean_point_rate)
    - defense: dict (points_played, points_won, points_lost, win_rate, points_with_turnover, turnover_rate, points_won_no_turnover, clean_break_rate, points_lost_no_turnover)
    """
    # Get the game to verify it exists
    game = get_game(db, game_id)
    if not game:
        return []

    # Get all completed points for this game
    completed_points = get_completed_points(db, game_id, require_timestamps=True)

    # Get all players in the game
    all_game_players = get_game_players(db, game_id)
    calls_by_point = {
        point.id: get_calls_for_point(db, point.id)
        for point in completed_points
    }
    turnovers_by_point = {
        point.id: get_turnovers_for_point(db, point.id)
        for point in completed_points
    }

    return build_live_player_stats(
        completed_points,
        all_game_players,
        calls_by_point,
        turnovers_by_point,
    )


def get_game_team_stats(db: Session, game_id: int) -> Optional[Dict]:
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
    # Get the game to verify it exists
    game = get_game(db, game_id)
    if not game:
        return None

    # Get all completed points for this game
    completed_points = get_completed_points(db, game_id)
    turnovers_by_point = {
        point.id: get_turnovers_for_point(db, point.id)
        for point in completed_points
    }

    return build_game_team_stats(
        game_id,
        completed_points,
        turnovers_by_point,
    )


def get_game_strategy_stats(db: Session, game_id: int) -> Optional[Dict]:
    """
    Get strategy statistics for a game.
    Only considers completed points with assigned strategies.

    Returns dict with:
    - game_id: int
    - offense_strategies: list of dicts (strategy stats for offense)
    - defense_strategies: list of dicts (strategy stats for defense)

    Returns None if game not found.
    """
    # Get the game to verify it exists
    game = get_game(db, game_id)
    if not game:
        return None

    # Get all completed points for this game with valid timestamps
    completed_points = get_completed_points(db, game_id, require_timestamps=True)

    strategies_by_id = {
        strategy_id: get_strategy(db, strategy_id)
        for strategy_id in {p.strategy_id for p in completed_points if p.strategy_id}
    }
    turnovers_by_point = {
        point.id: get_turnovers_for_point(db, point.id)
        for point in completed_points
    }

    strategy_stats = build_game_strategy_stats(
        completed_points,
        strategies_by_id,
        turnovers_by_point,
    )
    return {
        "game_id": game_id,
        "offense_strategies": strategy_stats["offense_strategies"],
        "defense_strategies": strategy_stats["defense_strategies"],
    }
