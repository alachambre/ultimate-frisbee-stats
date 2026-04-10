"""
Pure calculation helpers for statistics.
"""
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional

from app.models.stoppage import Stoppage
from app.models.point import Point
from app.models.player import Player
from app.models.strategy import Strategy
from app.models.turnover import Turnover

TURNOVER_TYPE_VALUES = (
    "defended_pass",
    "missed_pass",
    "defended_huck",
    "missed_huck",
    "drop",
    "stall_out",
    "miscommunication",
    "other",
)


@dataclass(frozen=True)
class PointFacts:
    point_id: int
    starting_on_offense: bool
    won: bool
    field_side: Optional[str]
    pull: Optional[bool]
    our_turnovers: int
    opponent_turnovers: int


def calculate_rate(numerator: int, denominator: int) -> float:
    return numerator / denominator if denominator > 0 else 0.0


def calculate_point_duration_seconds(point: Point) -> int:
    return int((point.end_datetime - point.start_datetime).total_seconds())


def calculate_stoppage_dead_time_seconds(stoppages: List[Stoppage]) -> int:
    dead_time = 0
    for stoppage in stoppages:
        if stoppage.resume_timestamp:
            dead_time += int((stoppage.resume_timestamp - stoppage.call_timestamp).total_seconds())
    return dead_time


def calculate_effective_time_seconds(point: Point, stoppages: List[Stoppage]) -> int:
    point_duration = calculate_point_duration_seconds(point)
    stoppage_dead_time = calculate_stoppage_dead_time_seconds(stoppages)
    return max(0, point_duration - stoppage_dead_time)


def build_empty_turnover_type_stats() -> Dict:
    def empty_distribution() -> Dict:
        return {
            turnover_type: {
                "count": 0,
                "percentage": 0.0,
            }
            for turnover_type in TURNOVER_TYPE_VALUES
        }

    def empty_bucket() -> Dict:
        return {
            "total_turnovers": 0,
            "by_type": empty_distribution(),
        }

    def empty_phase() -> Dict:
        return {
            "our_possession_turnovers": empty_bucket(),
            "opponent_possession_turnovers": empty_bucket(),
        }

    return {
        "all_points": empty_phase(),
        "started_on_offense": empty_phase(),
        "started_on_defense": empty_phase(),
    }


def normalize_turnover_type(turnover_type: Optional[str]) -> str:
    if turnover_type in TURNOVER_TYPE_VALUES:
        return turnover_type
    return "other"


def get_turnover_possession_bucket_key(
    starting_on_offense: bool,
    turnover_index: int,
) -> str:
    if starting_on_offense:
        return "our_possession_turnovers" if turnover_index % 2 == 0 else "opponent_possession_turnovers"
    return "opponent_possession_turnovers" if turnover_index % 2 == 0 else "our_possession_turnovers"


def accumulate_turnover_type_stats(
    turnover_type_stats: Dict,
    starting_on_offense: bool,
    turnovers: List[Turnover],
) -> None:
    point_phase_key = "started_on_offense" if starting_on_offense else "started_on_defense"

    for turnover_index, turnover in enumerate(turnovers):
        possession_bucket_key = get_turnover_possession_bucket_key(
            starting_on_offense,
            turnover_index,
        )
        normalized_turnover_type = normalize_turnover_type(turnover.turnover_type)

        for phase_key in ("all_points", point_phase_key):
            bucket = turnover_type_stats[phase_key][possession_bucket_key]
            bucket["total_turnovers"] += 1
            bucket["by_type"][normalized_turnover_type]["count"] += 1


def finalize_turnover_type_stats(turnover_type_stats: Dict) -> Dict:
    for phase in turnover_type_stats.values():
        for bucket in phase.values():
            total_turnovers = bucket["total_turnovers"]
            for stats in bucket["by_type"].values():
                stats["percentage"] = calculate_rate(stats["count"], total_turnovers)
    return turnover_type_stats


def build_turnover_type_stats(
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    turnover_type_stats = build_empty_turnover_type_stats()

    for point in completed_points:
        accumulate_turnover_type_stats(
            turnover_type_stats,
            point.starting_on_offense,
            turnovers_by_point.get(point.id, []),
        )

    return finalize_turnover_type_stats(turnover_type_stats)


def count_turnovers_by_possession(
    starting_on_offense: bool,
    turnovers: List[Turnover],
) -> Tuple[int, int]:
    """
    Returns (our_turnovers, opponent_turnovers) based on possession order.
    """
    our_turnovers = 0
    opponent_turnovers = 0
    for idx, _turnover in enumerate(turnovers):
        turnover_number = idx + 1  # 1-indexed
        if starting_on_offense:
            if turnover_number % 2 == 1:
                our_turnovers += 1
            else:
                opponent_turnovers += 1
        else:
            if turnover_number % 2 == 1:
                opponent_turnovers += 1
            else:
                our_turnovers += 1
    return our_turnovers, opponent_turnovers


def build_point_facts(
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> List[PointFacts]:
    point_facts: List[PointFacts] = []

    for point in completed_points:
        turnovers = turnovers_by_point.get(point.id, [])
        our_turnovers, opponent_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )
        point_facts.append(
            PointFacts(
                point_id=point.id,
                starting_on_offense=point.starting_on_offense,
                won=point.won is True,
                field_side=point.field_side,
                pull=point.pull,
                our_turnovers=our_turnovers,
                opponent_turnovers=opponent_turnovers,
            )
        )

    return point_facts


def build_field_side_stats_from_point_facts(point_facts: List[PointFacts]) -> Dict:
    field_side_stats = {
        "table_left": {
            "offense": {
                "points_started": 0,
                "points_won": 0,
                "hold_rate": 0.0,
            },
            "defense": {
                "points_started": 0,
                "points_won": 0,
                "break_rate": 0.0,
            },
        },
        "table_right": {
            "offense": {
                "points_started": 0,
                "points_won": 0,
                "hold_rate": 0.0,
            },
            "defense": {
                "points_started": 0,
                "points_won": 0,
                "break_rate": 0.0,
            },
        },
    }

    for facts in point_facts:
        if facts.field_side not in field_side_stats:
            continue

        side_stats = field_side_stats[facts.field_side]
        phase_key = "offense" if facts.starting_on_offense else "defense"
        phase_stats = side_stats[phase_key]
        phase_stats["points_started"] += 1

        if facts.won:
            phase_stats["points_won"] += 1

    for side_stats in field_side_stats.values():
        offense_stats = side_stats["offense"]
        defense_stats = side_stats["defense"]

        offense_stats["hold_rate"] = (
            offense_stats["points_won"] / offense_stats["points_started"]
            if offense_stats["points_started"] > 0
            else 0.0
        )
        defense_stats["break_rate"] = (
            defense_stats["points_won"] / defense_stats["points_started"]
            if defense_stats["points_started"] > 0
            else 0.0
        )

    return field_side_stats


def build_live_player_stats(
    completed_points: List[Point],
    game_players: List[Player],
    stoppages_by_point: Dict[int, List[Stoppage]],
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
                "turnover_type_stats": build_empty_turnover_type_stats(),
                "offense": {
                    "points_played": 0,
                    "points_won": 0,
                    "points_lost": 0,
                    "hold_rate": 0.0,
                    "points_won_no_turnover": 0,
                    "clean_hold_rate": 0.0,
                    "our_turnovers": 0,
                    "opponent_turnovers": 0,
                },
                "defense": {
                    "points_played": 0,
                    "points_won": 0,
                    "points_lost": 0,
                    "break_rate": 0.0,
                    "points_with_turnover": 0,
                    "turnover_rate": 0.0,
                    "conversion_rate": 0.0,
                    "points_won_no_turnover": 0,
                    "clean_break_rate": 0.0,
                    "clean_conversion_rate": 0.0,
                    "points_lost_no_turnover": 0,
                    "our_turnovers": 0,
                    "opponent_turnovers": 0,
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
            "turnover_type_stats": build_empty_turnover_type_stats(),
            "offense_played": 0,
            "offense_won": 0,
            "offense_lost": 0,
            "offense_won_no_turnover": 0,
            "offense_our_turnovers": 0,
            "offense_opponent_turnovers": 0,
            "defense_played": 0,
            "defense_won": 0,
            "defense_lost": 0,
            "defense_with_turnover": 0,
            "defense_won_no_turnover": 0,
            "defense_lost_no_turnover": 0,
            "defense_our_turnovers": 0,
            "defense_opponent_turnovers": 0,
        }

    for point in completed_points:
        stoppages = stoppages_by_point.get(point.id, [])
        effective_time = calculate_effective_time_seconds(point, stoppages)

        turnovers = turnovers_by_point.get(point.id, [])
        our_turnovers, opponent_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )
        has_turnovers = (our_turnovers + opponent_turnovers) > 0

        for player in point.players:
            if player.id not in player_stats:
                continue
            stats = player_stats[player.id]
            stats["points_played"] += 1
            stats["effective_time_seconds"] += effective_time
            accumulate_turnover_type_stats(
                stats["turnover_type_stats"],
                point.starting_on_offense,
                turnovers,
            )

            if point.starting_on_offense:
                stats["offense_played"] += 1
                stats["offense_our_turnovers"] += our_turnovers
                stats["offense_opponent_turnovers"] += opponent_turnovers
                if point.won:
                    stats["offense_won"] += 1
                    if our_turnovers == 0:
                        stats["offense_won_no_turnover"] += 1
                else:
                    stats["offense_lost"] += 1
            else:
                stats["defense_played"] += 1
                stats["defense_our_turnovers"] += our_turnovers
                stats["defense_opponent_turnovers"] += opponent_turnovers
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
        hold_rate = calculate_rate(stats["offense_won"], stats["offense_played"])
        clean_hold_rate = calculate_rate(
            stats["offense_won_no_turnover"],
            stats["offense_played"],
        )
        break_rate = calculate_rate(stats["defense_won"], stats["defense_played"])
        turnover_rate = calculate_rate(
            stats["defense_with_turnover"],
            stats["defense_played"],
        )
        conversion_rate = calculate_rate(
            stats["defense_won"],
            stats["defense_with_turnover"],
        )
        clean_break_rate = calculate_rate(
            stats["defense_won_no_turnover"],
            stats["defense_played"],
        )
        clean_conversion_rate = calculate_rate(
            stats["defense_won_no_turnover"],
            stats["defense_won"],
        )

        result.append({
            "player_id": stats["player_id"],
            "player_name": stats["player_name"],
            "player_number": stats["player_number"],
            "points_played": stats["points_played"],
            "effective_time_seconds": stats["effective_time_seconds"],
            "turnover_type_stats": finalize_turnover_type_stats(stats["turnover_type_stats"]),
            "offense": {
                "points_played": stats["offense_played"],
                "points_won": stats["offense_won"],
                "points_lost": stats["offense_lost"],
                "hold_rate": hold_rate,
                "points_won_no_turnover": stats["offense_won_no_turnover"],
                "clean_hold_rate": clean_hold_rate,
                "our_turnovers": stats["offense_our_turnovers"],
                "opponent_turnovers": stats["offense_opponent_turnovers"],
            },
            "defense": {
                "points_played": stats["defense_played"],
                "points_won": stats["defense_won"],
                "points_lost": stats["defense_lost"],
                "break_rate": break_rate,
                "points_with_turnover": stats["defense_with_turnover"],
                "turnover_rate": turnover_rate,
                "conversion_rate": conversion_rate,
                "points_won_no_turnover": stats["defense_won_no_turnover"],
                "clean_break_rate": clean_break_rate,
                "clean_conversion_rate": clean_conversion_rate,
                "points_lost_no_turnover": stats["defense_lost_no_turnover"],
                "our_turnovers": stats["defense_our_turnovers"],
                "opponent_turnovers": stats["defense_opponent_turnovers"],
            },
        })

    return sorted(result, key=lambda x: (x["player_number"] is None, x["player_number"] or 0))


def build_team_stats_from_point_facts(
    point_facts: List[PointFacts],
    turnover_type_stats: Optional[Dict] = None,
) -> Dict:
    offense_started = 0
    offense_won = 0
    offense_lost = 0
    offense_won_no_turnover = 0
    offense_our_turnovers = 0
    offense_opponent_turnovers = 0

    defense_started = 0
    defense_won = 0
    defense_lost = 0
    defense_points_with_turnover = 0
    defense_won_no_turnover = 0
    defense_lost_no_turnover = 0
    defense_our_turnovers = 0
    defense_opponent_turnovers = 0

    for facts in point_facts:
        total_turnovers = facts.our_turnovers + facts.opponent_turnovers

        if facts.starting_on_offense:
            offense_started += 1
            offense_our_turnovers += facts.our_turnovers
            offense_opponent_turnovers += facts.opponent_turnovers
            if facts.won:
                offense_won += 1
                if facts.our_turnovers == 0:
                    offense_won_no_turnover += 1
            else:
                offense_lost += 1
        else:
            defense_started += 1
            defense_our_turnovers += facts.our_turnovers
            defense_opponent_turnovers += facts.opponent_turnovers
            if facts.won:
                defense_won += 1
                if facts.our_turnovers == 0:
                    defense_won_no_turnover += 1
            else:
                defense_lost += 1
                if total_turnovers == 0:
                    defense_lost_no_turnover += 1

            if total_turnovers > 0:
                defense_points_with_turnover += 1

    offense_hold_rate = calculate_rate(offense_won, offense_started)
    offense_clean_hold_rate = calculate_rate(offense_won_no_turnover, offense_started)
    offense_broken_rate = calculate_rate(offense_lost, offense_started)

    defense_break_rate = calculate_rate(defense_won, defense_started)
    defense_turnover_rate = calculate_rate(defense_points_with_turnover, defense_started)
    defense_conversion_rate = calculate_rate(defense_won, defense_points_with_turnover)
    defense_clean_break_rate = calculate_rate(defense_won_no_turnover, defense_started)
    defense_clean_conversion_rate = calculate_rate(defense_won_no_turnover, defense_won)

    defense_points_with_pull = [
        point for point in point_facts if (not point.starting_on_offense and point.pull is not None)
    ]
    total_pulls = len(defense_points_with_pull)
    inbound_pulls = len([point for point in defense_points_with_pull if point.pull is True])
    out_of_bounds_pulls = len([point for point in defense_points_with_pull if point.pull is False])
    inbound_rate = inbound_pulls / total_pulls if total_pulls > 0 else 0.0
    field_side_stats = build_field_side_stats_from_point_facts(point_facts)

    return {
        "total_completed_points": len(point_facts),
        "turnover_type_stats": turnover_type_stats or build_empty_turnover_type_stats(),
        "offense": {
            "points_started": offense_started,
            "points_won": offense_won,
            "points_lost": offense_lost,
            "hold_rate": offense_hold_rate,
            "points_won_no_turnover": offense_won_no_turnover,
            "clean_hold_rate": offense_clean_hold_rate,
            "broken_rate": offense_broken_rate,
            "our_turnovers": offense_our_turnovers,
            "opponent_turnovers": offense_opponent_turnovers,
        },
        "defense": {
            "points_started": defense_started,
            "points_won": defense_won,
            "points_lost": defense_lost,
            "break_rate": defense_break_rate,
            "points_with_turnover": defense_points_with_turnover,
            "turnover_rate": defense_turnover_rate,
            "conversion_rate": defense_conversion_rate,
            "points_won_no_turnover": defense_won_no_turnover,
            "clean_break_rate": defense_clean_break_rate,
            "clean_conversion_rate": defense_clean_conversion_rate,
            "points_lost_no_turnover": defense_lost_no_turnover,
            "our_turnovers": defense_our_turnovers,
            "opponent_turnovers": defense_opponent_turnovers,
            "pull_stats": {
                "total_pulls": total_pulls,
                "inbound_pulls": inbound_pulls,
                "out_of_bounds_pulls": out_of_bounds_pulls,
                "inbound_rate": inbound_rate,
            },
        },
        "field_side_stats": field_side_stats,
    }


def build_scoped_team_stats(
    scope_key: str,
    scope_id: int,
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    point_facts = build_point_facts(completed_points, turnovers_by_point)
    turnover_type_stats = build_turnover_type_stats(completed_points, turnovers_by_point)
    return {
        scope_key: scope_id,
        **build_team_stats_from_point_facts(point_facts, turnover_type_stats),
    }


def build_game_team_stats(
    game_id: int,
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    return build_scoped_team_stats("game_id", game_id, completed_points, turnovers_by_point)


def build_competition_team_stats(
    competition_id: int,
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    return build_scoped_team_stats(
        "competition_id",
        competition_id,
        completed_points,
        turnovers_by_point,
    )


def build_team_team_stats(
    team_id: int,
    completed_points: List[Point],
    turnovers_by_point: Dict[int, List[Turnover]],
) -> Dict:
    return build_scoped_team_stats("team_id", team_id, completed_points, turnovers_by_point)


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
        strategy_turnovers_by_point = {
            point.id: turnovers_by_point.get(point.id, [])
            for point in points
        }
        turnover_type_stats = build_turnover_type_stats(points, strategy_turnovers_by_point)

        defense_strategies.append({
            "strategy_id": strategy_id,
            "strategy_name": strategy.name,
            "points_played": points_played,
            "points_won": points_won,
            "points_lost": points_lost,
            "break_rate": break_rate,
            "points_with_turnover": points_with_turnover,
            "turnover_rate": turnover_rate,
            "turnover_type_stats": turnover_type_stats,
        })

    offense_strategies.sort(key=lambda x: x["strategy_name"])
    defense_strategies.sort(key=lambda x: x["strategy_name"])

    return {
        "offense_strategies": offense_strategies,
        "defense_strategies": defense_strategies,
    }
