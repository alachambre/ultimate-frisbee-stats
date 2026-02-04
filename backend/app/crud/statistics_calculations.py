"""
Pure calculation helpers for statistics.
"""
from typing import List, Tuple, Dict, Optional

from app.models.call import Call
from app.models.point import Point
from app.models.player import Player
from app.models.strategy import Strategy
from app.models.turnover import Turnover


def calculate_point_duration_seconds(point: Point) -> int:
    return int((point.end_datetime - point.start_datetime).total_seconds())


def calculate_call_dead_time_seconds(calls: List[Call]) -> int:
    dead_time = 0
    for call in calls:
        if call.resume_timestamp:
            dead_time += int((call.resume_timestamp - call.call_timestamp).total_seconds())
    return dead_time


def calculate_effective_time_seconds(point: Point, calls: List[Call]) -> int:
    point_duration = calculate_point_duration_seconds(point)
    call_dead_time = calculate_call_dead_time_seconds(calls)
    return max(0, point_duration - call_dead_time)


def count_turnovers_by_possession(
    starting_on_offense: bool,
    turnovers: List[Turnover],
) -> Tuple[int, int]:
    """
    Returns (our_turnovers, their_turnovers) based on possession order.
    """
    our_turnovers = 0
    their_turnovers = 0
    for idx, _turnover in enumerate(turnovers):
        turnover_number = idx + 1  # 1-indexed
        if starting_on_offense:
            if turnover_number % 2 == 1:
                our_turnovers += 1
            else:
                their_turnovers += 1
        else:
            if turnover_number % 2 == 1:
                their_turnovers += 1
            else:
                our_turnovers += 1
    return our_turnovers, their_turnovers


def build_live_player_stats(
    completed_points: List[Point],
    game_players: List[Player],
    calls_by_point: Dict[int, List[Call]],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> List[Dict]:
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
                    "clean_hold_rate": 0.0,
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
                    "points_lost_no_turnover": 0,
                },
            }
            for player in game_players
        ], key=lambda x: (x["player_number"] is None, x["player_number"] or 0))

    player_stats: Dict[int, Dict] = {}
    for player in game_players:
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
            "defense_lost_no_turnover": 0,
        }

    for point in completed_points:
        calls = calls_by_point.get(point.id, [])
        effective_time = calculate_effective_time_seconds(point, calls)

        turnovers = turnovers_by_point.get(point.id, [])
        our_turnovers, _their_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )
        has_turnovers = len(turnovers) > 0

        for player in point.players:
            if player.id not in player_stats:
                continue
            stats = player_stats[player.id]
            stats["points_played"] += 1
            stats["effective_time_seconds"] += effective_time

            if point.starting_on_offense:
                stats["offense_played"] += 1
                if point.won:
                    stats["offense_won"] += 1
                    if our_turnovers == 0:
                        stats["offense_won_no_turnover"] += 1
                else:
                    stats["offense_lost"] += 1
            else:
                stats["defense_played"] += 1
                if point.won:
                    stats["defense_won"] += 1
                    if our_turnovers == 0:
                        stats["defense_won_no_turnover"] += 1
                else:
                    stats["defense_lost"] += 1
                    if not has_turnovers:
                        stats["defense_lost_no_turnover"] += 1

                if has_turnovers:
                    stats["defense_with_turnover"] += 1

    result = []
    for stats in player_stats.values():
        hold_rate = stats["offense_won"] / stats["offense_played"] if stats["offense_played"] > 0 else 0.0
        clean_hold_rate = (
            stats["offense_won_no_turnover"] / stats["offense_played"]
            if stats["offense_played"] > 0
            else 0.0
        )
        break_rate = stats["defense_won"] / stats["defense_played"] if stats["defense_played"] > 0 else 0.0
        turnover_rate = (
            stats["defense_with_turnover"] / stats["defense_played"]
            if stats["defense_played"] > 0
            else 0.0
        )
        clean_break_rate = (
            stats["defense_won_no_turnover"] / stats["defense_played"]
            if stats["defense_played"] > 0
            else 0.0
        )

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
                "clean_hold_rate": clean_hold_rate,
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
                "points_lost_no_turnover": stats["defense_lost_no_turnover"],
            },
        })

    return sorted(result, key=lambda x: (x["player_number"] is None, x["player_number"] or 0))


def build_game_team_stats(
    game_id: int,
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
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

    for point in completed_points:
        turnovers = turnovers_by_point.get(point.id, [])
        our_turnovers, _their_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )

        if point.starting_on_offense:
            offense_started += 1
            if point.won:
                offense_won += 1
                if our_turnovers == 0:
                    offense_won_no_turnover += 1
            else:
                offense_lost += 1
        else:
            defense_started += 1
            if point.won:
                defense_won += 1
                if our_turnovers == 0:
                    defense_won_no_turnover += 1
            else:
                defense_lost += 1
                if len(turnovers) == 0:
                    defense_lost_no_turnover += 1

            if len(turnovers) > 0:
                defense_points_with_turnover += 1

    offense_hold_rate = offense_won / offense_started if offense_started > 0 else 0.0
    offense_clean_hold_rate = offense_won_no_turnover / offense_started if offense_started > 0 else 0.0
    offense_broken_rate = offense_lost / offense_started if offense_started > 0 else 0.0

    defense_break_rate = defense_won / defense_started if defense_started > 0 else 0.0
    defense_turnover_rate = defense_points_with_turnover / defense_started if defense_started > 0 else 0.0
    defense_clean_break_rate = defense_won_no_turnover / defense_started if defense_started > 0 else 0.0
    defense_hold_rate = defense_break_rate

    defense_points_with_pull = [
        p for p in completed_points if not p.starting_on_offense and p.pull is not None
    ]
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
            "broken_rate": offense_broken_rate,
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
                "inbound_rate": inbound_rate,
            },
        },
    }


def build_game_strategy_stats(
    completed_points: List[Point],
    strategies_by_id: Dict[int, Strategy],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    offense_strategy_points: Dict[int, List[Point]] = {}
    defense_strategy_points: Dict[int, List[Point]] = {}

    for point in completed_points:
        if not point.strategy_id:
            continue
        if point.starting_on_offense:
            offense_strategy_points.setdefault(point.strategy_id, []).append(point)
        else:
            defense_strategy_points.setdefault(point.strategy_id, []).append(point)

    offense_strategies = []
    for strategy_id, points in offense_strategy_points.items():
        strategy = strategies_by_id.get(strategy_id)
        if not strategy:
            continue

        points_played = len(points)
        points_won = len([p for p in points if p.won])
        points_lost = points_played - points_won
        hold_rate = points_won / points_played if points_played > 0 else 0.0

        clean_holds = 0
        for point in points:
            if not point.won:
                continue
            turnovers = turnovers_by_point.get(point.id, [])
            our_turnovers, _their_turnovers = count_turnovers_by_possession(True, turnovers)
            if our_turnovers == 0:
                clean_holds += 1

        clean_hold_rate = clean_holds / points_played if points_played > 0 else 0.0

        quick_scores = 0
        for point in points:
            if not point.won:
                continue
            if calculate_point_duration_seconds(point) < 90:
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
            "quick_score_rate": quick_score_rate,
        })

    defense_strategies = []
    for strategy_id, points in defense_strategy_points.items():
        strategy = strategies_by_id.get(strategy_id)
        if not strategy:
            continue

        points_played = len(points)
        points_won = len([p for p in points if p.won])
        points_lost = points_played - points_won
        break_rate = points_won / points_played if points_played > 0 else 0.0

        points_with_turnover = 0
        for point in points:
            turnovers = turnovers_by_point.get(point.id, [])
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
            "turnover_rate": turnover_rate,
        })

    offense_strategies.sort(key=lambda x: x["strategy_name"])
    defense_strategies.sort(key=lambda x: x["strategy_name"])

    return {
        "offense_strategies": offense_strategies,
        "defense_strategies": defense_strategies,
    }
