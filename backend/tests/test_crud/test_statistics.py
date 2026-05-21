"""
Tests for statistics CRUD operations.
"""
import pytest
from datetime import datetime, timezone
from app import models

from app.crud.statistics import (
    get_competition_player_stats,
    get_competition_team_stats,
    get_competition_strategy_stats,
    get_game_point_timeline,
    get_team_player_stats,
    get_team_team_stats,
    get_team_strategy_stats,
)
from app.crud.statistics_calculations import (
    PlayerStatsAccumulator,
    build_turnover_type_stats,
)
from tests.builders import (
    CompetitionBuilder,
    GameBuilder,
    GameScenarioBuilder,
    PointBuilder,
    PlayerBuilder,
)


def test_build_turnover_type_stats_counts_types_by_bucket_and_percentage(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    point1 = (
        PointBuilder(db_session, scenario.game.id, player_ids)
        .number(1).offense().won()
        .with_turnover_type(10, "defended_pass")
        .with_turnover_type(20, "drop")
        .complete()
    )
    point2 = (
        PointBuilder(db_session, scenario.game.id, player_ids)
        .number(2).defense().won()
        .with_turnover_type(10, "missed_huck")
        .with_turnover_type(20, "stall_out")
        .complete()
    )
    point3 = (
        PointBuilder(db_session, scenario.game.id, player_ids)
        .number(3).defense().lost()
        .with_turnover_type(10, "miscommunication")
        .complete()
    )

    turnover_type_stats = build_turnover_type_stats(
        [point1, point2, point3],
        {
            point1.id: point1.turnovers,
            point2.id: point2.turnovers,
            point3.id: point3.turnovers,
        },
    )

    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["total_turnovers"] == 2
    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["by_type"]["stall_out"]["count"] == 1
    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["by_type"]["defended_pass"]["percentage"] == pytest.approx(0.5, rel=1e-6)

    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 3
    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_huck"]["count"] == 1
    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["by_type"]["miscommunication"]["count"] == 1

    assert turnover_type_stats["started_on_offense"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert turnover_type_stats["started_on_offense"]["our_possession_turnovers"]["by_type"]["defended_pass"]["percentage"] == pytest.approx(1.0, rel=1e-6)
    assert turnover_type_stats["started_on_offense"]["opponent_possession_turnovers"]["by_type"]["drop"]["percentage"] == pytest.approx(1.0, rel=1e-6)

    assert turnover_type_stats["started_on_defense"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert turnover_type_stats["started_on_defense"]["our_possession_turnovers"]["by_type"]["stall_out"]["percentage"] == pytest.approx(1.0, rel=1e-6)
    assert turnover_type_stats["started_on_defense"]["opponent_possession_turnovers"]["total_turnovers"] == 2
    assert turnover_type_stats["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["missed_huck"]["percentage"] == pytest.approx(0.5, rel=1e-6)
    assert turnover_type_stats["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["miscommunication"]["percentage"] == pytest.approx(0.5, rel=1e-6)


def test_build_turnover_type_stats_returns_zeroed_distribution_for_empty_dataset():
    turnover_type_stats = build_turnover_type_stats([], {})

    for phase in turnover_type_stats.values():
        for bucket in phase.values():
            assert bucket["total_turnovers"] == 0
            for turnover_type in bucket["by_type"].values():
                assert turnover_type["count"] == 0
                assert turnover_type["percentage"] == 0.0


def test_player_stats_accumulator_converts_to_existing_response_shape():
    accumulator = PlayerStatsAccumulator(
        player_id=12,
        player_name="Alex",
        player_number=7,
    )
    accumulator.record_point(
        starting_on_offense=True,
        won=True,
        effective_time_seconds=42,
        our_turnovers=0,
        opponent_turnovers=1,
        turnovers=[],
    )

    stats = accumulator.to_response()

    assert stats["player_id"] == 12
    assert stats["player_name"] == "Alex"
    assert stats["player_number"] == 7
    assert stats["points_played"] == 1
    assert stats["effective_time_seconds"] == 42
    assert stats["offense"]["points_played"] == 1
    assert stats["offense"]["points_won"] == 1
    assert stats["offense"]["hold_rate"] == 1.0
    assert stats["offense"]["opponent_turnovers"] == 1
    assert stats["defense"]["points_played"] == 0
    assert stats["turnover_type_stats"]["all_points"]["our_possession_turnovers"][
        "total_turnovers"
    ] == 0


def test_get_game_point_timeline_returns_cumulative_score_and_halftime_marker(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]
    base_time = datetime(2024, 1, 1, 10, 0, tzinfo=timezone.utc)

    point1 = PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).start_at(base_time).offense().won().with_duration(45).with_turnover(20).complete()
    point2 = PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).start_at(base_time.replace(minute=5)).defense().lost().with_duration(80).with_turnover(40).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(3).start_at(base_time.replace(minute=10)).offense().won().with_duration(60).complete()

    halftime_timestamp = datetime(2024, 1, 1, 10, 3, tzinfo=timezone.utc)
    db_session.add(
        models.Halftime(
            game_id=scenario.game.id,
            halftime_timestamp=halftime_timestamp,
        )
    )
    db_session.commit()

    timeline = get_game_point_timeline(db_session, scenario.game.id)

    assert timeline is not None
    assert timeline["game_id"] == scenario.game.id
    assert timeline["halftime_after_point_number"] == 1
    assert [point["point_number"] for point in timeline["points"]] == [1, 2, 3]
    assert [(point["our_score_after"], point["opponent_score_after"]) for point in timeline["points"]] == [
        (1, 0),
        (1, 1),
        (2, 1),
    ]
    assert timeline["points"][0]["duration_seconds"] == 45
    assert timeline["points"][0]["our_turnovers"] == 1
    assert timeline["points"][1]["opponent_turnovers"] == 1


def test_get_competition_team_stats_not_found(db_session):
    result = get_competition_team_stats(db_session, competition_id=999)
    assert result is None


def test_get_competition_player_stats_not_found(db_session):
    result = get_competition_player_stats(db_session, competition_id=999)
    assert result is None


def test_get_competition_strategy_stats_not_found(db_session):
    result = get_competition_strategy_stats(db_session, competition_id=999)
    assert result is None


def test_get_competition_team_stats_aggregates_all_games_in_competition(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=False, pull=False, with_turnover=True) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Add second game in same competition (included)
    game_2 = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_2.id, player_ids).offense().won().complete()

    # Different competition for same team (excluded)
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().lost().complete()

    stats = get_competition_team_stats(db_session, scenario.competition.id)

    assert stats is not None
    assert stats["competition_id"] == scenario.competition.id
    assert stats["total_completed_points"] == 3
    assert stats["offense"]["points_started"] == 2
    assert stats["offense"]["points_won"] == 2
    assert stats["defense"]["points_started"] == 1
    assert stats["defense"]["points_lost"] == 1


def test_get_competition_player_stats_aggregates_all_games_in_competition(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=False) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Add second game in same competition (included)
    game_2 = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_2.id, player_ids).offense().won().complete()

    # Different competition for same team (excluded)
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().lost().complete()

    stats = get_competition_player_stats(db_session, scenario.competition.id)

    assert stats is not None
    assert len(stats) == 7
    # All players are on all three included points
    assert all(player_stats["points_played"] == 3 for player_stats in stats)


def test_get_competition_strategy_stats_aggregates_all_games_in_competition(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_defense_strategy("Zone")

    vert = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert) \
        .with_completed_point(offense=False, won=True, strategy=zone) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Add second game in same competition (included)
    game_2 = GameBuilder(db_session, scenario.competition).with_opponent("Opponent 2").build()
    PointBuilder(db_session, game_2.id, player_ids).offense().with_strategy(vert.id).won().complete()

    # Different competition for same team (excluded)
    other_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp B").build()
    other_game = GameBuilder(db_session, other_comp).with_opponent("Opponent 3").build()
    PointBuilder(db_session, other_game.id, player_ids).offense().with_strategy(vert.id).won().complete()

    stats = get_competition_strategy_stats(db_session, scenario.competition.id)

    assert stats is not None
    assert stats["competition_id"] == scenario.competition.id
    assert len(stats["offense_strategies"]) == 1
    assert len(stats["defense_strategies"]) == 1
    assert stats["offense_strategies"][0]["strategy_name"] == "Vertical Stack"
    assert stats["offense_strategies"][0]["points_played"] == 2
    assert stats["defense_strategies"][0]["strategy_name"] == "Zone"
    assert stats["defense_strategies"][0]["points_played"] == 1


def test_get_team_team_stats_not_found(db_session):
    result = get_team_team_stats(db_session, team_id=999)
    assert result is None


def test_get_team_player_stats_not_found(db_session):
    result = get_team_player_stats(db_session, team_id=999)
    assert result is None


def test_get_team_strategy_stats_not_found(db_session):
    result = get_team_strategy_stats(db_session, team_id=999)
    assert result is None


def test_get_team_team_stats_aggregates_only_selected_team(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team (included)
    second_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    second_game = GameBuilder(db_session, second_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, second_game.id, player_ids).offense().lost().complete()

    # Another team with points (excluded)
    GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .build()

    stats = get_team_team_stats(db_session, scenario.team.id)

    assert stats is not None
    assert stats["team_id"] == scenario.team.id
    assert stats["total_completed_points"] == 3
    assert stats["offense"]["points_started"] == 2
    assert stats["offense"]["points_won"] == 1
    assert stats["offense"]["hold_rate"] == pytest.approx(0.5, rel=1e-6)
    assert stats["defense"]["points_started"] == 1
    assert stats["defense"]["points_won"] == 1


def test_get_team_team_stats_aggregates_turnover_totals(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won().with_turnover(10).with_turnover(20).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_turnover(15).complete()

    stats = get_team_team_stats(db_session, scenario.team.id)

    assert stats is not None
    assert stats["offense"]["our_turnovers"] == 1
    assert stats["offense"]["opponent_turnovers"] == 1
    assert stats["defense"]["our_turnovers"] == 0
    assert stats["defense"]["opponent_turnovers"] == 1


def test_get_team_team_stats_exposes_turnover_type_distributions(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won() \
        .with_turnover_type(10, "defended_pass") \
        .with_turnover_type(20, "drop") \
        .complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won() \
        .with_turnover_type(10, "miscommunication") \
        .complete()

    stats = get_team_team_stats(db_session, scenario.team.id)

    assert stats is not None
    assert stats["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert stats["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 2
    assert stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert stats["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["miscommunication"]["count"] == 1
    assert stats["turnover_type_stats"]["started_on_offense"]["opponent_possession_turnovers"]["by_type"]["drop"]["percentage"] == pytest.approx(1.0, rel=1e-6)
    assert stats["turnover_type_stats"]["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["miscommunication"]["percentage"] == pytest.approx(1.0, rel=1e-6)


def test_get_team_team_stats_calculates_defense_conversion_rates(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).defense().won().with_turnover(10).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_turnover(10).with_turnover(20).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(3).defense().lost().complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(4).defense().lost().with_turnover(10).complete()

    stats = get_team_team_stats(db_session, scenario.team.id)

    assert stats is not None
    assert stats["defense"]["points_started"] == 4
    assert stats["defense"]["points_with_turnover"] == 3
    assert stats["defense"]["points_won"] == 2
    assert stats["defense"]["points_won_no_turnover"] == 1
    assert stats["defense"]["conversion_rate"] == pytest.approx(2 / 3, rel=1e-6)
    assert stats["defense"]["clean_conversion_rate"] == pytest.approx(1 / 3, rel=1e-6)


def test_get_team_player_stats_aggregates_only_selected_team(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .with_completed_point(offense=False, won=True, pull=True) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team (included)
    second_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    second_game = GameBuilder(db_session, second_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, second_game.id, player_ids).offense().lost().complete()

    # Add one player with no points, should still be present with 0 stats
    PlayerBuilder(db_session, scenario.team).with_name("Bench Player").with_number(99).male().build()

    # Another team with points (excluded)
    GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_completed_point(offense=True, won=True) \
        .build()

    stats = get_team_player_stats(db_session, scenario.team.id)

    assert stats is not None
    assert len(stats) == 8
    active_players = [player_stats for player_stats in stats if player_stats["player_number"] != 99]
    bench_player = next(player_stats for player_stats in stats if player_stats["player_number"] == 99)

    assert all(player_stats["points_played"] == 3 for player_stats in active_players)
    assert bench_player["points_played"] == 0
    assert bench_player["effective_time_seconds"] == 0


def test_get_team_player_stats_counts_turnovers_while_player_is_on_field(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won().with_turnover(10).with_turnover(20).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_turnover(15).complete()

    stats = get_team_player_stats(db_session, scenario.team.id)

    assert stats is not None
    first_player = stats[0]
    assert first_player["offense"]["our_turnovers"] == 1
    assert first_player["offense"]["opponent_turnovers"] == 1
    assert first_player["defense"]["our_turnovers"] == 0
    assert first_player["defense"]["opponent_turnovers"] == 1


def test_get_team_player_stats_exposes_on_field_turnover_type_distributions(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).offense().won() \
        .with_turnover_type(10, "defended_huck") \
        .complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().lost() \
        .with_turnover_type(10, "missed_pass") \
        .with_turnover_type(20, "drop") \
        .complete()

    stats = get_team_player_stats(db_session, scenario.team.id)

    assert stats is not None
    first_player = stats[0]
    assert first_player["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["total_turnovers"] == 2
    assert first_player["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["defended_huck"]["count"] == 1
    assert first_player["turnover_type_stats"]["all_points"]["our_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert first_player["turnover_type_stats"]["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_pass"]["count"] == 1
    assert first_player["turnover_type_stats"]["started_on_offense"]["our_possession_turnovers"]["by_type"]["defended_huck"]["percentage"] == pytest.approx(1.0, rel=1e-6)
    assert first_player["turnover_type_stats"]["started_on_defense"]["our_possession_turnovers"]["by_type"]["drop"]["percentage"] == pytest.approx(1.0, rel=1e-6)
    assert first_player["turnover_type_stats"]["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["missed_pass"]["percentage"] == pytest.approx(1.0, rel=1e-6)


def test_get_team_player_stats_calculates_defense_conversion_rates_on_field(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).defense().won().with_turnover(10).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().won().with_turnover(10).with_turnover(20).complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(3).defense().lost().complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(4).defense().lost().with_turnover(10).complete()

    stats = get_team_player_stats(db_session, scenario.team.id)

    assert stats is not None
    first_player = stats[0]
    assert first_player["defense"]["points_played"] == 4
    assert first_player["defense"]["points_with_turnover"] == 3
    assert first_player["defense"]["points_won"] == 2
    assert first_player["defense"]["points_won_no_turnover"] == 1
    assert first_player["defense"]["conversion_rate"] == pytest.approx(2 / 3, rel=1e-6)
    assert first_player["defense"]["clean_conversion_rate"] == pytest.approx(1 / 3, rel=1e-6)


def test_get_team_strategy_stats_aggregates_only_selected_team(db_session):
    scenario = GameScenarioBuilder(db_session) \
        .with_team("Team A") \
        .with_competition("Comp A") \
        .with_game("Opponent 1") \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_defense_strategy("Zone")

    vert = scenario.offense_strategies[0]
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert) \
        .with_completed_point(offense=False, won=True, strategy=zone) \
        .build()

    player_ids = [player.id for player in scenario.players]

    # Another competition for same team (included)
    second_comp = CompetitionBuilder(db_session, scenario.team).with_name("Comp A2").build()
    second_game = GameBuilder(db_session, second_comp).with_opponent("Opponent 2").build()
    PointBuilder(db_session, second_game.id, player_ids).offense().with_strategy(vert.id).won().complete()

    # Another team with its own strategies/points (excluded)
    other_team = GameScenarioBuilder(db_session) \
        .with_team("Team B") \
        .with_competition("Comp B") \
        .with_game("Opponent X") \
        .with_players(7) \
        .with_offense_strategy("Other O") \
        .with_defense_strategy("Other D")
    other_o = other_team.offense_strategies[0]
    other_d = other_team.defense_strategies[0]
    other_team.with_completed_point(offense=True, won=True, strategy=other_o) \
        .with_completed_point(offense=False, won=True, strategy=other_d) \
        .build()

    stats = get_team_strategy_stats(db_session, scenario.team.id)

    assert stats is not None
    assert stats["team_id"] == scenario.team.id
    assert len(stats["offense_strategies"]) == 1
    assert len(stats["defense_strategies"]) == 1
    assert stats["offense_strategies"][0]["strategy_name"] == "Vertical Stack"
    assert stats["offense_strategies"][0]["points_played"] == 2
    assert stats["defense_strategies"][0]["strategy_name"] == "Zone"
    assert stats["defense_strategies"][0]["points_played"] == 1
