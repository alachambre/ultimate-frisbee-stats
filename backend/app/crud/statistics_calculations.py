"""
Pure calculation helpers for statistics.
"""
from dataclasses import dataclass, field
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


@dataclass
class PossessionPhaseAccumulator:
    points_played: int = 0
    points_won: int = 0
    points_lost: int = 0
    points_won_no_turnover: int = 0
    points_lost_no_turnover: int = 0
    points_with_turnover: int = 0
    our_turnovers: int = 0
    opponent_turnovers: int = 0

    def record_point(
        self,
        won: bool,
        our_turnovers: int,
        opponent_turnovers: int,
    ) -> None:
        total_turnovers = our_turnovers + opponent_turnovers

        self.points_played += 1
        self.our_turnovers += our_turnovers
        self.opponent_turnovers += opponent_turnovers

        if won:
            self.points_won += 1
            if our_turnovers == 0:
                self.points_won_no_turnover += 1
        else:
            self.points_lost += 1
            if total_turnovers == 0:
                self.points_lost_no_turnover += 1

        if total_turnovers > 0:
            self.points_with_turnover += 1

    def to_offense_response(self, points_key: str) -> Dict:
        return {
            points_key: self.points_played,
            "points_won": self.points_won,
            "points_lost": self.points_lost,
            "hold_rate": calculate_rate(self.points_won, self.points_played),
            "points_won_no_turnover": self.points_won_no_turnover,
            "clean_hold_rate": calculate_rate(
                self.points_won_no_turnover,
                self.points_played,
            ),
            "our_turnovers": self.our_turnovers,
            "opponent_turnovers": self.opponent_turnovers,
        }

    def to_team_offense_response(self) -> Dict:
        return {
            **self.to_offense_response("points_started"),
            "broken_rate": calculate_rate(self.points_lost, self.points_played),
        }

    def to_defense_response(self, points_key: str) -> Dict:
        return {
            points_key: self.points_played,
            "points_won": self.points_won,
            "points_lost": self.points_lost,
            "break_rate": calculate_rate(self.points_won, self.points_played),
            "points_with_turnover": self.points_with_turnover,
            "turnover_rate": calculate_rate(
                self.points_with_turnover,
                self.points_played,
            ),
            "conversion_rate": calculate_rate(
                self.points_won,
                self.points_with_turnover,
            ),
            "points_won_no_turnover": self.points_won_no_turnover,
            "clean_break_rate": calculate_rate(
                self.points_won_no_turnover,
                self.points_played,
            ),
            "clean_conversion_rate": calculate_rate(
                self.points_won_no_turnover,
                self.points_with_turnover,
            ),
            "points_lost_no_turnover": self.points_lost_no_turnover,
            "our_turnovers": self.our_turnovers,
            "opponent_turnovers": self.opponent_turnovers,
        }


@dataclass
class PlayerStatsAccumulator:
    player_id: int
    player_name: str
    player_number: Optional[int]
    points_played: int = 0
    effective_time_seconds: int = 0
    turnover_type_stats: Dict = field(default_factory=build_empty_turnover_type_stats)
    offense: PossessionPhaseAccumulator = field(
        default_factory=PossessionPhaseAccumulator
    )
    defense: PossessionPhaseAccumulator = field(
        default_factory=PossessionPhaseAccumulator
    )

    @classmethod
    def from_player(cls, player: Player) -> "PlayerStatsAccumulator":
        return cls(
            player_id=player.id,
            player_name=player.name,
            player_number=player.number,
        )

    def record_point(
        self,
        starting_on_offense: bool,
        won: bool,
        effective_time_seconds: int,
        our_turnovers: int,
        opponent_turnovers: int,
        turnovers: List[Turnover],
    ) -> None:
        self.points_played += 1
        self.effective_time_seconds += effective_time_seconds
        accumulate_turnover_type_stats(
            self.turnover_type_stats,
            starting_on_offense,
            turnovers,
        )

        phase = self.offense if starting_on_offense else self.defense
        phase.record_point(won, our_turnovers, opponent_turnovers)

    def to_response(self) -> Dict:
        return {
            "player_id": self.player_id,
            "player_name": self.player_name,
            "player_number": self.player_number,
            "points_played": self.points_played,
            "effective_time_seconds": self.effective_time_seconds,
            "turnover_type_stats": finalize_turnover_type_stats(
                self.turnover_type_stats
            ),
            "offense": self.offense.to_offense_response("points_played"),
            "defense": self.defense.to_defense_response("points_played"),
        }


@dataclass
class TeamStatsAccumulator:
    total_completed_points: int = 0
    offense: PossessionPhaseAccumulator = field(
        default_factory=PossessionPhaseAccumulator
    )
    defense: PossessionPhaseAccumulator = field(
        default_factory=PossessionPhaseAccumulator
    )
    total_pulls: int = 0
    inbound_pulls: int = 0
    out_of_bounds_pulls: int = 0

    def record_point_facts(self, facts: PointFacts) -> None:
        self.total_completed_points += 1
        phase = self.offense if facts.starting_on_offense else self.defense
        phase.record_point(facts.won, facts.our_turnovers, facts.opponent_turnovers)

        if not facts.starting_on_offense and facts.pull is not None:
            self.total_pulls += 1
            if facts.pull is True:
                self.inbound_pulls += 1
            else:
                self.out_of_bounds_pulls += 1

    def to_response(
        self,
        turnover_type_stats: Optional[Dict],
        field_side_stats: Dict,
    ) -> Dict:
        defense_response = self.defense.to_defense_response("points_started")
        defense_response["pull_stats"] = {
            "total_pulls": self.total_pulls,
            "inbound_pulls": self.inbound_pulls,
            "out_of_bounds_pulls": self.out_of_bounds_pulls,
            "inbound_rate": calculate_rate(self.inbound_pulls, self.total_pulls),
        }

        return {
            "total_completed_points": self.total_completed_points,
            "turnover_type_stats": (
                turnover_type_stats or build_empty_turnover_type_stats()
            ),
            "offense": self.offense.to_team_offense_response(),
            "defense": defense_response,
            "field_side_stats": field_side_stats,
        }


@dataclass
class OffenseStrategyStatsAccumulator:
    strategy_id: int
    strategy_name: str
    points_played: int = 0
    points_won: int = 0
    clean_holds: int = 0
    quick_scores: int = 0

    @classmethod
    def from_strategy(
        cls,
        strategy_id: int,
        strategy: Strategy,
    ) -> "OffenseStrategyStatsAccumulator":
        return cls(strategy_id=strategy_id, strategy_name=strategy.name)

    def record_point(self, point: Point, turnovers: List[Turnover]) -> None:
        self.points_played += 1
        if not point.won:
            return

        self.points_won += 1
        our_turnovers, _their_turnovers = count_turnovers_by_possession(
            True,
            turnovers,
        )
        if our_turnovers == 0:
            self.clean_holds += 1

        if calculate_point_duration_seconds(point) < 90:
            self.quick_scores += 1

    def to_response(self) -> Dict:
        points_lost = self.points_played - self.points_won
        return {
            "strategy_id": self.strategy_id,
            "strategy_name": self.strategy_name,
            "points_played": self.points_played,
            "points_won": self.points_won,
            "points_lost": points_lost,
            "hold_rate": calculate_rate(self.points_won, self.points_played),
            "clean_holds": self.clean_holds,
            "clean_hold_rate": calculate_rate(self.clean_holds, self.points_played),
            "quick_scores": self.quick_scores,
            "quick_score_rate": calculate_rate(self.quick_scores, self.points_played),
        }


@dataclass
class DefenseStrategyStatsAccumulator:
    strategy_id: int
    strategy_name: str
    points_played: int = 0
    points_won: int = 0
    points_with_turnover: int = 0
    turnover_type_stats: Dict = field(default_factory=build_empty_turnover_type_stats)

    @classmethod
    def from_strategy(
        cls,
        strategy_id: int,
        strategy: Strategy,
    ) -> "DefenseStrategyStatsAccumulator":
        return cls(strategy_id=strategy_id, strategy_name=strategy.name)

    def record_point(self, point: Point, turnovers: List[Turnover]) -> None:
        self.points_played += 1
        if point.won:
            self.points_won += 1
        if turnovers:
            self.points_with_turnover += 1

        accumulate_turnover_type_stats(
            self.turnover_type_stats,
            point.starting_on_offense,
            turnovers,
        )

    def to_response(self) -> Dict:
        points_lost = self.points_played - self.points_won
        return {
            "strategy_id": self.strategy_id,
            "strategy_name": self.strategy_name,
            "points_played": self.points_played,
            "points_won": self.points_won,
            "points_lost": points_lost,
            "break_rate": calculate_rate(self.points_won, self.points_played),
            "points_with_turnover": self.points_with_turnover,
            "turnover_rate": calculate_rate(
                self.points_with_turnover,
                self.points_played,
            ),
            "turnover_type_stats": finalize_turnover_type_stats(
                self.turnover_type_stats
            ),
        }


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
    player_stats: Dict[int, PlayerStatsAccumulator] = {
        player.id: PlayerStatsAccumulator.from_player(player)
        for player in game_players
    }

    for point in completed_points:
        stoppages = stoppages_by_point.get(point.id, [])
        effective_time = calculate_effective_time_seconds(point, stoppages)

        turnovers = turnovers_by_point.get(point.id, [])
        our_turnovers, opponent_turnovers = count_turnovers_by_possession(
            point.starting_on_offense,
            turnovers,
        )

        for player in point.players:
            if player.id not in player_stats:
                continue
            player_stats[player.id].record_point(
                starting_on_offense=point.starting_on_offense,
                won=point.won is True,
                effective_time_seconds=effective_time,
                our_turnovers=our_turnovers,
                opponent_turnovers=opponent_turnovers,
                turnovers=turnovers,
            )

    return sorted(
        [stats.to_response() for stats in player_stats.values()],
        key=lambda x: (x["player_number"] is None, x["player_number"] or 0),
    )


def build_team_stats_from_point_facts(
    point_facts: List[PointFacts],
    turnover_type_stats: Optional[Dict] = None,
) -> Dict:
    accumulator = TeamStatsAccumulator()
    for facts in point_facts:
        accumulator.record_point_facts(facts)

    field_side_stats = build_field_side_stats_from_point_facts(point_facts)

    return accumulator.to_response(turnover_type_stats, field_side_stats)


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
    offense_strategy_stats: Dict[int, OffenseStrategyStatsAccumulator] = {}
    defense_strategy_stats: Dict[int, DefenseStrategyStatsAccumulator] = {}

    for point in completed_points:
        if not point.strategy_id:
            continue

        strategy_id = point.strategy_id
        strategy = strategies_by_id.get(strategy_id)
        if not strategy:
            continue

        turnovers = turnovers_by_point.get(point.id, [])
        if point.starting_on_offense:
            accumulator = offense_strategy_stats.setdefault(
                strategy_id,
                OffenseStrategyStatsAccumulator.from_strategy(strategy_id, strategy),
            )
        else:
            accumulator = defense_strategy_stats.setdefault(
                strategy_id,
                DefenseStrategyStatsAccumulator.from_strategy(strategy_id, strategy),
            )
        accumulator.record_point(point, turnovers)

    offense_strategies = [
        stats.to_response()
        for stats in offense_strategy_stats.values()
    ]
    defense_strategies = [
        stats.to_response()
        for stats in defense_strategy_stats.values()
    ]

    return {
        "offense_strategies": sorted(
            offense_strategies,
            key=lambda x: x["strategy_name"],
        ),
        "defense_strategies": sorted(
            defense_strategies,
            key=lambda x: x["strategy_name"],
        ),
    }
