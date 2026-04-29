from datetime import datetime, timezone

from app.crud.statistics_evolution import (
    get_team_evolution,
    get_team_evolution_metric_catalog,
)
from app.schemas.statistics import EvolutionMetricFormat, EvolutionMetricUnit
from tests.builders import CompetitionBuilder, GameBuilder, GameScenarioBuilder, PointBuilder


EXPECTED_TEAM_EVOLUTION_METRIC_IDS = {
    "total_our_turnovers",
    "total_opponent_turnovers",
    "offense_our_turnovers",
    "defense_our_turnovers",
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
        == (
            "Defensive points won without us committing a turnover, out of "
            "defensive points where at least one possession turnover occurred."
        )
    )
    assert metrics_by_id["defense_conversion_rate"].description == (
        "Defensive points won, out of defensive points where at least one "
        "possession turnover occurred."
    )
    assert metrics_by_id["total_our_turnovers"].higher_is_better is False
    assert metrics_by_id["total_opponent_turnovers"].higher_is_better is True


def test_get_team_evolution_returns_chronological_metric_rows_and_omits_empty_games(
    db_session,
):
    scenario = _build_team_evolution_dataset(db_session)

    result = get_team_evolution(db_session, scenario["team"].id)

    assert result is not None
    assert result["team_id"] == scenario["team"].id
    assert result["filters"] == {
        "competition_ids": [],
        "game_ids": [],
        "player_ids": [],
    }
    assert result["default_preset_id"] == "turnover_battle"
    assert result["omitted_games_count"] == 1

    games = result["games"]
    assert [game["game_id"] for game in games] == [
        scenario["early_game"].id,
        scenario["late_game"].id,
    ]
    assert games[0]["competition_name"] == "Spring Cup"
    assert games[0]["opponent_name"] == "Early Opponent"
    assert games[0]["date"] == scenario["early_game"].date
    assert games[0]["our_score"] == 2
    assert games[0]["opponent_score"] == 0
    assert games[0]["completed_points"] == 2

    early_metrics = games[0]["metrics"]
    assert early_metrics["total_our_turnovers"] == 0
    assert early_metrics["total_opponent_turnovers"] == 1
    assert early_metrics["holds"] == 1
    assert early_metrics["breaks"] == 1
    assert early_metrics["offense_hold_rate"] == 1.0
    assert early_metrics["defense_turnover_rate"] == 1.0
    assert early_metrics["defense_break_rate"] == 1.0
    assert early_metrics["defense_clean_conversion_rate"] == 1.0
    assert early_metrics["defense_pull_inbound_rate"] == 1.0

    late_metrics = games[1]["metrics"]
    assert games[1]["our_score"] == 0
    assert games[1]["opponent_score"] == 1
    assert late_metrics["total_our_turnovers"] == 1
    assert late_metrics["total_opponent_turnovers"] == 0
    assert late_metrics["offense_our_turnovers"] == 1
    assert late_metrics["defense_our_turnovers"] == 0
    assert late_metrics["points_lost"] == 1
    assert late_metrics["offense_hold_rate"] == 0.0


def test_get_team_evolution_counts_d_line_turnovers(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent", date=datetime(2026, 1, 1, 9, tzinfo=timezone.utc))
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    (
        PointBuilder(db_session, scenario.game.id, player_ids)
        .number(1)
        .defense()
        .lost()
        .with_turnover(10)
        .with_turnover(20)
        .complete()
    )

    result = get_team_evolution(db_session, scenario.team.id)

    assert result is not None
    metrics = result["games"][0]["metrics"]
    assert metrics["defense_our_turnovers"] == 1
    assert metrics["defense_opponent_turnovers"] == 1


def test_get_team_evolution_applies_competition_and_game_filters(db_session):
    scenario = _build_team_evolution_dataset(db_session)

    competition_result = get_team_evolution(
        db_session,
        scenario["team"].id,
        competition_ids=[scenario["spring_competition"].id],
    )
    game_result = get_team_evolution(
        db_session,
        scenario["team"].id,
        game_ids=[scenario["late_game"].id],
    )

    assert competition_result is not None
    assert competition_result["filters"]["competition_ids"] == [
        scenario["spring_competition"].id
    ]
    assert competition_result["omitted_games_count"] == 1
    assert [game["game_id"] for game in competition_result["games"]] == [
        scenario["early_game"].id
    ]

    assert game_result is not None
    assert game_result["filters"]["game_ids"] == [scenario["late_game"].id]
    assert game_result["omitted_games_count"] == 0
    assert [game["game_id"] for game in game_result["games"]] == [
        scenario["late_game"].id
    ]


def test_get_team_evolution_filters_points_by_selected_players(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1", date=datetime(2026, 1, 1, 9, tzinfo=timezone.utc))
        .with_players(8)
        .build()
    )
    selected_ids = [scenario.players[0].id, scenario.players[1].id]
    second_game = (
        GameBuilder(db_session, scenario.competition)
        .with_opponent("Opponent 2")
        .with_date(datetime(2026, 1, 2, 9, tzinfo=timezone.utc))
        .build()
    )

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().won().complete()
    PointBuilder(
        db_session,
        second_game.id,
        [scenario.players[0].id] + [player.id for player in scenario.players[2:]],
    ).number(1).defense().won().complete()

    result = get_team_evolution(
        db_session,
        scenario.team.id,
        required_player_ids=selected_ids,
    )

    assert result is not None
    assert result["filters"]["player_ids"] == selected_ids
    assert result["omitted_games_count"] == 1
    assert [game["game_id"] for game in result["games"]] == [scenario.game.id]
    assert result["games"][0]["completed_points"] == 1


def test_get_team_evolution_returns_none_for_unknown_team(db_session):
    assert get_team_evolution(db_session, 99999) is None


def test_get_team_evolution_rows_include_every_catalog_metric(db_session):
    scenario = _build_team_evolution_dataset(db_session)

    result = get_team_evolution(db_session, scenario["team"].id)

    assert result is not None
    catalog_metric_ids = {metric.id for metric in get_team_evolution_metric_catalog().metrics}
    assert set(result["games"][0]["metrics"].keys()) == catalog_metric_ids


def _build_team_evolution_dataset(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Spring Cup")
        .with_game("Early Opponent", date=datetime(2026, 1, 1, 9, tzinfo=timezone.utc))
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won().complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_pull(True).with_turnover(10).complete()

    empty_game = (
        GameBuilder(db_session, scenario.competition)
        .with_opponent("Empty Opponent")
        .with_date(datetime(2026, 1, 2, 9, tzinfo=timezone.utc))
        .build()
    )
    autumn_competition = (
        CompetitionBuilder(db_session, scenario.team)
        .with_name("Autumn Cup")
        .build()
    )
    late_game = (
        GameBuilder(db_session, autumn_competition)
        .with_opponent("Late Opponent")
        .with_date(datetime(2026, 1, 3, 9, tzinfo=timezone.utc))
        .build()
    )
    PointBuilder(db_session, late_game.id, player_ids) \
        .number(1).offense().lost().with_turnover(10).complete()

    other_team = (
        GameScenarioBuilder(db_session)
        .with_team("Team B")
        .with_competition("Other Cup")
        .with_game("Other Opponent", date=datetime(2026, 1, 1, 8, tzinfo=timezone.utc))
        .with_players(7)
        .with_completed_point(offense=True, won=True)
        .build()
    )

    return {
        "team": scenario.team,
        "spring_competition": scenario.competition,
        "autumn_competition": autumn_competition,
        "early_game": scenario.game,
        "empty_game": empty_game,
        "late_game": late_game,
        "other_team": other_team,
    }
