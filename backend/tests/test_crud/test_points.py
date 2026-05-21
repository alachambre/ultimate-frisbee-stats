import pytest
from datetime import datetime, timedelta, timezone as tz
from app.crud import points
from app.schemas import PointCreate, PointUpdate, PointFinish, PointStatus
from app import models


def test_create_point(db_session, sample_game, sample_players):
    """Test creating a point and verify it's persisted in DB with all players"""
    player_ids = [p.id for p in sample_players]
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=player_ids
    )
    point = points.create_point(db_session, point_data)

    # Verify returned object
    assert point.id is not None
    assert point.game_id == sample_game.id
    assert point.point_number == 1
    assert point.starting_on_offense is True
    assert point.won is None  # Nullable while not completed
    assert point.status == models.PointStatusEnum.ready
    assert point.start_datetime is None  # Not set until transitioning to 'running'
    assert point.end_datetime is None
    assert len(point.players) == 7
    assert point.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_point = points.get_point(db_session, point.id)
    assert fetched_point is not None
    assert fetched_point.id == point.id
    assert fetched_point.game_id == sample_game.id
    assert fetched_point.point_number == 1
    assert fetched_point.status == models.PointStatusEnum.ready
    assert len(fetched_point.players) == 7
    # Verify all player IDs match
    fetched_player_ids = sorted([p.id for p in fetched_point.players])
    assert fetched_player_ids == sorted(player_ids)


def test_create_point_auto_increment_number(db_session, sample_game, sample_players):
    """Test that point numbers auto-increment"""
    player_ids = [p.id for p in sample_players]

    # Create and finish 3 points
    for i in range(3):
        point = points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=True,
                player_ids=player_ids
            )
        )
        assert point.point_number == i + 1

        # Transition to running, then finish the point so we can create another
        points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
        points.finish_point(
            db_session,
            point.id,
            PointFinish(won=(i % 2 == 0))
        )


def test_create_point_wrong_player_count(db_session, sample_game, sample_players):
    """Test that creating a point with wrong number of players is allowed during creation"""
    # Only 5 players instead of 7
    player_ids = [p.id for p in sample_players[:5]]

    # Now allowed - validation happens when completing the point
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=player_ids
    )
    point = points.create_point(db_session, point_data)
    assert point.id is not None
    assert len(point.players) == 5


def test_create_point_invalid_player_ids(db_session, sample_game):
    """Test that creating a point with non-existent players fails"""
    # Invalid player IDs
    player_ids = [999, 998, 997, 996, 995, 994, 993]

    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=player_ids
    )

    with pytest.raises(ValueError, match="Some player IDs not found"):
        points.create_point(db_session, point_data)


def test_get_point(db_session, sample_game, sample_players):
    """Test retrieving a point by ID"""
    player_ids = [p.id for p in sample_players]
    created_point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    point = points.get_point(db_session, created_point.id)

    assert point is not None
    assert point.id == created_point.id
    assert len(point.players) == 7


def test_get_point_not_found(db_session):
    """Test retrieving a non-existent point"""
    point = points.get_point(db_session, 999)
    assert point is None


def test_get_points_by_game(db_session, sample_game, sample_players):
    """Test listing all points for a game"""
    player_ids = [p.id for p in sample_players]

    # Create and finish 3 points
    for i in range(3):
        point = points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=(i % 2 == 0),
                player_ids=player_ids
            )
        )
        # Transition to running, then finish the point so we can create another
        points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
        points.finish_point(db_session, point.id, PointFinish(won=(i % 2 == 0)))

    game_points = points.get_points_by_game(db_session, sample_game.id)

    assert len(game_points) == 3
    # Points should be ordered by point_number descending (most recent first)
    assert game_points[0].point_number == 3
    assert game_points[1].point_number == 2
    assert game_points[2].point_number == 1


def test_get_points_by_game_empty(db_session, sample_game):
    """Test listing points for a game with no points"""
    game_points = points.get_points_by_game(db_session, sample_game.id)
    assert len(game_points) == 0


def test_update_point(db_session, sample_game, sample_players):
    """Test updating a point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running, then finish the point first
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Update the point
    update_data = PointUpdate(
        starting_on_offense=False,
        won=False,
        player_ids=None  # Keep same players
    )
    updated_point = points.update_point(db_session, point.id, update_data)

    assert updated_point is not None
    assert updated_point.id == point.id
    assert updated_point.starting_on_offense is False
    assert updated_point.won is False
    assert len(updated_point.players) == 7


def test_update_point_change_players(db_session, sample_game, sample_players):
    """Test updating point players"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Change player lineup (still 7 players, just different order) while active
    new_player_ids = list(reversed(player_ids))
    update_data = PointUpdate(
        starting_on_offense=True,
        player_ids=new_player_ids
    )
    updated_point = points.update_point(db_session, point.id, update_data)

    assert updated_point is not None
    assert len(updated_point.players) == 7
    # Verify players changed
    updated_player_ids = sorted([p.id for p in updated_point.players])
    assert updated_player_ids == sorted(new_player_ids)


def test_update_point_allows_partial_line_before_completion(
    db_session,
    sample_game,
    sample_players,
):
    """Test that editing a point line can temporarily use fewer than 7 players."""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    updated_point = points.update_point(
        db_session,
        point.id,
        PointUpdate(
            starting_on_offense=True,
            player_ids=player_ids[:5],
        ),
    )

    assert updated_point is not None
    assert len(updated_point.players) == 5


def test_finish_point_requires_exactly_seven_players(
    db_session,
    sample_game,
    sample_players,
):
    """Test that completion still enforces a full line."""
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=[player.id for player in sample_players[:5]],
        ),
    )
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))

    with pytest.raises(ValueError, match="must have exactly 7 players"):
        points.finish_point(db_session, point.id, PointFinish(won=True))


def test_update_point_not_found(db_session):
    """Test updating a non-existent point"""
    update_data = PointUpdate(starting_on_offense=False, won=False)
    updated_point = points.update_point(db_session, 999, update_data)

    assert updated_point is None


def test_delete_point(db_session, sample_game, sample_players):
    """Test deleting a point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )
    point_id = point.id

    # Delete the point
    success = points.delete_point(db_session, point_id)
    assert success is True

    # Verify it's deleted
    deleted_point = points.get_point(db_session, point_id)
    assert deleted_point is None


def test_delete_point_not_found(db_session):
    """Test deleting a non-existent point"""
    success = points.delete_point(db_session, 999)
    assert success is False


# ============================================
# Phase 3: Live Point Tracking Tests
# ============================================

def test_finish_point(db_session, sample_game, sample_players):
    """Test finishing a running point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    assert point.status == models.PointStatusEnum.ready
    assert point.won is None
    assert point.start_datetime is None

    # Transition to running status
    updated_point = points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))

    # Verify start_datetime was set during transition
    assert updated_point is not None
    assert updated_point.status == models.PointStatusEnum.running
    assert updated_point.start_datetime is not None

    # Finish the point
    finished_point = points.finish_point(
        db_session,
        point.id,
        PointFinish(won=True)
    )

    assert finished_point is not None
    assert finished_point.status == models.PointStatusEnum.completed
    assert finished_point.won is True
    assert finished_point.start_datetime is not None
    assert finished_point.end_datetime is not None
    assert finished_point.end_datetime > finished_point.start_datetime


def test_finish_point_with_custom_end_datetime(db_session, sample_game, sample_players):
    """Test finishing a point with custom end datetime"""
    player_ids = [p.id for p in sample_players]
    start_time = datetime.utcnow()
    end_time = start_time + timedelta(minutes=5)

    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running
    points.update_point(
        db_session,
        point.id,
        PointUpdate(status=PointStatus.running, start_datetime=start_time)
    )

    finished_point = points.finish_point(
        db_session,
        point.id,
        PointFinish(won=False, end_datetime=end_time)
    )

    assert finished_point.start_datetime == start_time
    assert finished_point.end_datetime == end_time
    assert finished_point.won is False


def test_finish_point_invalid_end_datetime(db_session, sample_game, sample_players):
    """Test finishing a point with end_datetime before start_datetime fails"""
    player_ids = [p.id for p in sample_players]
    start_time = datetime.utcnow()
    end_time = start_time - timedelta(minutes=5)  # End before start

    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running
    points.update_point(
        db_session,
        point.id,
        PointUpdate(status=PointStatus.running, start_datetime=start_time)
    )

    with pytest.raises(ValueError, match="end_datetime must be after start_datetime"):
        points.finish_point(
            db_session,
            point.id,
            PointFinish(won=True, end_datetime=end_time)
        )


def test_finish_point_not_running_or_scored(db_session, sample_game, sample_players):
    """Test finishing an already completed point fails"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running and finish the point
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Try to finish again
    with pytest.raises(ValueError, match="cannot be finished"):
        points.finish_point(db_session, point.id, PointFinish(won=False))


def test_finish_point_not_found(db_session):
    """Test finishing a non-existent point"""
    finished_point = points.finish_point(
        db_session,
        999,
        PointFinish(won=True)
    )
    assert finished_point is None


def test_get_running_point_for_game(db_session, sample_game, sample_players):
    """Test getting running point for a game"""
    player_ids = [p.id for p in sample_players]

    # No running point initially
    running_point = points.get_running_point_for_game(db_session, sample_game.id)
    assert running_point is None

    # Create a point (starts as ready)
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Still no running point (it's in ready status)
    running_point = points.get_running_point_for_game(db_session, sample_game.id)
    assert running_point is None

    # Transition to running
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))

    # Should now return the running point
    running_point = points.get_running_point_for_game(db_session, sample_game.id)
    assert running_point is not None
    assert running_point.id == point.id
    assert running_point.status == models.PointStatusEnum.running

    # Finish the point
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Should now return None
    running_point = points.get_running_point_for_game(db_session, sample_game.id)
    assert running_point is None


def test_cannot_create_multiple_running_points(db_session, sample_game, sample_players):
    """Test that only one running point can exist per game"""
    player_ids = [p.id for p in sample_players]

    # Create first point and transition to running
    point1 = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )
    points.update_point(db_session, point1.id, PointUpdate(status=PointStatus.running))

    # Try to create another point while first is running
    with pytest.raises(ValueError, match="already has a running point"):
        point2 = points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=False,
                player_ids=player_ids
            )
        )
        points.update_point(db_session, point2.id, PointUpdate(status=PointStatus.running))

    # Finish the first point
    points.finish_point(db_session, point1.id, PointFinish(won=True))

    # Now we should be able to create another and run it
    point2 = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=False,
            player_ids=player_ids
        )
    )
    assert point2.point_number == 2


def test_cancel_point_ready(db_session, sample_game, sample_players):
    """Test canceling a ready point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Cancel the point (still in ready status)
    success = points.cancel_point(db_session, point.id)
    assert success is True

    # Verify it's deleted
    deleted_point = points.get_point(db_session, point.id)
    assert deleted_point is None


def test_cancel_point_running(db_session, sample_game, sample_players):
    """Test canceling a running point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))

    # Cancel the running point
    success = points.cancel_point(db_session, point.id)
    assert success is True

    # Verify it's deleted
    deleted_point = points.get_point(db_session, point.id)
    assert deleted_point is None


def test_cancel_point_completed_fails(db_session, sample_game, sample_players):
    """Test that canceling a completed point fails"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running and finish the point
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Try to cancel completed point
    with pytest.raises(ValueError, match="Can only cancel ready or running points"):
        points.cancel_point(db_session, point.id)


def test_cancel_point_not_found(db_session):
    """Test canceling a non-existent point"""
    success = points.cancel_point(db_session, 999)
    assert success is False


def test_update_point_timestamps(db_session, sample_game, sample_players):
    """Test updating point timestamps"""
    player_ids = [p.id for p in sample_players]
    start_time = datetime.utcnow()

    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids,
            start_datetime=start_time
        )
    )

    # Transition to running and finish the point
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Update timestamps
    new_start = start_time - timedelta(minutes=1)
    new_end = start_time + timedelta(minutes=6)

    updated_point = points.update_point(
        db_session,
        point.id,
        PointUpdate(
            start_datetime=new_start,
            end_datetime=new_end
        )
    )

    assert updated_point.start_datetime == new_start
    assert updated_point.end_datetime == new_end


def test_update_point_invalid_timestamps(db_session, sample_game, sample_players):
    """Test updating point with invalid timestamps fails"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running and finish the point
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Try to update with end before start
    start_time = datetime.utcnow()
    end_time = start_time - timedelta(minutes=5)

    with pytest.raises(ValueError, match="end_datetime must be after start_datetime"):
        points.update_point(
            db_session,
            point.id,
            PointUpdate(
                start_datetime=start_time,
                end_datetime=end_time
            )
        )


# ============================================
# Phase 6: Enhanced Point Model Tests
# ============================================

def test_create_point_with_strategy(db_session, sample_game, sample_players, sample_strategy):
    """Test creating a point with a strategy"""
    player_ids = [p.id for p in sample_players]
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        strategy_id=sample_strategy.id,
        player_ids=player_ids
    )
    point = points.create_point(db_session, point_data)

    assert point.strategy_id == sample_strategy.id
    assert point.strategy is not None
    assert point.strategy.name == sample_strategy.name


def test_create_point_with_optional_field_metadata(db_session, sample_game, sample_players, sample_strategy):
    """Test creating a point with optional field metadata (field_side, pull, strategy, comments)"""
    player_ids = [p.id for p in sample_players]
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        field_side="home",
        pull=True,
        strategy_id=sample_strategy.id,
        comments="Opening point strategy",
        player_ids=player_ids
    )
    point = points.create_point(db_session, point_data)

    assert point.field_side == "home"
    assert point.pull is True
    assert point.strategy_id == sample_strategy.id
    assert point.comments == "Opening point strategy"


def test_create_point_with_invalid_strategy(db_session, sample_game, sample_players):
    """Test creating a point with non-existent strategy fails"""
    player_ids = [p.id for p in sample_players]
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        strategy_id=999,  # Non-existent
        player_ids=player_ids
    )

    with pytest.raises(ValueError, match="Strategy.*not found"):
        points.create_point(db_session, point_data)


def test_update_point_optional_field_metadata(db_session, sample_game, sample_players, sample_strategy):
    """Test updating a point with optional field metadata (field_side, pull, strategy, comments)"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Update with new fields
    update_data = PointUpdate(
        field_side="away",
        pull=False,
        strategy_id=sample_strategy.id,
        comments="Switched to zone defense"
    )
    updated_point = points.update_point(db_session, point.id, update_data)

    assert updated_point.field_side == "away"
    assert updated_point.pull is False
    assert updated_point.strategy_id == sample_strategy.id
    assert updated_point.comments == "Switched to zone defense"


def test_finish_point_with_comments(db_session, sample_game, sample_players):
    """Test finishing a point with comments"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Transition to running
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))

    # Finish with comments
    finished_point = points.finish_point(
        db_session,
        point.id,
        PointFinish(won=True, comments="Great teamwork on this point!")
    )

    assert finished_point.comments == "Great teamwork on this point!"
    assert finished_point.won is True


def test_point_status_transitions(db_session, sample_game, sample_players):
    """Test 4-status lifecycle transitions"""
    player_ids = [p.id for p in sample_players]

    # Create point (starts as ready)
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )
    assert point.status == models.PointStatusEnum.ready

    # Transition to running
    point = points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    assert point.status == models.PointStatusEnum.running

    # Transition to scored
    point = points.update_point(db_session, point.id, PointUpdate(status=PointStatus.scored))
    assert point.status == models.PointStatusEnum.scored

    # Finish to completed
    point = points.finish_point(db_session, point.id, PointFinish(won=True))
    assert point.status == models.PointStatusEnum.completed


def test_resume_scored_point_allows_running(db_session, sample_game, sample_players):
    """Scored points can resume to running (clears won/end_datetime)."""
    player_ids = [p.id for p in sample_players]

    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    point = points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    point = points.update_point(
        db_session,
        point.id,
        PointUpdate(
            status=PointStatus.scored,
            won=True,
            end_datetime=point.start_datetime + timedelta(seconds=1),
        )
    )
    assert point.status == models.PointStatusEnum.scored
    assert point.won is True
    assert point.end_datetime is not None

    resumed = points.update_point(
        db_session,
        point.id,
        PointUpdate(
            status=PointStatus.running,
            won=None,
            end_datetime=None,
        )
    )

    assert resumed.status == models.PointStatusEnum.running
    assert resumed.won is None
    assert resumed.end_datetime is None


def test_strategy_deletion_sets_null(db_session, sample_game, sample_players, sample_strategy):
    """Test that deleting a strategy sets strategy_id to NULL on points"""
    from app.crud import delete_strategy

    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            strategy_id=sample_strategy.id,
            player_ids=player_ids
        )
    )
    assert point.strategy_id == sample_strategy.id

    # Delete strategy
    delete_strategy(db_session, sample_strategy.id)

    # Reload point
    db_session.expire(point)
    updated_point = points.get_point(db_session, point.id)
    assert updated_point.strategy_id is None

def test_recreate_first_running_point_resets_game_start_time(db_session, sample_game, sample_players):
    """Deleting the only running point resets game start time; launching again sets a new one."""
    from app.crud import games
    
    player_ids = [p.id for p in sample_players[:7]]
    
    # Initially, game has no start_datetime
    assert sample_game.start_datetime is None
    
    # Create first point in ready status - game chrono should not start yet.
    first_point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    game_with_ready_point = games.get_game(db_session, sample_game.id)
    assert game_with_ready_point.start_datetime is None

    # Launch first pull (ready -> running) to start game chrono.
    points.update_point(db_session, first_point.id, PointUpdate(status=PointStatus.running))
    
    # Get game and verify start_datetime is set
    game_after_first_point = games.get_game(db_session, sample_game.id)
    assert game_after_first_point.start_datetime is not None
    first_start_time = game_after_first_point.start_datetime
    
    # Delete the only point - game's start_datetime should reset to None
    points.delete_point(db_session, first_point.id)
    
    game_after_delete = games.get_game(db_session, sample_game.id)
    assert game_after_delete.start_datetime is None
    
    # Create another first point in ready status (chrono still stopped).
    second_point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=False,
            player_ids=player_ids
        )
    )

    game_with_second_ready_point = games.get_game(db_session, sample_game.id)
    assert game_with_second_ready_point.start_datetime is None

    # Launch first pull again.
    points.update_point(db_session, second_point.id, PointUpdate(status=PointStatus.running))
    
    # Get game and verify start_datetime is set to a new value
    game_after_second_point = games.get_game(db_session, sample_game.id)
    assert game_after_second_point.start_datetime is not None
    second_start_time = game_after_second_point.start_datetime
    
    # The new start time should be different (later) than the first
    assert second_start_time >= first_start_time
