"""Metric catalog for statistics evolution views."""

from collections import defaultdict
from typing import Optional

from sqlalchemy.orm import Session, joinedload

from app.crud.statistics_calculations import build_game_team_stats
from app.crud.statistics_queries import (
    get_completed_points_for_team,
    get_team,
    get_turnovers_for_points,
)
from app.models.competition import Competition
from app.models.game import Game
from app.models.point import Point
from app.schemas.statistics import (
    EvolutionMetricCatalog,
    EvolutionMetricDefinition,
    EvolutionMetricFormat,
    EvolutionMetricPreset,
    EvolutionMetricUnit,
)


TURNOVER_BATTLE_PRESET_ID = "turnover_battle"

TEAM_EVOLUTION_METRICS: tuple[EvolutionMetricDefinition, ...] = (
    EvolutionMetricDefinition(
        id="total_our_turnovers",
        label="Our turnovers",
        description="Total possession turnovers committed by us across the game.",
        unit=EvolutionMetricUnit.count,
        group="turnovers",
        format=EvolutionMetricFormat.integer,
        higher_is_better=False,
    ),
    EvolutionMetricDefinition(
        id="total_opponent_turnovers",
        label="Opponent turnovers",
        description="Total possession turnovers committed by the opponent across the game.",
        unit=EvolutionMetricUnit.count,
        group="turnovers",
        format=EvolutionMetricFormat.integer,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="offense_our_turnovers",
        label="Our offensive turnovers",
        description="Possession turnovers committed by us on points started on offense.",
        unit=EvolutionMetricUnit.count,
        group="turnovers",
        format=EvolutionMetricFormat.integer,
        higher_is_better=False,
    ),
    EvolutionMetricDefinition(
        id="defense_opponent_turnovers",
        label="Opponent turnovers on our defense",
        description="Possession turnovers committed by the opponent on points we started on defense.",
        unit=EvolutionMetricUnit.count,
        group="turnovers",
        format=EvolutionMetricFormat.integer,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="points_won",
        label="Points won",
        description="Completed points won by us.",
        unit=EvolutionMetricUnit.count,
        group="results",
        format=EvolutionMetricFormat.integer,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="points_lost",
        label="Points lost",
        description="Completed points won by the opponent.",
        unit=EvolutionMetricUnit.count,
        group="results",
        format=EvolutionMetricFormat.integer,
        higher_is_better=False,
    ),
    EvolutionMetricDefinition(
        id="holds",
        label="Holds",
        description="Offensive points won by us.",
        unit=EvolutionMetricUnit.count,
        group="offense",
        format=EvolutionMetricFormat.integer,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="breaks",
        label="Breaks",
        description="Defensive points won by us.",
        unit=EvolutionMetricUnit.count,
        group="defense",
        format=EvolutionMetricFormat.integer,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="offense_hold_rate",
        label="Hold rate",
        description="Offensive points won, out of all offensive points played.",
        unit=EvolutionMetricUnit.percentage,
        group="offense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="offense_clean_hold_rate",
        label="Clean hold rate",
        description=(
            "Offensive points won without us committing a turnover, "
            "out of all offensive points played."
        ),
        unit=EvolutionMetricUnit.percentage,
        group="offense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_turnover_rate",
        label="Turnover rate",
        description=(
            "Defensive points where at least one possession turnover occurred, "
            "out of all defensive points played."
        ),
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_break_rate",
        label="Break rate",
        description="Defensive points won, out of all defensive points played.",
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_clean_break_rate",
        label="Clean break rate",
        description=(
            "Defensive points won without us committing a turnover, "
            "out of all defensive points played."
        ),
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_conversion_rate",
        label="Conversion rate",
        description=(
            "Defensive points won, out of defensive points where at least one "
            "possession turnover occurred."
        ),
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_clean_conversion_rate",
        label="Clean conversion rate",
        description="Breaks won without us committing a turnover, out of all breaks.",
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
    EvolutionMetricDefinition(
        id="defense_pull_inbound_rate",
        label="Pull inbound rate",
        description="Tracked pulls that stayed inbound, out of all tracked pulls.",
        unit=EvolutionMetricUnit.percentage,
        group="defense",
        format=EvolutionMetricFormat.percentage,
        higher_is_better=True,
    ),
)

TEAM_EVOLUTION_PRESETS: tuple[EvolutionMetricPreset, ...] = (
    EvolutionMetricPreset(
        id=TURNOVER_BATTLE_PRESET_ID,
        label="Turnover battle",
        metric_ids=["total_our_turnovers", "total_opponent_turnovers"],
    ),
)


def get_team_evolution_metric_catalog() -> EvolutionMetricCatalog:
    return EvolutionMetricCatalog(
        default_preset_id=TURNOVER_BATTLE_PRESET_ID,
        metrics=list(TEAM_EVOLUTION_METRICS),
        presets=list(TEAM_EVOLUTION_PRESETS),
    )


def get_team_evolution(
    db: Session,
    team_id: int,
    required_player_ids: Optional[list[int]] = None,
    competition_ids: Optional[list[int]] = None,
    game_ids: Optional[list[int]] = None,
) -> Optional[dict]:
    """Return chronological per-game team metric values for evolution charts."""
    if not get_team(db, team_id):
        return None

    normalized_competition_ids = _normalize_filter_ids(competition_ids)
    normalized_game_ids = _normalize_filter_ids(game_ids)
    normalized_player_ids = _normalize_filter_ids(required_player_ids)

    games = _get_team_evolution_games(
        db,
        team_id,
        competition_ids=normalized_competition_ids,
        game_ids=normalized_game_ids,
    )
    completed_points = get_completed_points_for_team(
        db,
        team_id,
        competition_ids=normalized_competition_ids,
        game_ids=normalized_game_ids,
        required_player_ids=normalized_player_ids,
    )

    points_by_game = _group_points_by_game(completed_points)
    turnovers_by_point = get_turnovers_for_points(
        db,
        [point.id for point in completed_points],
    )

    rows = []
    omitted_games_count = 0
    for game in games:
        game_points = points_by_game.get(game.id, [])
        if not game_points:
            omitted_games_count += 1
            continue

        stats = build_game_team_stats(
            game.id,
            game_points,
            turnovers_by_point,
        )
        rows.append(_build_team_evolution_game(game, stats))

    catalog = get_team_evolution_metric_catalog()
    return {
        "team_id": team_id,
        "filters": {
            "competition_ids": normalized_competition_ids,
            "game_ids": normalized_game_ids,
            "player_ids": normalized_player_ids,
        },
        "default_preset_id": catalog.default_preset_id,
        "omitted_games_count": omitted_games_count,
        "metrics": catalog.metrics,
        "presets": catalog.presets,
        "games": rows,
    }


def _normalize_filter_ids(values: Optional[list[int]]) -> list[int]:
    if not values:
        return []
    return sorted(set(values))


def _get_team_evolution_games(
    db: Session,
    team_id: int,
    *,
    competition_ids: list[int],
    game_ids: list[int],
) -> list[Game]:
    query = (
        db.query(Game)
        .join(Competition)
        .options(joinedload(Game.competition))
        .filter(Competition.team_id == team_id)
    )

    if competition_ids:
        query = query.filter(Game.competition_id.in_(competition_ids))

    if game_ids:
        query = query.filter(Game.id.in_(game_ids))

    return query.order_by(Game.date.asc(), Game.id.asc()).all()


def _group_points_by_game(points: list[Point]) -> dict[int, list[Point]]:
    grouped: dict[int, list[Point]] = defaultdict(list)
    for point in points:
        grouped[point.game_id].append(point)
    return dict(grouped)


def _build_team_evolution_game(game: Game, stats: dict) -> dict:
    metrics = _build_team_evolution_metrics(stats)
    return {
        "game_id": game.id,
        "competition_id": game.competition_id,
        "competition_name": game.competition.name if game.competition else "",
        "opponent_name": game.opponent_name,
        "date": game.date,
        "our_score": metrics["points_won"],
        "opponent_score": metrics["points_lost"],
        "completed_points": stats["total_completed_points"],
        "metrics": metrics,
    }


def _build_team_evolution_metrics(stats: dict) -> dict[str, int | float]:
    offense = stats["offense"]
    defense = stats["defense"]
    pull_stats = defense["pull_stats"]

    return {
        "total_our_turnovers": offense["our_turnovers"] + defense["our_turnovers"],
        "total_opponent_turnovers": (
            offense["opponent_turnovers"] + defense["opponent_turnovers"]
        ),
        "offense_our_turnovers": offense["our_turnovers"],
        "defense_opponent_turnovers": defense["opponent_turnovers"],
        "points_won": offense["points_won"] + defense["points_won"],
        "points_lost": offense["points_lost"] + defense["points_lost"],
        "holds": offense["points_won"],
        "breaks": defense["points_won"],
        "offense_hold_rate": offense["hold_rate"],
        "offense_clean_hold_rate": offense["clean_hold_rate"],
        "defense_turnover_rate": defense["turnover_rate"],
        "defense_break_rate": defense["break_rate"],
        "defense_clean_break_rate": defense["clean_break_rate"],
        "defense_conversion_rate": defense["conversion_rate"],
        "defense_clean_conversion_rate": defense["clean_conversion_rate"],
        "defense_pull_inbound_rate": pull_stats["inbound_rate"],
    }
