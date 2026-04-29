from sqlalchemy import inspect
from sqlalchemy.orm.attributes import NO_VALUE

from app.crud.statistics_queries import get_completed_points_for_team
from tests.builders import GameScenarioBuilder, PointBuilder


def test_get_completed_points_for_team_filters_by_required_players(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(8)
        .build()
    )
    selected_ids = [scenario.players[0].id, scenario.players[1].id]

    PointBuilder(db_session, scenario.game.id, [player.id for player in scenario.players[:7]]) \
        .number(1).offense().won().complete()
    PointBuilder(
        db_session,
        scenario.game.id,
        [scenario.players[0].id] + [player.id for player in scenario.players[2:]],
    ).number(2).offense().lost().complete()
    PointBuilder(
        db_session,
        scenario.game.id,
        [scenario.players[0].id, scenario.players[1].id] + [
            player.id for player in scenario.players[3:]
        ],
    ).number(3).defense().won().complete()

    points = get_completed_points_for_team(
        db_session,
        scenario.team.id,
        required_player_ids=selected_ids,
    )

    assert [point.point_number for point in points] == [1, 3]


def test_get_completed_points_for_team_can_eager_load_players(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(7)
        .build()
    )
    PointBuilder(
        db_session,
        scenario.game.id,
        [player.id for player in scenario.players],
    ).number(1).offense().won().complete()

    points = get_completed_points_for_team(
        db_session,
        scenario.team.id,
        load_players=True,
    )

    assert len(points) == 1
    assert inspect(points[0]).attrs.players.loaded_value is not NO_VALUE
    assert {player.id for player in points[0].players} == {
        player.id for player in scenario.players
    }
