from app.crud.statistics_evolution import get_team_evolution_metric_catalog
from app.schemas.statistics import EvolutionMetricFormat, EvolutionMetricUnit


EXPECTED_TEAM_EVOLUTION_METRIC_IDS = {
    "total_our_turnovers",
    "total_opponent_turnovers",
    "offense_our_turnovers",
    "defense_opponent_turnovers",
    "points_won",
    "points_lost",
    "holds",
    "breaks",
    "offense_hold_rate",
    "offense_clean_hold_rate",
    "defense_turnover_rate",
    "defense_break_rate",
    "defense_clean_break_rate",
    "defense_conversion_rate",
    "defense_clean_conversion_rate",
    "defense_pull_inbound_rate",
}


def test_team_evolution_catalog_exposes_expected_metrics():
    catalog = get_team_evolution_metric_catalog()
    metric_ids = {metric.id for metric in catalog.metrics}

    assert metric_ids == EXPECTED_TEAM_EVOLUTION_METRIC_IDS
    assert len(metric_ids) == len(catalog.metrics)


def test_team_evolution_catalog_exposes_turnover_battle_default_preset():
    catalog = get_team_evolution_metric_catalog()
    preset = next(
        preset for preset in catalog.presets if preset.id == catalog.default_preset_id
    )

    assert catalog.default_preset_id == "turnover_battle"
    assert preset.label == "Turnover battle"
    assert preset.metric_ids == ["total_our_turnovers", "total_opponent_turnovers"]


def test_team_evolution_default_preset_metrics_are_compatible_counts():
    catalog = get_team_evolution_metric_catalog()
    metrics_by_id = {metric.id: metric for metric in catalog.metrics}
    preset = next(
        preset for preset in catalog.presets if preset.id == catalog.default_preset_id
    )
    preset_metrics = [metrics_by_id[metric_id] for metric_id in preset.metric_ids]

    assert {metric.unit for metric in preset_metrics} == {EvolutionMetricUnit.count}
    assert {metric.format for metric in preset_metrics} == {
        EvolutionMetricFormat.integer
    }


def test_team_evolution_catalog_documents_current_team_stat_semantics():
    catalog = get_team_evolution_metric_catalog()
    metrics_by_id = {metric.id: metric for metric in catalog.metrics}

    assert (
        metrics_by_id["defense_clean_conversion_rate"].description
        == "Breaks won without us committing a turnover, out of all breaks."
    )
    assert metrics_by_id["defense_conversion_rate"].description == (
        "Defensive points won, out of defensive points where at least one "
        "possession turnover occurred."
    )
    assert metrics_by_id["total_our_turnovers"].higher_is_better is False
    assert metrics_by_id["total_opponent_turnovers"].higher_is_better is True
