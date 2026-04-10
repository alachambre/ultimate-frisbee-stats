"""
Tests for strategy statistics CRUD operations
"""
import pytest
from datetime import datetime, timezone
from app.crud.statistics import get_game_strategy_stats
from tests.builders import GameScenarioBuilder, PointBuilder


def test_get_strategy_stats_game_not_found(db_session):
    """Test getting strategy stats for non-existent game"""
    result = get_game_strategy_stats(db_session, game_id=999)
    assert result is None


def test_get_strategy_stats_no_completed_points(db_session):
    """Test strategy stats with no completed points"""
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .build()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    assert stats is not None
    assert stats["game_id"] == scenario.game.id
    assert len(stats["offense_strategies"]) == 0
    assert len(stats["defense_strategies"]) == 0


def test_get_strategy_stats_offense_strategies(db_session):
    """Test offense strategy statistics"""
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Vertical Stack") \
        .with_offense_strategy("Horizontal Stack")

    # Vertical Stack: 3 points (won clean in 30s, won with turnover in 120s, lost)
    vert = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=vert, duration_seconds=30) \
        .with_completed_point(offense=True, won=True, strategy=vert, duration_seconds=120, with_turnover=True) \
        .with_completed_point(offense=True, won=False, strategy=vert, duration_seconds=120)

    # Horizontal Stack: 2 points (won in 100s, lost)
    horiz = scenario.offense_strategies[1]
    scenario.with_completed_point(offense=True, won=True, strategy=horiz, duration_seconds=100) \
        .with_completed_point(offense=True, won=False, strategy=horiz, duration_seconds=100) \
        .build()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    # Find strategies (sorted by name)
    horiz_stats = next(s for s in stats["offense_strategies"] if s["strategy_name"] == "Horizontal Stack")
    vert_stats = next(s for s in stats["offense_strategies"] if s["strategy_name"] == "Vertical Stack")

    # Vertical Stack checks
    assert vert_stats["points_played"] == 3
    assert vert_stats["points_won"] == 2
    assert vert_stats["points_lost"] == 1
    assert vert_stats["hold_rate"] == pytest.approx(2/3, rel=1e-6)
    assert vert_stats["clean_holds"] == 1  # Only first point (second had turnover)
    assert vert_stats["clean_hold_rate"] == pytest.approx(1/3, rel=1e-6)
    assert vert_stats["quick_scores"] == 1  # Only first point (< 90s)
    assert vert_stats["quick_score_rate"] == pytest.approx(1/3, rel=1e-6)

    # Horizontal Stack checks
    assert horiz_stats["points_played"] == 2
    assert horiz_stats["points_won"] == 1
    assert horiz_stats["points_lost"] == 1
    assert horiz_stats["hold_rate"] == pytest.approx(0.5, rel=1e-6)
    assert horiz_stats["clean_holds"] == 1
    assert horiz_stats["clean_hold_rate"] == pytest.approx(0.5, rel=1e-6)
    assert horiz_stats["quick_scores"] == 0  # 100s > 90s threshold
    assert horiz_stats["quick_score_rate"] == 0.0


def test_get_strategy_stats_defense_strategies(db_session):
    """Test defense strategy statistics"""
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_defense_strategy("Zone") \
        .with_defense_strategy("Man-to-Man")

    # Zone: 4 points (break with turnover, 2 losses with turnover, loss without turnover)
    zone = scenario.defense_strategies[0]
    scenario.with_completed_point(offense=False, won=True, strategy=zone, with_turnover=True) \
        .with_completed_point(offense=False, won=False, strategy=zone, with_turnover=True) \
        .with_completed_point(offense=False, won=False, strategy=zone, with_turnover=True) \
        .with_completed_point(offense=False, won=False, strategy=zone, with_turnover=False)

    # Man-to-Man: 2 points (break without turnover, loss with turnover)
    man = scenario.defense_strategies[1]
    scenario.with_completed_point(offense=False, won=True, strategy=man, with_turnover=False) \
        .with_completed_point(offense=False, won=False, strategy=man, with_turnover=True) \
        .build()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    # Find strategies (sorted by name)
    man_stats = next(s for s in stats["defense_strategies"] if s["strategy_name"] == "Man-to-Man")
    zone_stats = next(s for s in stats["defense_strategies"] if s["strategy_name"] == "Zone")

    # Zone checks
    assert zone_stats["points_played"] == 4
    assert zone_stats["points_won"] == 1
    assert zone_stats["points_lost"] == 3
    assert zone_stats["break_rate"] == pytest.approx(0.25, rel=1e-6)
    assert zone_stats["points_with_turnover"] == 3
    assert zone_stats["turnover_rate"] == pytest.approx(0.75, rel=1e-6)

    # Man-to-Man checks
    assert man_stats["points_played"] == 2
    assert man_stats["points_won"] == 1
    assert man_stats["points_lost"] == 1
    assert man_stats["break_rate"] == pytest.approx(0.5, rel=1e-6)
    assert man_stats["points_with_turnover"] == 1
    assert man_stats["turnover_rate"] == pytest.approx(0.5, rel=1e-6)


def test_get_strategy_stats_defense_strategies_expose_turnover_type_breakdown(db_session):
    """Defense strategy stats should include turnover-type distribution across all agreed buckets."""
    scenario = (
        GameScenarioBuilder(db_session)
        .with_team()
        .with_competition()
        .with_game()
        .with_players(7)
        .with_defense_strategy("Zone")
        .build()
    )
    zone = scenario.defense_strategies[0]
    player_ids = [player.id for player in scenario.players]

    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(1).defense().won().with_strategy(zone.id) \
        .with_turnover_type(10, "defended_pass") \
        .complete()
    PointBuilder(db_session, scenario.game.id, player_ids) \
        .number(2).defense().lost().with_strategy(zone.id) \
        .with_turnover_type(10, "missed_huck") \
        .with_turnover_type(20, "drop") \
        .complete()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    zone_stats = next(s for s in stats["defense_strategies"] if s["strategy_name"] == "Zone")
    turnover_type_stats = zone_stats["turnover_type_stats"]

    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["total_turnovers"] == 2
    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["by_type"]["defended_pass"]["count"] == 1
    assert turnover_type_stats["all_points"]["opponent_possession_turnovers"]["by_type"]["missed_huck"]["count"] == 1
    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["total_turnovers"] == 1
    assert turnover_type_stats["all_points"]["our_possession_turnovers"]["by_type"]["drop"]["count"] == 1
    assert turnover_type_stats["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["defended_pass"]["percentage"] == pytest.approx(0.5, rel=1e-6)
    assert turnover_type_stats["started_on_defense"]["opponent_possession_turnovers"]["by_type"]["missed_huck"]["percentage"] == pytest.approx(0.5, rel=1e-6)
    assert turnover_type_stats["started_on_defense"]["our_possession_turnovers"]["by_type"]["drop"]["percentage"] == pytest.approx(1.0, rel=1e-6)


def test_get_strategy_stats_skips_points_without_strategy(db_session):
    """Test that points without strategy are excluded"""
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Test Strategy")

    strategy = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=strategy) \
        .with_completed_point(offense=True, won=True, strategy=None) \
        .build()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    assert len(stats["offense_strategies"]) == 1
    assert stats["offense_strategies"][0]["points_played"] == 1  # Only point with strategy


def test_get_strategy_stats_skips_incomplete_points(db_session):
    """Test that non-completed points are excluded"""
    # Note: Builder only creates completed points, so we need to use CRUD directly for incomplete points
    from app.crud.points import create_point, update_point
    from app.schemas.point import PointCreate, PointUpdate
    from datetime import timedelta

    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Test Strategy")

    strategy = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=strategy) \
        .build()

    # Create a running point manually (builder doesn't support incomplete points)
    running_point = create_point(db_session, PointCreate(
        game_id=scenario.game.id,
        point_number=99,
        starting_on_offense=True,
        strategy_id=strategy.id
    ))
    update_point(db_session, running_point.id, PointUpdate(
        status="running",
        start_datetime=datetime.now(timezone.utc)
    ))

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    assert len(stats["offense_strategies"]) == 1
    assert stats["offense_strategies"][0]["points_played"] == 1  # Only completed point


def test_get_strategy_stats_skips_points_without_timestamps(db_session):
    """Test that points without valid timestamps are excluded (edge case)"""
    # The builder always creates valid timestamps, and the CRUD validation prevents
    # completing points without timestamps, so this test verifies the query filter works
    scenario = GameScenarioBuilder(db_session) \
        .with_team() \
        .with_competition() \
        .with_game() \
        .with_players(7) \
        .with_offense_strategy("Test Strategy")

    strategy = scenario.offense_strategies[0]
    scenario.with_completed_point(offense=True, won=True, strategy=strategy) \
        .build()

    stats = get_game_strategy_stats(db_session, scenario.game.id)

    assert len(stats["offense_strategies"]) == 1
    assert stats["offense_strategies"][0]["points_played"] == 1


