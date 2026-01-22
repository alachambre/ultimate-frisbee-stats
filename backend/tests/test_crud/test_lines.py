"""
Tests for Line CRUD operations
"""
import pytest
from app import crud, schemas, models
from app.schemas import Gender


def test_create_line_basic(db_session, sample_team):
    """Test creating a basic line"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        description="Main offensive line",
    )

    line = crud.create_line(db_session, line_data)

    assert line.id is not None
    assert line.name == "O-Line"
    assert line.description == "Main offensive line"
    assert line.team_id == sample_team.id
    assert line.created_at is not None


def test_create_line_with_players(db_session, sample_team, sample_players):
    """Test creating a line with initial players"""
    player_ids = [p.id for p in sample_players[:5]]

    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="D-Line",
        description="Defensive specialists",
        player_ids=player_ids,
    )

    line = crud.create_line(db_session, line_data)

    assert len(line.players) == 5
    assert all(p.id in player_ids for p in line.players)
    assert all(p.team_id == sample_team.id for p in line.players)


def test_create_line_minimal(db_session, sample_team):
    """Test creating a line with minimal fields (no description)"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="Mixed Line",
    )

    line = crud.create_line(db_session, line_data)

    assert line.id is not None
    assert line.name == "Mixed Line"
    assert line.description is None
    assert line.team_id == sample_team.id


def test_create_line_duplicate_name_per_team(db_session, sample_team):
    """Test that duplicate line names within same team raise error"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
    )

    crud.create_line(db_session, line_data)

    # Try to create another line with same name on same team
    with pytest.raises(Exception):  # SQLAlchemy IntegrityError
        crud.create_line(db_session, line_data)


def test_create_line_duplicate_name_across_teams(db_session, sample_team):
    """Test that duplicate line names across different teams is allowed"""
    team2 = crud.create_team(db_session, schemas.TeamCreate(name="Team 2"))

    line1_data = schemas.LineCreate(team_id=sample_team.id, name="O-Line")
    line2_data = schemas.LineCreate(team_id=team2.id, name="O-Line")

    line1 = crud.create_line(db_session, line1_data)
    line2 = crud.create_line(db_session, line2_data)

    assert line1.name == line2.name
    assert line1.team_id != line2.team_id


def test_get_line_found(db_session, sample_team):
    """Test retrieving a line by ID"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
    )
    created_line = crud.create_line(db_session, line_data)

    line = crud.get_line(db_session, created_line.id)

    assert line is not None
    assert line.id == created_line.id
    assert line.name == created_line.name


def test_get_line_not_found(db_session):
    """Test retrieving non-existent line returns None"""
    line = crud.get_line(db_session, 9999)
    assert line is None


def test_get_line_includes_players_relationship(db_session, sample_team, sample_players):
    """Test that get_line returns line with players relationship loaded"""
    player_ids = [p.id for p in sample_players[:3]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="Mixed Line",
        player_ids=player_ids,
    )
    created_line = crud.create_line(db_session, line_data)

    line = crud.get_line(db_session, created_line.id)

    assert len(line.players) == 3
    assert all(p.id in player_ids for p in line.players)


def test_get_lines_all(db_session, sample_team):
    """Test retrieving all lines"""
    # Create multiple lines
    for i in range(3):
        crud.create_line(
            db_session,
            schemas.LineCreate(
                team_id=sample_team.id,
                name=f"Line {i}",
            ),
        )

    lines = crud.get_lines(db_session)
    assert len(lines) >= 3


def test_get_lines_by_team_filter(db_session, sample_team):
    """Test filtering lines by team"""
    team2 = crud.create_team(db_session, schemas.TeamCreate(name="Team 2"))

    # Create lines for both teams
    crud.create_line(
        db_session,
        schemas.LineCreate(team_id=sample_team.id, name="Team 1 O-Line"),
    )
    crud.create_line(
        db_session,
        schemas.LineCreate(team_id=team2.id, name="Team 2 O-Line"),
    )

    team1_lines = crud.get_lines(db_session, team_id=sample_team.id)
    assert all(line.team_id == sample_team.id for line in team1_lines)
    assert len(team1_lines) >= 1


def test_get_lines_empty_database(db_session):
    """Test getting lines when database is empty"""
    lines = crud.get_lines(db_session)
    assert lines == []


def test_get_lines_pagination(db_session, sample_team):
    """Test pagination with skip and limit"""
    # Create 10 lines
    for i in range(10):
        crud.create_line(
            db_session,
            schemas.LineCreate(team_id=sample_team.id, name=f"Line {i}"),
        )

    # Get first 5
    first_page = crud.get_lines(db_session, skip=0, limit=5)
    assert len(first_page) == 5

    # Get next 5
    second_page = crud.get_lines(db_session, skip=5, limit=5)
    assert len(second_page) == 5

    # Ensure they're different
    first_ids = {line.id for line in first_page}
    second_ids = {line.id for line in second_page}
    assert first_ids.isdisjoint(second_ids)


def test_update_line_full(db_session, sample_team):
    """Test full update of line fields"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        description="Original description",
    )
    line = crud.create_line(db_session, line_data)

    update_data = schemas.LineUpdate(
        name="Updated O-Line",
        description="Updated description",
    )

    updated = crud.update_line(db_session, line.id, update_data)

    assert updated.name == "Updated O-Line"
    assert updated.description == "Updated description"


def test_update_line_partial(db_session, sample_team):
    """Test partial update of line"""
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="D-Line",
        description="Original",
    )
    line = crud.create_line(db_session, line_data)
    original_name = line.name

    update_data = schemas.LineUpdate(description="Updated only description")
    updated = crud.update_line(db_session, line.id, update_data)

    assert updated.name == original_name  # Name unchanged
    assert updated.description == "Updated only description"


def test_update_line_not_found(db_session):
    """Test updating non-existent line returns None"""
    update_data = schemas.LineUpdate(name="New Name")
    updated = crud.update_line(db_session, 9999, update_data)
    assert updated is None


def test_update_line_duplicate_name_constraint(db_session, sample_team):
    """Test that updating to duplicate name within same team raises error"""
    # Create two lines
    line1 = crud.create_line(
        db_session,
        schemas.LineCreate(team_id=sample_team.id, name="O-Line"),
    )
    line2 = crud.create_line(
        db_session,
        schemas.LineCreate(team_id=sample_team.id, name="D-Line"),
    )

    # Try to rename line2 to line1's name
    update_data = schemas.LineUpdate(name="O-Line")
    with pytest.raises(Exception):  # SQLAlchemy IntegrityError
        crud.update_line(db_session, line2.id, update_data)


def test_delete_line_success(db_session, sample_team):
    """Test successfully deleting a line"""
    line_data = schemas.LineCreate(team_id=sample_team.id, name="O-Line")
    line = crud.create_line(db_session, line_data)
    line_id = line.id

    success = crud.delete_line(db_session, line_id)
    assert success is True

    # Verify it's deleted
    deleted_line = crud.get_line(db_session, line_id)
    assert deleted_line is None


def test_delete_line_not_found(db_session):
    """Test deleting non-existent line returns False"""
    success = crud.delete_line(db_session, 9999)
    assert success is False


def test_delete_line_cascade_deletes_m2m(db_session, sample_team, sample_players):
    """Test that deleting a line removes M2M associations but not players"""
    player_ids = [p.id for p in sample_players[:3]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)
    line_id = line.id

    # Delete the line
    crud.delete_line(db_session, line_id)

    # Verify line is deleted
    assert crud.get_line(db_session, line_id) is None

    # Verify players still exist
    for player_id in player_ids:
        player = crud.get_player(db_session, player_id)
        assert player is not None


def test_add_players_to_line_multiple(db_session, sample_team, sample_players):
    """Test adding multiple players to a line"""
    line_data = schemas.LineCreate(team_id=sample_team.id, name="O-Line")
    line = crud.create_line(db_session, line_data)

    player_ids = [sample_players[0].id, sample_players[1].id, sample_players[2].id]

    updated_line = crud.add_players_to_line(db_session, line.id, player_ids)

    assert len(updated_line.players) == 3
    assert all(p.id in player_ids for p in updated_line.players)


def test_add_players_to_line_duplicates_ignored(db_session, sample_team, sample_players):
    """Test that adding same player twice doesn't create duplicates"""
    player_id = sample_players[0].id

    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="D-Line",
        player_ids=[player_id],
    )
    line = crud.create_line(db_session, line_data)

    # Try to add the same player again
    updated_line = crud.add_players_to_line(db_session, line.id, [player_id])

    assert len(updated_line.players) == 1
    assert updated_line.players[0].id == player_id


def test_add_players_to_line_team_validation(db_session, sample_team, sample_players):
    """Test that only players from same team can be added"""
    team2 = crud.create_team(db_session, schemas.TeamCreate(name="Team 2"))
    team2_player = crud.create_player(
        db_session,
        schemas.PlayerCreate(
            team_id=team2.id,
            name="Team 2 Player",
            jersey_number=99,
            gender=Gender.M,
        ),
    )

    line_data = schemas.LineCreate(team_id=sample_team.id, name="O-Line")
    line = crud.create_line(db_session, line_data)

    # Try to add player from different team
    updated_line = crud.add_players_to_line(db_session, line.id, [team2_player.id])

    # Should not add the player from different team
    assert len(updated_line.players) == 0


def test_add_players_to_line_empty_initially(db_session, sample_team, sample_players):
    """Test adding players to a line that was created empty"""
    line_data = schemas.LineCreate(team_id=sample_team.id, name="Mixed Line")
    line = crud.create_line(db_session, line_data)

    assert len(line.players) == 0

    player_ids = [p.id for p in sample_players[:4]]
    updated_line = crud.add_players_to_line(db_session, line.id, player_ids)

    assert len(updated_line.players) == 4


def test_add_players_to_line_invalid_line(db_session, sample_players):
    """Test adding players to non-existent line returns None"""
    player_ids = [sample_players[0].id]
    result = crud.add_players_to_line(db_session, 9999, player_ids)
    assert result is None


def test_remove_players_from_line_multiple(db_session, sample_team, sample_players):
    """Test removing multiple players from a line"""
    player_ids = [p.id for p in sample_players[:5]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)

    # Remove first two players
    remove_ids = [sample_players[0].id, sample_players[1].id]
    updated_line = crud.remove_players_from_line(db_session, line.id, remove_ids)

    assert len(updated_line.players) == 3
    assert all(p.id not in remove_ids for p in updated_line.players)


def test_remove_players_from_line_partial(db_session, sample_team, sample_players):
    """Test partial removal of players from line"""
    player_ids = [p.id for p in sample_players[:3]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="D-Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)

    # Remove only one player
    updated_line = crud.remove_players_from_line(
        db_session, line.id, [sample_players[0].id]
    )

    assert len(updated_line.players) == 2
    assert sample_players[0].id not in [p.id for p in updated_line.players]


def test_remove_players_from_line_nonexistent_players(db_session, sample_team, sample_players):
    """Test removing non-existent players doesn't cause errors"""
    player_ids = [p.id for p in sample_players[:2]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="Mixed Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)

    # Try to remove player that's not in the line
    updated_line = crud.remove_players_from_line(db_session, line.id, [9999])

    # Should still have original players
    assert len(updated_line.players) == 2


def test_get_line_players_with_players(db_session, sample_team, sample_players):
    """Test getting all players in a line"""
    player_ids = [p.id for p in sample_players[:4]]
    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)

    players = crud.get_line_players(db_session, line.id)

    assert len(players) == 4
    assert all(p.id in player_ids for p in players)


def test_get_line_players_empty_line(db_session, sample_team):
    """Test getting players from empty line"""
    line_data = schemas.LineCreate(team_id=sample_team.id, name="Empty Line")
    line = crud.create_line(db_session, line_data)

    players = crud.get_line_players(db_session, line.id)

    assert players == []


def test_cascade_delete_team_deletes_lines(db_session, sample_team):
    """Test that deleting a team cascades to delete its lines"""
    # Create lines for the team
    for i in range(3):
        crud.create_line(
            db_session,
            schemas.LineCreate(team_id=sample_team.id, name=f"Line {i}"),
        )

    team_id = sample_team.id
    lines_count = len(crud.get_lines(db_session, team_id=team_id))
    assert lines_count == 3

    # Delete the team
    crud.delete_team(db_session, team_id)

    # Verify lines are deleted
    remaining_lines = crud.get_lines(db_session, team_id=team_id)
    assert len(remaining_lines) == 0


def test_cascade_delete_player_removes_from_m2m(db_session, sample_team, sample_players):
    """Test that deleting a player removes them from line M2M associations"""
    player_to_delete = sample_players[0]
    player_ids = [p.id for p in sample_players[:3]]

    line_data = schemas.LineCreate(
        team_id=sample_team.id,
        name="O-Line",
        player_ids=player_ids,
    )
    line = crud.create_line(db_session, line_data)
    line_id = line.id

    # Delete one player
    crud.delete_player(db_session, player_to_delete.id)

    # Verify line still exists but player is removed
    updated_line = crud.get_line(db_session, line_id)
    assert updated_line is not None
    assert len(updated_line.players) == 2
    assert player_to_delete.id not in [p.id for p in updated_line.players]
