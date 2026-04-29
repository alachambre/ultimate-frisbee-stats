from app.crud.statistics_dataset import build_statistics_dataset
from tests.builders import GameScenarioBuilder, PointBuilder, StrategyBuilder


def test_statistics_dataset_filters_and_loads_requested_related_data(db_session):
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team("Team A")
        .with_competition("Comp A")
        .with_game("Opponent 1")
        .with_players(8)
        .build()
    )
    strategy = (
        StrategyBuilder(db_session, scenario.team)
        .with_name("Vertical Stack")
        .offense()
        .build()
    )
    selected_ids = [scenario.players[1].id, scenario.players[0].id]

    (
        PointBuilder(
            db_session,
            scenario.game.id,
            [player.id for player in scenario.players[:7]],
        )
        .number(1)
        .offense()
        .won()
        .with_strategy(strategy.id)
        .with_turnover()
        .with_stoppage()
        .complete()
    )
    PointBuilder(
        db_session,
        scenario.game.id,
        [scenario.players[0].id] + [player.id for player in scenario.players[2:]],
    ).number(2).offense().lost().complete()

    dataset = build_statistics_dataset(
        db_session,
        "team",
        scenario.team.id,
        required_player_ids=[*selected_ids, selected_ids[0]],
        include_players=True,
        include_players_from_points=True,
        include_turnovers=True,
        include_stoppages=True,
        include_strategies=True,
    )

    assert dataset is not None
    assert dataset.scope_type == "team"
    assert dataset.scope_id == scenario.team.id
    assert dataset.filters.player_ids == sorted(selected_ids)
    assert [point.point_number for point in dataset.completed_points] == [1]

    point_id = dataset.completed_points[0].id
    assert len(dataset.turnovers_by_point[point_id]) == 1
    assert len(dataset.stoppages_by_point[point_id]) == 1
    assert dataset.strategies_by_id[strategy.id].name == "Vertical Stack"
    assert {player.id for player in dataset.players} >= set(selected_ids)


def test_statistics_dataset_returns_none_for_unknown_scope(db_session):
    dataset = build_statistics_dataset(db_session, "team", 99999)

    assert dataset is None
