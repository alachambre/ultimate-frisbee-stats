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
    - offense: dict (points_played, points_won, points_lost, win_rate, points_won_no_turnover, clean_point_rate)
    - defense: dict (points_played, points_won, points_lost, win_rate, points_with_turnover, turnover_rate, points_won_no_turnover, clean_break_rate, points_lost_no_turnover)
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

    # Get all players in the game
    all_game_players = db.query(Player).join(
        Game.players
    ).filter(Game.id == game_id).all()

    # If no completed points, return empty stats for all players
    if not completed_points:
        return sorted([
            {
                "player_id": player.id,
                "player_name": player.name,
                "player_number": player.number,
                "points_played": 0,
                "effective_time_seconds": 0,
                "offense": {
                    "points_played": 0,
                    "points_won": 0,
                    "points_lost": 0,
                    "hold_rate": 0.0,
                    "points_won_no_turnover": 0,
                    "clean_hold_rate": 0.0
                },
                "defense": {
                    "points_played": 0,
                    "points_won": 0,
                    "points_lost": 0,
                    "break_rate": 0.0,
                    "points_with_turnover": 0,
                    "turnover_rate": 0.0,
                    "points_won_no_turnover": 0,
                    "clean_break_rate": 0.0,
                    "points_lost_no_turnover": 0
                }
            }
            for player in all_game_players
        ], key=lambda x: (x["player_number"] is None, x["player_number"] or 0))

    # Build a dict to accumulate stats for each player
    player_stats: Dict[int, Dict] = {}

    # Initialize stats for all game players
    for player in all_game_players:
        player_stats[player.id] = {
            "player_id": player.id,
            "player_name": player.name,
            "player_number": player.number,
            "points_played": 0,
            "effective_time_seconds": 0,
            "offense_played": 0,
            "offense_won": 0,
            "offense_lost": 0,
            "offense_won_no_turnover": 0,
            "defense_played": 0,
            "defense_won": 0,
            "defense_lost": 0,
            "defense_with_turnover": 0,
            "defense_won_no_turnover": 0,
            "defense_lost_no_turnover": 0
        }

    # Process each completed point
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

        # Get turnovers for this point and calculate OUR vs THEIR turnovers
        turnovers = db.query(Turnover).filter(Turnover.point_id == point.id).order_by(Turnover.timestamp).all()

        # Count turnovers by possession (same logic as team stats)
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

        has_turnovers = len(turnovers) > 0

        # Update stats for each player in this point
        for player in point.players:
            if player.id in player_stats:
                player_stats[player.id]["points_played"] += 1
                player_stats[player.id]["effective_time_seconds"] += effective_time

                # Track offense/defense separately
                if point.starting_on_offense:
                    player_stats[player.id]["offense_played"] += 1
                    if point.won:
                        player_stats[player.id]["offense_won"] += 1
                        # Track clean holds (won without OUR turnovers)
                        if our_turnovers == 0:
                            player_stats[player.id]["offense_won_no_turnover"] += 1
                    else:
                        player_stats[player.id]["offense_lost"] += 1
                else:
                    player_stats[player.id]["defense_played"] += 1
                    if point.won:
                        player_stats[player.id]["defense_won"] += 1
                        # Track clean breaks (won without OUR turnovers)
                        if our_turnovers == 0:
                            player_stats[player.id]["defense_won_no_turnover"] += 1
                    else:
                        player_stats[player.id]["defense_lost"] += 1
                        # Track points lost without any turnovers
                        if not has_turnovers:
                            player_stats[player.id]["defense_lost_no_turnover"] += 1

                    # Track points with any turnovers
                    if has_turnovers:
                        player_stats[player.id]["defense_with_turnover"] += 1

    # Calculate rates and format response
    result = []
    for player_id, stats in player_stats.items():
        # Offense rates
        hold_rate = stats["offense_won"] / stats["offense_played"] if stats["offense_played"] > 0 else 0.0
        # Clean hold rate: of points played on offense, how many had no turnovers
        clean_hold_rate = stats["offense_won_no_turnover"] / stats["offense_played"] if stats["offense_played"] > 0 else 0.0

        # Defense rates
        break_rate = stats["defense_won"] / stats["defense_played"] if stats["defense_played"] > 0 else 0.0
        # Turnover rate: of points played on defense, how many had turnovers
        turnover_rate = stats["defense_with_turnover"] / stats["defense_played"] if stats["defense_played"] > 0 else 0.0
        # Clean break rate: of points played on defense, how many had no turnovers
        clean_break_rate = stats["defense_won_no_turnover"] / stats["defense_played"] if stats["defense_played"] > 0 else 0.0

        result.append({
            "player_id": stats["player_id"],
            "player_name": stats["player_name"],
            "player_number": stats["player_number"],
            "points_played": stats["points_played"],
            "effective_time_seconds": stats["effective_time_seconds"],
            "offense": {
                "points_played": stats["offense_played"],
                "points_won": stats["offense_won"],
                "points_lost": stats["offense_lost"],
                "hold_rate": hold_rate,
                "points_won_no_turnover": stats["offense_won_no_turnover"],
                "clean_hold_rate": clean_hold_rate
            },
            "defense": {
                "points_played": stats["defense_played"],
                "points_won": stats["defense_won"],
                "points_lost": stats["defense_lost"],
                "break_rate": break_rate,
                "points_with_turnover": stats["defense_with_turnover"],
                "turnover_rate": turnover_rate,
                "points_won_no_turnover": stats["defense_won_no_turnover"],
                "clean_break_rate": clean_break_rate,
                "points_lost_no_turnover": stats["defense_lost_no_turnover"]
            }
        })

    # Return sorted by player number (None values sorted last)
    return sorted(result, key=lambda x: (x["player_number"] is None, x["player_number"] or 0))


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
    offense_hold_rate = offense_won / offense_started if offense_started > 0 else 0.0
    offense_clean_hold_rate = offense_won_no_turnover / offense_started if offense_started > 0 else 0.0
    offense_broken_rate = offense_lost / offense_started if offense_started > 0 else 0.0

    # Calculate defense rates
    defense_break_rate = defense_won / defense_started if defense_started > 0 else 0.0
    defense_turnover_rate = defense_points_with_turnover / defense_started if defense_started > 0 else 0.0
    defense_clean_break_rate = defense_won_no_turnover / defense_started if defense_started > 0 else 0.0
    defense_hold_rate = defense_break_rate  # Same as break_rate (kept for backward compatibility)

    # Calculate pull statistics (defense points only, where pull is tracked)
    defense_points_with_pull = [p for p in completed_points if not p.starting_on_offense and p.pull is not None]
    total_pulls = len(defense_points_with_pull)
    inbound_pulls = len([p for p in defense_points_with_pull if p.pull is True])
    out_of_bounds_pulls = len([p for p in defense_points_with_pull if p.pull is False])
    inbound_rate = inbound_pulls / total_pulls if total_pulls > 0 else 0.0

    return {
        "game_id": game_id,
        "total_completed_points": len(completed_points),
        "offense": {
            "points_started": offense_started,
            "points_won": offense_won,
            "points_lost": offense_lost,
            "hold_rate": offense_hold_rate,
            "points_won_no_turnover": offense_won_no_turnover,
            "clean_hold_rate": offense_clean_hold_rate,
            "broken_rate": offense_broken_rate
        },
        "defense": {
            "points_started": defense_started,
            "points_won": defense_won,
            "points_lost": defense_lost,
            "break_rate": defense_break_rate,
            "points_with_turnover": defense_points_with_turnover,
            "turnover_rate": defense_turnover_rate,
            "points_won_no_turnover": defense_won_no_turnover,
            "clean_break_rate": defense_clean_break_rate,
            "points_lost_no_turnover": defense_lost_no_turnover,
            "hold_rate": defense_hold_rate,
            "pull_stats": {
                "total_pulls": total_pulls,
                "inbound_pulls": inbound_pulls,
                "out_of_bounds_pulls": out_of_bounds_pulls,
                "inbound_rate": inbound_rate
            }
        }
    }


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
    from app.models.strategy import Strategy

    # Get the game to verify it exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        return None

    # Get all completed points for this game with valid timestamps
    completed_points = db.query(Point).filter(
        Point.game_id == game_id,
        Point.status == PointStatusEnum.completed,
        Point.start_datetime.isnot(None),
        Point.end_datetime.isnot(None)
    ).all()

    # Group points by strategy for offense and defense
    offense_strategy_points: Dict[int, List[Point]] = {}
    defense_strategy_points: Dict[int, List[Point]] = {}

    for point in completed_points:
        # Skip points without strategy
        if not point.strategy_id:
            continue

        if point.starting_on_offense:
            if point.strategy_id not in offense_strategy_points:
                offense_strategy_points[point.strategy_id] = []
            offense_strategy_points[point.strategy_id].append(point)
        else:
            if point.strategy_id not in defense_strategy_points:
                defense_strategy_points[point.strategy_id] = []
            defense_strategy_points[point.strategy_id].append(point)

    # Calculate offense strategy stats
    offense_strategies = []
    for strategy_id, points in offense_strategy_points.items():
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            continue

        points_played = len(points)
        points_won = len([p for p in points if p.won])
        points_lost = points_played - points_won
        hold_rate = points_won / points_played if points_played > 0 else 0.0

        # Calculate clean holds (holds with 0 OUR turnovers)
        clean_holds = 0
        for point in points:
            if not point.won:
                continue

            # Get turnovers and calculate OUR turnovers
            turnovers = db.query(Turnover).filter(Turnover.point_id == point.id).order_by(Turnover.timestamp).all()
            our_turnovers = 0
            for idx, turnover in enumerate(turnovers):
                turnover_number = idx + 1
                # On offense, odd turnovers are ours
                if turnover_number % 2 == 1:
                    our_turnovers += 1

            if our_turnovers == 0:
                clean_holds += 1

        clean_hold_rate = clean_holds / points_played if points_played > 0 else 0.0

        # Calculate quick scores (< 90 seconds)
        quick_scores = 0
        for point in points:
            if not point.won:
                continue

            point_duration = int((point.end_datetime - point.start_datetime).total_seconds())
            if point_duration < 90:
                quick_scores += 1

        quick_score_rate = quick_scores / points_played if points_played > 0 else 0.0

        offense_strategies.append({
            "strategy_id": strategy_id,
            "strategy_name": strategy.name,
            "points_played": points_played,
            "points_won": points_won,
            "points_lost": points_lost,
            "hold_rate": hold_rate,
            "clean_holds": clean_holds,
            "clean_hold_rate": clean_hold_rate,
            "quick_scores": quick_scores,
            "quick_score_rate": quick_score_rate
        })

    # Calculate defense strategy stats
    defense_strategies = []
    for strategy_id, points in defense_strategy_points.items():
        strategy = db.query(Strategy).filter(Strategy.id == strategy_id).first()
        if not strategy:
            continue

        points_played = len(points)
        points_won = len([p for p in points if p.won])  # Breaks
        points_lost = points_played - points_won
        break_rate = points_won / points_played if points_played > 0 else 0.0

        # Calculate points with at least 1 turnover (any turnover)
        points_with_turnover = 0
        for point in points:
            turnovers = db.query(Turnover).filter(Turnover.point_id == point.id).all()
            if len(turnovers) > 0:
                points_with_turnover += 1

        turnover_rate = points_with_turnover / points_played if points_played > 0 else 0.0

        defense_strategies.append({
            "strategy_id": strategy_id,
            "strategy_name": strategy.name,
            "points_played": points_played,
            "points_won": points_won,
            "points_lost": points_lost,
            "break_rate": break_rate,
            "points_with_turnover": points_with_turnover,
            "turnover_rate": turnover_rate
        })

    # Sort strategies by name
    offense_strategies.sort(key=lambda x: x["strategy_name"])
    defense_strategies.sort(key=lambda x: x["strategy_name"])

    return {
        "game_id": game_id,
        "offense_strategies": offense_strategies,
        "defense_strategies": defense_strategies
    }
