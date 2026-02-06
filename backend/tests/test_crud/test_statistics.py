"""
Tests for statistics CRUD operations.
"""
import pytest

from app.crud.statistics import (
    get_competition_player_stats,
    get_competition_team_stats,
    get_competition_strategy_stats,
    get_team_player_stats,
    get_team_team_stats,
    get_team_strategy_stats,
)
from tests.builders import (
    CompetitionBuilder,
    GameBuilder,
    GameScenarioBuilder,
    PointBuilder,
    PlayerBuilder,
)


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
