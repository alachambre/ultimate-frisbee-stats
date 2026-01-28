import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app import crud, schemas, models


def test_create_call_valid(db_session: Session, sample_point: models.Point):
    """Test creating a call with valid point."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Foul discussion"
    )
    call = crud.create_call(db_session, call_data)

    assert call.id is not None
    assert call.point_id == sample_point.id
    # SQLite returns naive datetime, compare by replacing tzinfo
    assert call.call_timestamp.replace(tzinfo=timezone.utc) == call_data.call_timestamp
    assert call.resume_timestamp is None
    assert call.comments == "Foul discussion"
    assert call.created_at is not None


def test_create_call_with_resume(db_session: Session, sample_point: models.Point):
    """Test creating a call with both call and resume timestamps."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 15, 10, 1, 30, tzinfo=timezone.utc),
    )
    call = crud.create_call(db_session, call_data)

    assert call.id is not None
    # SQLite returns naive datetime, compare by replacing tzinfo
    assert call.resume_timestamp.replace(tzinfo=timezone.utc) == call_data.resume_timestamp


def test_create_call_invalid_point(db_session: Session):
    """Test creating a call with invalid point raises ValueError."""
    call_data = schemas.CallCreate(
        point_id=99999,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )

    with pytest.raises(ValueError, match="Point with ID 99999 not found"):
        crud.create_call(db_session, call_data)


def test_create_call_invalid_timestamps(db_session: Session, sample_point: models.Point):
    """Test creating a call with resume before call raises ValueError."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        resume_timestamp=datetime(2024, 1, 15, 9, 59, 0, tzinfo=timezone.utc),  # Before call
    )

    with pytest.raises(ValueError, match="resume_timestamp must be after call_timestamp"):
        crud.create_call(db_session, call_data)


def test_get_call(db_session: Session, sample_point: models.Point):
    """Test retrieving a call by ID."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    created_call = crud.create_call(db_session, call_data)

    retrieved_call = crud.get_call(db_session, created_call.id)

    assert retrieved_call is not None
    assert retrieved_call.id == created_call.id
    assert retrieved_call.point_id == sample_point.id


def test_get_call_not_found(db_session: Session):
    """Test retrieving a non-existent call returns None."""
    call = crud.get_call(db_session, 99999)
    assert call is None


def test_get_calls_by_point(db_session: Session, sample_point: models.Point):
    """Test retrieving all calls for a point, ordered by timestamp."""
    # Create multiple calls
    call1_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="First call"
    )
    call2_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Second call"
    )
    call3_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 2, 0, tzinfo=timezone.utc),
        comments="Third call (middle time)"
    )

    crud.create_call(db_session, call1_data)
    crud.create_call(db_session, call2_data)
    crud.create_call(db_session, call3_data)

    calls = crud.get_calls_by_point(db_session, sample_point.id)

    assert len(calls) == 3
    # Should be ordered by timestamp
    assert calls[0].comments == "First call"
    assert calls[1].comments == "Third call (middle time)"
    assert calls[2].comments == "Second call"


def test_get_calls_by_point_empty(db_session: Session, sample_point: models.Point):
    """Test retrieving calls for a point with no calls."""
    calls = crud.get_calls_by_point(db_session, sample_point.id)
    assert len(calls) == 0


def test_update_call_set_resume(db_session: Session, sample_point: models.Point):
    """Test updating a call to set resume_timestamp."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    call = crud.create_call(db_session, call_data)

    update_data = schemas.CallUpdate(
        resume_timestamp=datetime(2024, 1, 15, 10, 1, 30, tzinfo=timezone.utc)
    )
    updated_call = crud.update_call(db_session, call.id, update_data)

    assert updated_call is not None
    # SQLite returns naive datetime, compare by replacing tzinfo
    assert updated_call.resume_timestamp.replace(tzinfo=timezone.utc) == update_data.resume_timestamp


def test_update_call_set_comments(db_session: Session, sample_point: models.Point):
    """Test updating a call's comments."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
        comments="Initial comment"
    )
    call = crud.create_call(db_session, call_data)

    update_data = schemas.CallUpdate(comments="Updated comment")
    updated_call = crud.update_call(db_session, call.id, update_data)

    assert updated_call is not None
    assert updated_call.comments == "Updated comment"


def test_update_call_invalid_timestamp(db_session: Session, sample_point: models.Point):
    """Test updating a call with invalid resume timestamp raises ValueError."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    call = crud.create_call(db_session, call_data)

    # Use naive datetime to match what's stored in SQLite
    update_data = schemas.CallUpdate(
        resume_timestamp=datetime(2024, 1, 15, 9, 59, 0)  # Before call
    )

    with pytest.raises(ValueError, match="resume_timestamp must be after call_timestamp"):
        crud.update_call(db_session, call.id, update_data)


def test_update_call_not_found(db_session: Session):
    """Test updating a non-existent call returns None."""
    update_data = schemas.CallUpdate(comments="New comment")
    result = crud.update_call(db_session, 99999, update_data)
    assert result is None


def test_delete_call(db_session: Session, sample_point: models.Point):
    """Test deleting a call."""
    call_data = schemas.CallCreate(
        point_id=sample_point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    call = crud.create_call(db_session, call_data)

    success = crud.delete_call(db_session, call.id)
    assert success is True

    # Verify it's deleted
    deleted_call = crud.get_call(db_session, call.id)
    assert deleted_call is None


def test_delete_call_not_found(db_session: Session):
    """Test deleting a non-existent call returns False."""
    success = crud.delete_call(db_session, 99999)
    assert success is False


def test_cascade_delete_point_deletes_calls(db_session: Session, sample_game: models.Game, sample_players):
    """Test that deleting a point cascades to delete its calls."""
    # Create a point
    player_ids = [p.id for p in sample_players]
    point_data = schemas.PointCreate(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        player_ids=player_ids
    )
    point = crud.create_point(db_session, point_data)

    # Create calls for the point
    call_data = schemas.CallCreate(
        point_id=point.id,
        call_timestamp=datetime(2024, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
    )
    call = crud.create_call(db_session, call_data)

    # Delete the point
    crud.delete_point(db_session, point.id)

    # Verify the call is also deleted
    deleted_call = crud.get_call(db_session, call.id)
    assert deleted_call is None
