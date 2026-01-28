import pytest
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app import crud, schemas, models


def test_create_turnover_with_player(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test creating a turnover with a player assigned."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Drop"
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    assert turnover.id is not None
    assert turnover.point_id == sample_point.id
    assert turnover.player_id == sample_player.id
    # SQLite returns naive datetime, compare by replacing tzinfo
    assert turnover.timestamp.replace(tzinfo=timezone.utc) == turnover_data.timestamp
    assert turnover.comments == "Drop"
    assert turnover.created_at is not None


def test_create_turnover_without_player(db_session: Session, sample_point: models.Point):
    """Test creating a turnover without a player (player_id=None)."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=None,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Team turnover"
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    assert turnover.id is not None
    assert turnover.point_id == sample_point.id
    assert turnover.player_id is None
    assert turnover.comments == "Team turnover"


def test_create_turnover_invalid_point(db_session: Session):
    """Test creating a turnover with invalid point raises ValueError."""
    turnover_data = schemas.TurnoverCreate(
        point_id=99999,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )

    with pytest.raises(ValueError, match="Point with ID 99999 not found"):
        crud.create_turnover(db_session, turnover_data)


def test_create_turnover_invalid_player(db_session: Session, sample_point: models.Point):
    """Test creating a turnover with invalid player raises ValueError."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=99999,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )

    with pytest.raises(ValueError, match="Player with ID 99999 not found"):
        crud.create_turnover(db_session, turnover_data)


def test_get_turnover(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test retrieving a turnover by ID with player relationship loaded."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    created_turnover = crud.create_turnover(db_session, turnover_data)

    retrieved_turnover = crud.get_turnover(db_session, created_turnover.id)

    assert retrieved_turnover is not None
    assert retrieved_turnover.id == created_turnover.id
    assert retrieved_turnover.point_id == sample_point.id
    assert retrieved_turnover.player_id == sample_player.id
    # Verify player relationship is loaded
    assert retrieved_turnover.player is not None
    assert retrieved_turnover.player.id == sample_player.id


def test_get_turnover_not_found(db_session: Session):
    """Test retrieving a non-existent turnover returns None."""
    turnover = crud.get_turnover(db_session, 99999)
    assert turnover is None


def test_get_turnovers_by_point(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test retrieving all turnovers for a point, ordered by timestamp."""
    # Create multiple turnovers
    turnover1_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="First turnover"
    )
    turnover2_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=None,
        timestamp=datetime(2024, 1, 15, 10, 10, 0, tzinfo=timezone.utc),
        comments="Second turnover"
    )
    turnover3_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 7, 0, tzinfo=timezone.utc),
        comments="Third turnover (middle time)"
    )

    crud.create_turnover(db_session, turnover1_data)
    crud.create_turnover(db_session, turnover2_data)
    crud.create_turnover(db_session, turnover3_data)

    turnovers = crud.get_turnovers_by_point(db_session, sample_point.id)

    assert len(turnovers) == 3
    # Should be ordered by timestamp
    assert turnovers[0].comments == "First turnover"
    assert turnovers[1].comments == "Third turnover (middle time)"
    assert turnovers[2].comments == "Second turnover"
    # Verify player relationship is loaded
    assert turnovers[0].player is not None


def test_get_turnovers_by_point_empty(db_session: Session, sample_point: models.Point):
    """Test retrieving turnovers for a point with no turnovers."""
    turnovers = crud.get_turnovers_by_point(db_session, sample_point.id)
    assert len(turnovers) == 0


def test_get_turnovers_by_player(db_session: Session, sample_point: models.Point, sample_player: models.Player, sample_team: models.Team):
    """Test retrieving all turnovers for a specific player."""
    # Create another player
    player2_data = schemas.PlayerCreate(
        team_id=sample_team.id,
        name="Player 2",
        gender=schemas.Gender.M
    )
    player2 = crud.create_player(db_session, player2_data)

    # Create turnovers for both players
    turnover1_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover2_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=player2.id,
        timestamp=datetime(2024, 1, 15, 10, 10, 0, tzinfo=timezone.utc),
    )
    turnover3_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 15, 0, tzinfo=timezone.utc),
    )

    crud.create_turnover(db_session, turnover1_data)
    crud.create_turnover(db_session, turnover2_data)
    crud.create_turnover(db_session, turnover3_data)

    turnovers = crud.get_turnovers_by_player(db_session, sample_player.id)

    assert len(turnovers) == 2
    assert all(t.player_id == sample_player.id for t in turnovers)
    # Should be ordered by timestamp descending (most recent first)
    assert turnovers[0].timestamp > turnovers[1].timestamp


def test_update_turnover_change_player(db_session: Session, sample_point: models.Point, sample_player: models.Player, sample_team: models.Team):
    """Test updating a turnover to change the player."""
    # Create another player
    player2_data = schemas.PlayerCreate(
        team_id=sample_team.id,
        name="Player 2",
        gender=schemas.Gender.M
    )
    player2 = crud.create_player(db_session, player2_data)

    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = schemas.TurnoverUpdate(player_id=player2.id)
    updated_turnover = crud.update_turnover(db_session, turnover.id, update_data)

    assert updated_turnover is not None
    assert updated_turnover.player_id == player2.id


def test_update_turnover_change_timestamp(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test updating a turnover's timestamp."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    new_timestamp = datetime(2024, 1, 15, 10, 6, 30, tzinfo=timezone.utc)
    update_data = schemas.TurnoverUpdate(timestamp=new_timestamp)
    updated_turnover = crud.update_turnover(db_session, turnover.id, update_data)

    assert updated_turnover is not None
    # SQLite returns naive datetime, compare by replacing tzinfo
    assert updated_turnover.timestamp.replace(tzinfo=timezone.utc) == new_timestamp


def test_update_turnover_change_comments(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test updating a turnover's comments."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Initial comment"
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = schemas.TurnoverUpdate(comments="Updated comment")
    updated_turnover = crud.update_turnover(db_session, turnover.id, update_data)

    assert updated_turnover is not None
    assert updated_turnover.comments == "Updated comment"


def test_update_turnover_invalid_player(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test updating a turnover with invalid player raises ValueError."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    update_data = schemas.TurnoverUpdate(player_id=99999)

    with pytest.raises(ValueError, match="Player with ID 99999 not found"):
        crud.update_turnover(db_session, turnover.id, update_data)


def test_update_turnover_not_found(db_session: Session):
    """Test updating a non-existent turnover returns None."""
    update_data = schemas.TurnoverUpdate(comments="New comment")
    result = crud.update_turnover(db_session, 99999, update_data)
    assert result is None


def test_delete_turnover(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test deleting a turnover."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    success = crud.delete_turnover(db_session, turnover.id)
    assert success is True

    # Verify it's deleted
    deleted_turnover = crud.get_turnover(db_session, turnover.id)
    assert deleted_turnover is None


def test_delete_turnover_not_found(db_session: Session):
    """Test deleting a non-existent turnover returns False."""
    success = crud.delete_turnover(db_session, 99999)
    assert success is False


def test_cascade_delete_point_deletes_turnovers(db_session: Session, sample_game: models.Game, sample_player: models.Player, sample_players):
    """Test that deleting a point cascades to delete its turnovers."""
    # Create a point
    player_ids = [p.id for p in sample_players]
    point_data = schemas.PointCreate(
        game_id=sample_game.id,
        point_number=1,
        starting_on_offense=True,
        player_ids=player_ids
    )
    point = crud.create_point(db_session, point_data)

    # Create turnovers for the point
    turnover_data = schemas.TurnoverCreate(
        point_id=point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    # Delete the point
    crud.delete_point(db_session, point.id)

    # Verify the turnover is also deleted
    deleted_turnover = crud.get_turnover(db_session, turnover.id)
    assert deleted_turnover is None


def test_set_null_player_deletes_player_keeps_turnover(db_session: Session, sample_point: models.Point, sample_player: models.Player):
    """Test that deleting a player sets player_id to NULL but keeps the turnover."""
    turnover_data = schemas.TurnoverCreate(
        point_id=sample_point.id,
        player_id=sample_player.id,
        timestamp=datetime(2024, 1, 15, 10, 5, 0, tzinfo=timezone.utc),
        comments="Player turnover"
    )
    turnover = crud.create_turnover(db_session, turnover_data)

    # Delete the player
    crud.delete_player(db_session, sample_player.id)

    # Verify the turnover still exists but player_id is NULL
    remaining_turnover = crud.get_turnover(db_session, turnover.id)
    assert remaining_turnover is not None
    assert remaining_turnover.player_id is None
    assert remaining_turnover.comments == "Player turnover"
