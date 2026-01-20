import pytest
from app.crud import players
from app.schemas import PlayerCreate, PlayerUpdate, Gender


def test_create_player(db_session, sample_team):
    """Test creating a player and verify it's persisted in DB"""
    player_data = PlayerCreate(team_id=sample_team.id, name="Alice", number=7, gender=Gender.W)
    player = players.create_player(db_session, player_data)

    # Verify returned object
    assert player.id is not None
    assert player.team_id == sample_team.id
    assert player.name == "Alice"
    assert player.number == 7
    assert player.gender.value == Gender.W.value
    assert player.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_player = players.get_player(db_session, player.id)
    assert fetched_player is not None
    assert fetched_player.id == player.id
    assert fetched_player.name == "Alice"
    assert fetched_player.number == 7
    assert fetched_player.gender.value == Gender.W.value


def test_create_player_without_number(db_session, sample_team):
    """Test creating a player without a jersey number"""
    player_data = PlayerCreate(team_id=sample_team.id, name="Bob", number=None, gender=Gender.M)
    player = players.create_player(db_session, player_data)

    assert player.id is not None
    assert player.name == "Bob"
    assert player.number is None
    assert player.gender.value == Gender.M.value


def test_get_player(db_session, sample_players):
    """Test retrieving a player by ID"""
    player = players.get_player(db_session, sample_players[0].id)

    assert player is not None
    assert player.id == sample_players[0].id
    assert player.name == sample_players[0].name


def test_get_player_not_found(db_session):
    """Test retrieving a non-existent player"""
    player = players.get_player(db_session, 999)
    assert player is None


def test_get_players_by_team(db_session, sample_team, sample_players):
    """Test listing all players for a team"""
    team_players = players.get_players_by_team(db_session, sample_team.id)

    assert len(team_players) == 7
    for i, player in enumerate(team_players, 1):
        assert player.team_id == sample_team.id
        assert player.name == f"Player {i}"
        assert player.number == i


def test_get_players_by_team_empty(db_session, sample_team):
    """Test listing players for a team with no players"""
    team_players = players.get_players_by_team(db_session, sample_team.id)
    assert len(team_players) == 0


def test_update_player(db_session, sample_players):
    """Test updating a player and verify changes are persisted"""
    player = sample_players[0]
    update_data = PlayerUpdate(name="Updated Name", number=99)
    updated_player = players.update_player(db_session, player.id, update_data)

    assert updated_player is not None
    assert updated_player.id == player.id
    assert updated_player.name == "Updated Name"
    assert updated_player.number == 99

    # Explicitly verify the update was persisted with a fresh query
    fetched_player = players.get_player(db_session, player.id)
    assert fetched_player.name == "Updated Name"
    assert fetched_player.number == 99


def test_update_player_not_found(db_session):
    """Test updating a non-existent player"""
    update_data = PlayerUpdate(name="Updated Name", number=42)
    updated_player = players.update_player(db_session, 999, update_data)

    assert updated_player is None


def test_delete_player(db_session, sample_players):
    """Test deleting a player"""
    player = sample_players[0]
    player_id = player.id

    # Delete the player
    success = players.delete_player(db_session, player_id)
    assert success is True

    # Verify it's deleted
    deleted_player = players.get_player(db_session, player_id)
    assert deleted_player is None


def test_delete_player_not_found(db_session):
    """Test deleting a non-existent player"""
    success = players.delete_player(db_session, 999)
    assert success is False
