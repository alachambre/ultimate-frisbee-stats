"""
Tests for Competition CRUD operations
"""
import pytest
from datetime import date
from app.crud import (
    create_competition,
    get_competition,
    get_competitions,
    update_competition,
    delete_competition,
    add_players_to_competition,
    remove_players_from_competition,
    get_competition_players,
)
from app.schemas import CompetitionCreate, CompetitionUpdate, CompetitionStatus


def test_create_competition(db_session, sample_team):
    """Test creating a new competition"""
    competition_data = CompetitionCreate(
        team_id=sample_team.id,
        name="Nationals 2026",
        description="National tournament",
        start_date=date(2026, 5, 1),
        end_date=date(2026, 5, 3),
    )

    competition = create_competition(db_session, competition_data)

    assert competition.id is not None
    assert competition.name == "Nationals 2026"
    assert competition.description == "National tournament"
    assert competition.team_id == sample_team.id
    assert competition.status.value == "ongoing"
    assert competition.start_date == date(2026, 5, 1)
    assert competition.end_date == date(2026, 5, 3)


def test_create_competition_with_players(db_session, sample_team, sample_players):
    """Test creating a competition with initial roster"""
    player_ids = [p.id for p in sample_players[:5]]  # Select 5 players

    competition_data = CompetitionCreate(
        team_id=sample_team.id,
        name="Local Tournament",
        start_date=date(2026, 3, 1),
        end_date=date(2026, 3, 2),
        player_ids=player_ids,
    )

    competition = create_competition(db_session, competition_data)

    assert len(competition.players) == 5
    assert all(p.id in player_ids for p in competition.players)


def test_get_competition(db_session, sample_competition):
    """Test retrieving a competition by ID"""
    competition = get_competition(db_session, sample_competition.id)

    assert competition is not None
    assert competition.id == sample_competition.id
    assert competition.name == sample_competition.name


def test_get_competition_not_found(db_session):
    """Test retrieving non-existent competition returns None"""
    competition = get_competition(db_session, 9999)
    assert competition is None


def test_get_competitions_all(db_session, sample_team):
    """Test retrieving all competitions"""
    # Create multiple competitions
    for i in range(3):
        create_competition(
            db_session,
            CompetitionCreate(
                team_id=sample_team.id,
                name=f"Tournament {i}",
                start_date=date(2026, i + 1, 1),
                end_date=date(2026, i + 1, 2),
            ),
        )

    competitions = get_competitions(db_session)
    assert len(competitions) >= 3


def test_get_competitions_by_team(db_session, sample_team):
    """Test filtering competitions by team"""
    from app.crud import create_team
    from app.schemas import TeamCreate

    # Create another team with its own competition
    team2 = create_team(db_session, TeamCreate(name="Team 2"))

    create_competition(
        db_session,
        CompetitionCreate(
            team_id=sample_team.id,
            name="Team 1 Tournament",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 2),
        ),
    )

    create_competition(
        db_session,
        CompetitionCreate(
            team_id=team2.id,
            name="Team 2 Tournament",
            start_date=date(2026, 2, 1),
            end_date=date(2026, 2, 2),
        ),
    )

    team1_competitions = get_competitions(db_session, team_id=sample_team.id)
    assert all(c.team_id == sample_team.id for c in team1_competitions)


def test_update_competition(db_session, sample_competition):
    """Test updating competition fields"""
    update_data = CompetitionUpdate(
        name="Updated Name",
        description="Updated description",
        status=CompetitionStatus.completed,
    )

    updated = update_competition(db_session, sample_competition.id, update_data)

    assert updated.name == "Updated Name"
    assert updated.description == "Updated description"
    assert updated.status.value == "completed"


def test_update_competition_partial(db_session, sample_competition):
    """Test partial update of competition"""
    original_name = sample_competition.name

    update_data = CompetitionUpdate(status=CompetitionStatus.completed)
    updated = update_competition(db_session, sample_competition.id, update_data)

    assert updated.name == original_name  # Name unchanged
    assert updated.status.value == "completed"  # Status changed


def test_delete_competition(db_session, sample_competition):
    """Test deleting a competition"""
    comp_id = sample_competition.id

    success = delete_competition(db_session, comp_id)
    assert success is True

    # Verify it's deleted
    competition = get_competition(db_session, comp_id)
    assert competition is None


def test_delete_competition_not_found(db_session):
    """Test deleting non-existent competition returns False"""
    success = delete_competition(db_session, 9999)
    assert success is False


def test_add_players_to_competition(db_session, sample_team, sample_competition, sample_players):
    """Test adding players to competition roster"""
    player_ids = [sample_players[0].id, sample_players[1].id]

    competition = add_players_to_competition(db_session, sample_competition.id, player_ids)

    assert len(competition.players) == 2
    assert all(p.id in player_ids for p in competition.players)


def test_add_players_avoids_duplicates(db_session, sample_team, sample_competition, sample_players):
    """Test that adding same player twice doesn't create duplicates"""
    player_id = sample_players[0].id

    # Add player twice
    add_players_to_competition(db_session, sample_competition.id, [player_id])
    competition = add_players_to_competition(db_session, sample_competition.id, [player_id])

    assert len(competition.players) == 1


def test_remove_players_from_competition(db_session, sample_team, sample_competition, sample_players):
    """Test removing players from competition roster"""
    # First add players
    player_ids = [p.id for p in sample_players[:3]]
    add_players_to_competition(db_session, sample_competition.id, player_ids)

    # Remove one player
    competition = remove_players_from_competition(
        db_session, sample_competition.id, [sample_players[0].id]
    )

    assert len(competition.players) == 2
    assert sample_players[0].id not in [p.id for p in competition.players]


def test_remove_players_from_competition_disallowed_when_in_game(
    db_session, sample_team, sample_competition, sample_players, sample_game
):
    """Players assigned to a game cannot be removed from competition roster."""
    from app.crud.games import add_players_to_game

    player_id = sample_players[0].id
    add_players_to_competition(db_session, sample_competition.id, [player_id])
    add_players_to_game(db_session, sample_game.id, [player_id])

    with pytest.raises(ValueError, match="used in games"):
        remove_players_from_competition(db_session, sample_competition.id, [player_id])


def test_get_competition_players(db_session, sample_team, sample_competition, sample_players):
    """Test getting all players in a competition"""
    player_ids = [p.id for p in sample_players[:4]]
    add_players_to_competition(db_session, sample_competition.id, player_ids)

    players = get_competition_players(db_session, sample_competition.id)

    assert len(players) == 4
    assert all(p.id in player_ids for p in players)
