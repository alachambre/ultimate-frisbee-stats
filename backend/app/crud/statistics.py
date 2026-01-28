"""
Statistics CRUD operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Dict, Optional

from app.models.game import Game
from app.models.point import Point
from app.models.player import Player
from app.models.call import Call
from app.models.turnover import Turnover
from app.models.base import PointStatusEnum, point_players


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
    """
    # Get the game to verify it exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        return []

    # Get all completed points for this game
    completed_points = db.query(Point).filter(
        Point.game_id == game_id,
        Point.status == PointStatusEnum.completed,
        Point.start_datetime.isnot(None),
        Point.end_datetime.isnot(None)
    ).all()

    # If no completed points, return empty stats for all players in the game
    if not completed_points:
        players = db.query(Player).join(
            Game.players
        ).filter(Game.id == game_id).all()

        return sorted([
            {
                "player_id": player.id,
                "player_name": player.name,
                "player_number": player.number,
                "points_played": 0,
                "effective_time_seconds": 0
            }
            for player in players
        ], key=lambda x: x["player_number"])

    # Build a dict to accumulate stats for each player
    player_stats: Dict[int, Dict] = {}

    # Get all players who played in at least one completed point
    for point in completed_points:
        # Calculate point duration in seconds
        point_duration = int((point.end_datetime - point.start_datetime).total_seconds())

        # Calculate dead time from calls in this point
        calls = db.query(Call).filter(Call.point_id == point.id).all()
        call_dead_time = 0
        for call in calls:
            if call.resume_timestamp:
                call_duration = int((call.resume_timestamp - call.call_timestamp).total_seconds())
                call_dead_time += call_duration

        # Effective time for this point
        effective_time = max(0, point_duration - call_dead_time)

        # Update stats for each player in this point
        for player in point.players:
            if player.id not in player_stats:
                player_stats[player.id] = {
                    "player_id": player.id,
                    "player_name": player.name,
                    "player_number": player.number,
                    "points_played": 0,
                    "effective_time_seconds": 0
                }

            player_stats[player.id]["points_played"] += 1
            player_stats[player.id]["effective_time_seconds"] += effective_time

    # Also include players in the game who haven't played any completed points yet
    all_game_players = db.query(Player).join(
        Game.players
    ).filter(Game.id == game_id).all()

    for player in all_game_players:
        if player.id not in player_stats:
            player_stats[player.id] = {
                "player_id": player.id,
                "player_name": player.name,
                "player_number": player.number,
                "points_played": 0,
                "effective_time_seconds": 0
            }

    # Return sorted by player number
    return sorted(player_stats.values(), key=lambda x: x["player_number"])


def get_game_team_stats(db: Session, game_id: int) -> Optional[Dict]:
    """
    Get team statistics for a game.
    Only considers completed points.

    Returns dict with:
    - game_id: int
    - total_completed_points: int
    - offense: OffenseStats dict
    - defense: DefenseStats dict

    Returns None if game not found.
    """
    # Get the game to verify it exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        return None

    # Get all completed points for this game
    completed_points = db.query(Point).filter(
        Point.game_id == game_id,
        Point.status == PointStatusEnum.completed
    ).all()

    # Initialize counters
    offense_started = 0
    offense_won = 0
    offense_lost = 0
    offense_won_no_turnover = 0

    defense_started = 0
    defense_won = 0
    defense_lost = 0
    defense_points_with_turnover = 0
    defense_won_no_turnover = 0
    defense_lost_no_turnover = 0

    # Process each completed point
    for point in completed_points:
        # Get turnovers for this point ordered by timestamp
        turnovers = db.query(Turnover).filter(
            Turnover.point_id == point.id
        ).order_by(Turnover.timestamp).all()

        # Count turnovers by possession
        # Logic: Starting possession is determined by starting_on_offense
        # Odd-numbered turnovers when starting_on_offense=true are OURS
        # Even-numbered turnovers when starting_on_offense=true are THEIRS
        # Flip when starting_on_offense=false
        our_turnovers = 0
        their_turnovers = 0

        for idx, turnover in enumerate(turnovers):
            turnover_number = idx + 1  # 1-indexed
            if point.starting_on_offense:
                # We start with possession
                if turnover_number % 2 == 1:  # Odd = our turnover
                    our_turnovers += 1
                else:  # Even = their turnover
                    their_turnovers += 1
            else:
                # They start with possession
                if turnover_number % 2 == 1:  # Odd = their turnover
                    their_turnovers += 1
                else:  # Even = our turnover
                    our_turnovers += 1

        # Update offense/defense counters
        if point.starting_on_offense:
            # Offense statistics
            offense_started += 1
            if point.won:
                offense_won += 1
                if our_turnovers == 0:
                    offense_won_no_turnover += 1
            else:
                offense_lost += 1
        else:
            # Defense statistics
            defense_started += 1
            if point.won:
                defense_won += 1
                if our_turnovers == 0:
                    defense_won_no_turnover += 1
            else:
                defense_lost += 1
                if len(turnovers) == 0:
                    defense_lost_no_turnover += 1

            # Track if there was at least one turnover on defense
            if len(turnovers) > 0:
                defense_points_with_turnover += 1

    # Calculate offense rates
    offense_win_rate = offense_won / offense_started if offense_started > 0 else 0.0
    offense_clean_point_rate = offense_won_no_turnover / offense_won if offense_won > 0 else 0.0
    offense_break_rate = offense_lost / offense_started if offense_started > 0 else 0.0

    # Calculate defense rates
    defense_win_rate = defense_won / defense_started if defense_started > 0 else 0.0
    defense_turnover_rate = defense_points_with_turnover / defense_started if defense_started > 0 else 0.0
    defense_clean_break_rate = defense_won_no_turnover / defense_started if defense_started > 0 else 0.0
    defense_hold_rate = defense_won / defense_started if defense_started > 0 else 0.0

    return {
        "game_id": game_id,
        "total_completed_points": len(completed_points),
        "offense": {
            "points_started": offense_started,
            "points_won": offense_won,
            "points_lost": offense_lost,
            "win_rate": offense_win_rate,
            "points_won_no_turnover": offense_won_no_turnover,
            "clean_point_rate": offense_clean_point_rate,
            "break_rate": offense_break_rate
        },
        "defense": {
            "points_started": defense_started,
            "points_won": defense_won,
            "points_lost": defense_lost,
            "win_rate": defense_win_rate,
            "points_with_turnover": defense_points_with_turnover,
            "turnover_rate": defense_turnover_rate,
            "points_won_no_turnover": defense_won_no_turnover,
            "clean_break_rate": defense_clean_break_rate,
            "points_lost_no_turnover": defense_lost_no_turnover,
            "hold_rate": defense_hold_rate
        }
    }
