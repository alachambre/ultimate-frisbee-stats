"""
Statistics CRUD operations (facade).
"""
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from app.crud.statistics_queries import (
    get_game,
    get_competition,
    get_team,
    get_completed_points,
    get_completed_points_for_competition,
    get_completed_points_for_team,
    get_game_players,
    get_competition_players,
    get_team_players,
    get_calls_for_points,
    get_turnovers_for_points,
    get_strategies_by_ids,
)
from app.crud.statistics_calculations import (
    build_live_player_stats,
    build_game_team_stats,
    build_competition_team_stats,
    build_team_team_stats,
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
    point_ids = [point.id for point in completed_points]
    calls_by_point = get_calls_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    return build_live_player_stats(
        completed_points,
        all_game_players,
        calls_by_point,
        turnovers_by_point,
    )


def get_competition_player_stats(db: Session, competition_id: int) -> Optional[List[Dict]]:
    """
    Get aggregated player statistics for a competition.
    Only considers completed points with valid timestamps from games in this competition.

    Returns None if competition not found.
    """
    competition = get_competition(db, competition_id)
    if not competition:
        return None

    completed_points = get_completed_points_for_competition(
        db,
        competition_id,
        require_timestamps=True,
    )
    competition_players = get_competition_players(db, competition_id)

    # Prefer competition roster, but include players that actually appeared in points.
    # This keeps stats usable even when the roster was not explicitly populated.
    players_by_id = {player.id: player for player in competition_players}
    for point in completed_points:
        for player in point.players:
            if player.id not in players_by_id:
                players_by_id[player.id] = player

    point_ids = [point.id for point in completed_points]
    calls_by_point = get_calls_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    return build_live_player_stats(
        completed_points,
        list(players_by_id.values()),
        calls_by_point,
        turnovers_by_point,
    )


def get_team_player_stats(db: Session, team_id: int) -> Optional[List[Dict]]:
    """
    Get aggregated player statistics for a team across all competitions.
    Only considers completed points with valid timestamps.

    Returns None if team not found.
    """
    team = get_team(db, team_id)
    if not team:
        return None

    completed_points = get_completed_points_for_team(
        db,
        team_id,
        require_timestamps=True,
    )
    team_players = get_team_players(db, team_id)

    point_ids = [point.id for point in completed_points]
    calls_by_point = get_calls_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    return build_live_player_stats(
        completed_points,
        team_players,
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
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    return build_game_team_stats(
        game_id,
        completed_points,
        turnovers_by_point,
    )


def get_competition_team_stats(db: Session, competition_id: int) -> Optional[Dict]:
    """
    Get aggregated team statistics for an entire competition.
    Only considers completed points from all games in the competition.

    Returns None if competition not found.
    """
    competition = get_competition(db, competition_id)
    if not competition:
        return None

    completed_points = get_completed_points_for_competition(db, competition_id)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    return build_competition_team_stats(
        competition_id,
        completed_points,
        turnovers_by_point,
    )


def get_team_team_stats(db: Session, team_id: int) -> Optional[Dict]:
    """
    Get aggregated team statistics across all competitions for a team.
    Only considers completed points from all games tied to the team.

    Returns None if team not found.
    """
    team = get_team(db, team_id)
    if not team:
        return None

    completed_points = get_completed_points_for_team(db, team_id)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    return build_team_team_stats(
        team_id,
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

    strategy_ids = [point.strategy_id for point in completed_points if point.strategy_id]
    strategies_by_id = get_strategies_by_ids(db, strategy_ids)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

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


def get_competition_strategy_stats(db: Session, competition_id: int) -> Optional[Dict]:
    """
    Get strategy statistics for a competition.
    Only considers completed points with assigned strategies and valid timestamps.

    Returns None if competition not found.
    """
    competition = get_competition(db, competition_id)
    if not competition:
        return None

    completed_points = get_completed_points_for_competition(
        db,
        competition_id,
        require_timestamps=True,
    )
    strategy_ids = [point.strategy_id for point in completed_points if point.strategy_id]
    strategies_by_id = get_strategies_by_ids(db, strategy_ids)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    strategy_stats = build_game_strategy_stats(
        completed_points,
        strategies_by_id,
        turnovers_by_point,
    )
    return {
        "competition_id": competition_id,
        "offense_strategies": strategy_stats["offense_strategies"],
        "defense_strategies": strategy_stats["defense_strategies"],
    }


def get_team_strategy_stats(db: Session, team_id: int) -> Optional[Dict]:
    """
    Get strategy statistics for a team across all competitions.
    Only considers completed points with assigned strategies and valid timestamps.

    Returns None if team not found.
    """
    team = get_team(db, team_id)
    if not team:
        return None

    completed_points = get_completed_points_for_team(
        db,
        team_id,
        require_timestamps=True,
    )
    strategy_ids = [point.strategy_id for point in completed_points if point.strategy_id]
    strategies_by_id = get_strategies_by_ids(db, strategy_ids)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    strategy_stats = build_game_strategy_stats(
        completed_points,
        strategies_by_id,
        turnovers_by_point,
    )
    return {
        "team_id": team_id,
        "offense_strategies": strategy_stats["offense_strategies"],
        "defense_strategies": strategy_stats["defense_strategies"],
    }
