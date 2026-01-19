import pytest
from datetime import datetime, timedelta
from app.crud import points
from app.schemas import PointCreate, PointUpdate, PointFinish


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
    assert point.won is None  # Nullable while active
    assert point.status == "active"
    assert point.start_datetime is not None
    assert point.end_datetime is None
    assert len(point.players) == 7
    assert point.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_point = points.get_point(db_session, point.id)
    assert fetched_point is not None
    assert fetched_point.id == point.id
    assert fetched_point.game_id == sample_game.id
    assert fetched_point.point_number == 1
    assert fetched_point.status == "active"
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

        # Finish the point so we can create another
        points.finish_point(
            db_session,
            point.id,
            PointFinish(won=(i % 2 == 0))
        )


def test_create_point_wrong_player_count(db_session, sample_game, sample_players):
    """Test that creating a point with wrong number of players fails"""
    from pydantic import ValidationError

    # Only 5 players instead of 7
    player_ids = [p.id for p in sample_players[:5]]

    # Pydantic validates this before it reaches the database
    with pytest.raises(ValidationError):
        point_data = PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )


def test_create_point_invalid_player_ids(db_session, sample_game):
    """Test that creating a point with non-existent players fails"""
    # Invalid player IDs
    player_ids = [999, 998, 997, 996, 995, 994, 993]

    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=player_ids
    )

    with pytest.raises(ValueError, match="Expected 7 players"):
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
        # Finish the point so we can create another
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

    # Finish the point first
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


def test_update_point_wrong_player_count(db_session, sample_game, sample_players):
    """Test that updating with wrong number of players fails"""
    from pydantic import ValidationError

    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Try to update with only 5 players - Pydantic validates this
    with pytest.raises(ValidationError):
        update_data = PointUpdate(
            starting_on_offense=True,
            player_ids=player_ids[:5]
        )


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
    """Test finishing an active point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    assert point.status == "active"
    assert point.won is None

    # Finish the point
    finished_point = points.finish_point(
        db_session,
        point.id,
        PointFinish(won=True)
    )

    assert finished_point is not None
    assert finished_point.status == "completed"
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
            player_ids=player_ids,
            start_datetime=start_time
        )
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
            player_ids=player_ids,
            start_datetime=start_time
        )
    )

    with pytest.raises(ValueError, match="end_datetime must be after start_datetime"):
        points.finish_point(
            db_session,
            point.id,
            PointFinish(won=True, end_datetime=end_time)
        )


def test_finish_point_not_active(db_session, sample_game, sample_players):
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

    # Finish the point
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Try to finish again
    with pytest.raises(ValueError, match="not active"):
        points.finish_point(db_session, point.id, PointFinish(won=False))


def test_finish_point_not_found(db_session):
    """Test finishing a non-existent point"""
    finished_point = points.finish_point(
        db_session,
        999,
        PointFinish(won=True)
    )
    assert finished_point is None


def test_get_active_point_for_game(db_session, sample_game, sample_players):
    """Test getting active point for a game"""
    player_ids = [p.id for p in sample_players]

    # No active point initially
    active_point = points.get_active_point_for_game(db_session, sample_game.id)
    assert active_point is None

    # Create a point
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Should now return the active point
    active_point = points.get_active_point_for_game(db_session, sample_game.id)
    assert active_point is not None
    assert active_point.id == point.id
    assert active_point.status == "active"

    # Finish the point
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Should now return None
    active_point = points.get_active_point_for_game(db_session, sample_game.id)
    assert active_point is None


def test_cannot_create_multiple_active_points(db_session, sample_game, sample_players):
    """Test that only one active point can exist per game"""
    player_ids = [p.id for p in sample_players]

    # Create first point
    point1 = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Try to create another point without finishing the first
    with pytest.raises(ValueError, match="already has an active point"):
        points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=False,
                player_ids=player_ids
            )
        )

    # Finish the first point
    points.finish_point(db_session, point1.id, PointFinish(won=True))

    # Now we should be able to create another
    point2 = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=False,
            player_ids=player_ids
        )
    )
    assert point2.point_number == 2


def test_cancel_point(db_session, sample_game, sample_players):
    """Test canceling an active point"""
    player_ids = [p.id for p in sample_players]
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )

    # Cancel the point
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

    # Finish the point
    points.finish_point(db_session, point.id, PointFinish(won=True))

    # Try to cancel completed point
    with pytest.raises(ValueError, match="Can only cancel active points"):
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

    # Finish the point
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

    # Finish the point
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
