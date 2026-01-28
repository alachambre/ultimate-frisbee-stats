"""
Statistics CRUD operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Dict

from app.models.game import Game
from app.models.point import Point
from app.models.player import Player
from app.models.call import Call
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
