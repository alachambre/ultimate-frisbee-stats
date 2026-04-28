"""Metric catalog for statistics evolution views."""

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
