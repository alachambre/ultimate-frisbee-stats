import pytest
from app.crud import teams
from app.schemas import TeamCreate, TeamUpdate


def test_create_team(db_session):
    """Test creating a team and verify it's persisted in DB"""
    team_data = TeamCreate(name="Flying Disc Club")
    team = teams.create_team(db_session, team_data)

    # Verify returned object
    assert team.id is not None
    assert team.name == "Flying Disc Club"
    assert team.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_team = teams.get_team(db_session, team.id)
    assert fetched_team is not None
    assert fetched_team.id == team.id
    assert fetched_team.name == "Flying Disc Club"


def test_get_team(db_session, sample_team):
    """Test retrieving a team by ID"""
    team = teams.get_team(db_session, sample_team.id)

    assert team is not None
    assert team.id == sample_team.id
    assert team.name == sample_team.name


def test_get_team_not_found(db_session):
    """Test retrieving a non-existent team"""
    team = teams.get_team(db_session, 999)
    assert team is None


def test_get_teams(db_session):
    """Test listing all teams"""
    # Create multiple teams
    teams.create_team(db_session, TeamCreate(name="Team 1"))
    teams.create_team(db_session, TeamCreate(name="Team 2"))
    teams.create_team(db_session, TeamCreate(name="Team 3"))

    all_teams = teams.get_teams(db_session)

    assert len(all_teams) == 3
    assert all_teams[0].name == "Team 1"
    assert all_teams[1].name == "Team 2"
    assert all_teams[2].name == "Team 3"


def test_get_teams_with_pagination(db_session):
    """Test listing teams with pagination"""
    # Create 5 teams
    for i in range(1, 6):
        teams.create_team(db_session, TeamCreate(name=f"Team {i}"))

    # Get first 2
    page1 = teams.get_teams(db_session, skip=0, limit=2)
    assert len(page1) == 2

    # Get next 2
    page2 = teams.get_teams(db_session, skip=2, limit=2)
    assert len(page2) == 2

    # Verify different teams
    assert page1[0].id != page2[0].id


def test_update_team(db_session, sample_team):
    """Test updating a team and verify changes are persisted"""
    update_data = TeamUpdate(name="Updated Team Name")
    updated_team = teams.update_team(db_session, sample_team.id, update_data)

    assert updated_team is not None
    assert updated_team.id == sample_team.id
    assert updated_team.name == "Updated Team Name"

    # Explicitly verify the update was persisted with a fresh query
    fetched_team = teams.get_team(db_session, sample_team.id)
    assert fetched_team.name == "Updated Team Name"


def test_update_team_not_found(db_session):
    """Test updating a non-existent team"""
    update_data = TeamUpdate(name="Updated Name")
    updated_team = teams.update_team(db_session, 999, update_data)

    assert updated_team is None


def test_delete_team(db_session, sample_team):
    """Test deleting a team"""
    team_id = sample_team.id

    # Delete the team
    success = teams.delete_team(db_session, team_id)
    assert success is True

    # Verify it's deleted
    team = teams.get_team(db_session, team_id)
    assert team is None


def test_delete_team_not_found(db_session):
    """Test deleting a non-existent team"""
    success = teams.delete_team(db_session, 999)
    assert success is False


def test_delete_team_cascades_to_players(db_session, sample_team, sample_players):
    """Test that deleting a team cascades to delete players"""
    from app.crud import get_players_by_team

    team_id = sample_team.id

    # Verify players exist
    players = get_players_by_team(db_session, team_id)
    assert len(players) == 7

    # Delete team
    teams.delete_team(db_session, team_id)

    # Verify players are deleted (cascade)
    players = get_players_by_team(db_session, team_id)
    assert len(players) == 0
