"""
Tests for statistics CRUD operations.
"""
import pytest

from app.crud.statistics import (
    get_competition_team_stats,
    get_team_team_stats,
)
from tests.builders import (
    CompetitionBuilder,
    GameBuilder,
    GameScenarioBuilder,
    PointBuilder,
)


def test_get_competition_team_stats_not_found(db_session):
    result = get_competition_team_stats(db_session, competition_id=999)
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


def test_get_team_team_stats_not_found(db_session):
    result = get_team_team_stats(db_session, team_id=999)
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
