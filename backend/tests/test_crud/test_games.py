import pytest
from datetime import datetime
from app.crud import games, points
from app.schemas import GameCreate, GameUpdate, PointCreate, GameStatus, PointUpdate, PointStatus, PointFinish
from tests.builders import GameBuilder


def test_create_game(db_session, sample_competition):
    """Test creating a game and verify it's persisted in DB"""
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now()
    )
    game = games.create_game(db_session, game_data)

    # Verify returned object
    assert game.id is not None
    assert game.competition_id == sample_competition.id
    assert game.opponent_name == "Rival Team"
    assert game.status.value == "ready"
    assert game.date is not None
    assert game.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_game = games.get_game(db_session, game.id)
    assert fetched_game is not None
    assert fetched_game.id == game.id
    assert fetched_game.opponent_name == "Rival Team"
    assert fetched_game.status.value == "ready"


def test_get_game(db_session, sample_game):
    """Test retrieving a game by ID"""
    game = games.get_game(db_session, sample_game.id)

    assert game is not None
    assert game.id == sample_game.id
    assert game.opponent_name == sample_game.opponent_name


def test_get_game_not_found(db_session):
    """Test retrieving a non-existent game"""
    game = games.get_game(db_session, 999)
    assert game is None


def test_get_games_by_team(db_session, sample_team, sample_competition):
    """Test listing all games for a team across competitions"""
    from datetime import timedelta

    # Create multiple games in the same competition with different dates
    base_date = datetime.now()
    for i in range(3):
        GameBuilder(db_session, sample_competition) \
            .with_opponent(f"Opponent {i+1}") \
            .with_date(base_date + timedelta(days=i)) \
            .build()

    team_games = games.get_games_by_team(db_session, sample_team.id)

    assert len(team_games) == 3
    # Games should be ordered by date descending
    assert team_games[0].opponent_name == "Opponent 3"
    assert team_games[2].opponent_name == "Opponent 1"


def test_update_game(db_session, sample_game):
    """Test updating a game"""
    update_data = GameUpdate(opponent_name="Updated Opponent")
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.id == sample_game.id
    assert updated_game.opponent_name == "Updated Opponent"
    assert updated_game.status.value == "ready"


def test_update_game_status(db_session, sample_game):
    """Test updating game status"""
    update_data = GameUpdate(status=GameStatus.ended)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "ended"


def test_update_game_not_found(db_session):
    """Test updating a non-existent game"""
    update_data = GameUpdate(opponent_name="Updated Name")
    updated_game = games.update_game(db_session, 999, update_data)

    assert updated_game is None


def test_finish_game(db_session, sample_game):
    """Test finishing a game"""
    finished_game = games.finish_game(db_session, sample_game.id)

    assert finished_game is not None
    assert finished_game.status.value == "ended"


def test_delete_game(db_session, sample_game):
    """Test deleting a game"""
    game_id = sample_game.id

    # Delete the game
    success = games.delete_game(db_session, game_id)
    assert success is True

    # Verify it's deleted
    game = games.get_game(db_session, game_id)
    assert game is None


def test_delete_game_not_found(db_session):
    """Test deleting a non-existent game"""
    success = games.delete_game(db_session, 999)
    assert success is False


def test_get_game_score_empty(db_session, sample_game):
    """Test getting score for a game with no points"""
    our_score, opponent_score = games.get_game_score(db_session, sample_game.id)

    assert our_score == 0
    assert opponent_score == 0


def test_get_game_score_with_points(db_session, sample_game, sample_players):
    """Test calculating game score"""
    from app.schemas import PointFinish
    # Create some points
    player_ids = [p.id for p in sample_players]

    # We won 3 points
    for _ in range(3):
        point = points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=True,
                player_ids=player_ids
            )
        )
        # Finish the point so we can create another
        points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
        points.finish_point(db_session, point.id, PointFinish(won=True))

    # Opponent won 2 points
    for _ in range(2):
        point = points.create_point(
            db_session,
            PointCreate(
                game_id=sample_game.id,
                starting_on_offense=False,
                player_ids=player_ids
            )
        )
        # Finish the point so we can create another
        points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
        points.finish_point(db_session, point.id, PointFinish(won=False))

    our_score, opponent_score = games.get_game_score(db_session, sample_game.id)

    assert our_score == 3
    assert opponent_score == 2


def test_get_game_detail(db_session, sample_game, sample_players):
    """Test getting complete game details with points"""
    from app.schemas import PointFinish
    player_ids = [p.id for p in sample_players]

    # Create a point
    point = points.create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )
    # Finish the point
    points.update_point(db_session, point.id, PointUpdate(status=PointStatus.running))
    points.finish_point(db_session, point.id, PointFinish(won=True))

    game_detail = games.get_game_detail(db_session, sample_game.id)

    assert game_detail is not None
    assert game_detail["id"] == sample_game.id
    assert game_detail["our_score"] == 1
    assert game_detail["opponent_score"] == 0
    assert len(game_detail["points"]) == 1


def test_get_game_detail_not_found(db_session):
    """Test getting details for a non-existent game"""
    game_detail = games.get_game_detail(db_session, 999)
    assert game_detail is None


# =====================================================
# Phase 5: Player Selection, Comments, Status Enum Tests
# =====================================================

# Create with players tests (3 tests)
def test_create_game_with_players(db_session, sample_competition, sample_players):
    """Test creating a game with player selection from roster"""
    from app.crud.competitions import add_players_to_competition

    # Add players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Create game with selected players
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now(),
        player_ids=[sample_players[0].id, sample_players[1].id, sample_players[2].id]
    )
    game = games.create_game(db_session, game_data)

    assert game.id is not None
    assert len(game.players) == 3
    player_ids = {p.id for p in game.players}
    assert sample_players[0].id in player_ids
    assert sample_players[1].id in player_ids
    assert sample_players[2].id in player_ids


def test_create_game_with_players_validates_roster(db_session, sample_competition, sample_players):
    """Test that only roster players can be added to game"""
    from app.crud.competitions import add_players_to_competition

    # Add only first 3 players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players[:3]])

    # Try to create game with both roster and non-roster players
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now(),
        player_ids=[sample_players[0].id, sample_players[1].id, sample_players[5].id]  # Player 5 not in roster
    )
    game = games.create_game(db_session, game_data)

    # Only roster players should be added
    assert len(game.players) == 2
    player_ids = {p.id for p in game.players}
    assert sample_players[0].id in player_ids
    assert sample_players[1].id in player_ids
    assert sample_players[5].id not in player_ids


def test_create_game_with_comments(db_session, sample_competition):
    """Test creating a game with comments field"""
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now(),
        comments="Important game - must win for playoffs"
    )
    game = games.create_game(db_session, game_data)

    assert game.id is not None
    assert game.comments == "Important game - must win for playoffs"


# Status enum tests (5 tests)
def test_create_game_default_status_ready(db_session, sample_competition):
    """Test that default status is 'ready'"""
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now()
    )
    game = games.create_game(db_session, game_data)

    assert game.status.value == "ready"


def test_update_game_status_to_started(db_session, sample_game):
    """Test updating game status from ready to started"""
    from app.schemas import GameStatus

    update_data = GameUpdate(status=GameStatus.started)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "started"


def test_update_game_status_to_ended(db_session, sample_game):
    """Test updating game status to ended"""
    from app.schemas import GameStatus

    update_data = GameUpdate(status=GameStatus.ended)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "ended"


def test_finish_game_sets_status_to_ended(db_session, sample_game):
    """Test that finish_game() sets status to 'ended'"""
    finished_game = games.finish_game(db_session, sample_game.id)

    assert finished_game is not None
    assert finished_game.status.value == "ended"


def test_game_status_persists_after_commit(db_session, sample_competition):
    """Test that status enum persists correctly in database"""
    from app.schemas import GameStatus

    # Create game with default status (ready)
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now()
    )
    game = games.create_game(db_session, game_data)
    game_id = game.id

    # Verify status is ready
    assert game.status.value == "ready"

    # Update to started
    games.update_game(db_session, game_id, GameUpdate(status=GameStatus.started))

    # Fetch fresh from DB
    fetched_game = games.get_game(db_session, game_id)
    assert fetched_game.status.value == "started"

    # Update to ended
    games.update_game(db_session, game_id, GameUpdate(status=GameStatus.ended))

    # Fetch fresh from DB again
    fetched_game = games.get_game(db_session, game_id)
    assert fetched_game.status.value == "ended"


# Update tests (3 tests)
def test_update_game_comments(db_session, sample_game):
    """Test updating comments field"""
    update_data = GameUpdate(comments="Updated comment about the game")
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.comments == "Updated comment about the game"


def test_update_game_all_fields(db_session, sample_game):
    """Test updating status and comments together"""
    from app.schemas import GameStatus

    update_data = GameUpdate(
        status=GameStatus.ended,
        comments="Great game! Won by 2 points."
    )
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "ended"
    assert updated_game.comments == "Great game! Won by 2 points."


def test_update_game_partial_fields(db_session, sample_game):
    """Test partial update (only some fields)"""
    from app.schemas import GameStatus

    # Set initial comment
    games.update_game(db_session, sample_game.id, GameUpdate(comments="Initial comment"))

    # Update only status
    update_data = GameUpdate(status=GameStatus.started)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "started"
    assert updated_game.comments == "Initial comment"  # Should not be changed


# Player management tests (6 tests)
def test_add_players_to_game(db_session, sample_game, sample_players, sample_competition):
    """Test adding players from roster to game"""
    from app.crud.competitions import add_players_to_competition

    # Add all players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Add 3 players to game
    player_ids_to_add = [sample_players[0].id, sample_players[1].id, sample_players[2].id]
    updated_game = games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    assert updated_game is not None
    assert len(updated_game.players) == 3
    game_player_ids = {p.id for p in updated_game.players}
    assert sample_players[0].id in game_player_ids
    assert sample_players[1].id in game_player_ids
    assert sample_players[2].id in game_player_ids


def test_add_players_to_game_validates_roster(db_session, sample_game, sample_players, sample_competition):
    """Test that only roster players can be added to game"""
    from app.crud.competitions import add_players_to_competition

    # Add only first 3 players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players[:3]])

    # Try to add both roster and non-roster players
    player_ids_to_add = [sample_players[0].id, sample_players[1].id, sample_players[5].id]  # Player 5 not in roster
    updated_game = games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Only roster players should be added
    assert len(updated_game.players) == 2
    game_player_ids = {p.id for p in updated_game.players}
    assert sample_players[0].id in game_player_ids
    assert sample_players[1].id in game_player_ids
    assert sample_players[5].id not in game_player_ids


def test_add_players_to_game_avoids_duplicates(db_session, sample_game, sample_players, sample_competition):
    """Test that duplicate players are not added"""
    from app.crud.competitions import add_players_to_competition

    # Add all players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Add 2 players
    player_ids_to_add = [sample_players[0].id, sample_players[1].id]
    games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Try to add same players again plus a new one
    player_ids_to_add = [sample_players[0].id, sample_players[1].id, sample_players[2].id]
    updated_game = games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Should have 3 players total (no duplicates)
    assert len(updated_game.players) == 3


def test_remove_players_from_game(db_session, sample_game, sample_players, sample_competition):
    """Test removing players from game"""
    from app.crud.competitions import add_players_to_competition

    # Add all players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Add 4 players to game
    player_ids_to_add = [p.id for p in sample_players[:4]]
    games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Remove 2 players
    player_ids_to_remove = [sample_players[0].id, sample_players[1].id]
    updated_game = games.remove_players_from_game(db_session, sample_game.id, player_ids_to_remove)

    # Should have 2 players left
    assert len(updated_game.players) == 2
    game_player_ids = {p.id for p in updated_game.players}
    assert sample_players[0].id not in game_player_ids
    assert sample_players[1].id not in game_player_ids
    assert sample_players[2].id in game_player_ids
    assert sample_players[3].id in game_player_ids


def test_remove_players_from_game_partial(db_session, sample_game, sample_players, sample_competition):
    """Test partial removal of players"""
    from app.crud.competitions import add_players_to_competition

    # Add all players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Add 5 players
    player_ids_to_add = [p.id for p in sample_players[:5]]
    games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Remove only 1 player
    player_ids_to_remove = [sample_players[2].id]
    updated_game = games.remove_players_from_game(db_session, sample_game.id, player_ids_to_remove)

    # Should have 4 players left
    assert len(updated_game.players) == 4
    game_player_ids = {p.id for p in updated_game.players}
    assert sample_players[2].id not in game_player_ids


def test_get_game_detail_includes_players(db_session, sample_game, sample_players, sample_competition):
    """Test that game_detail includes selected players"""
    from app.crud.competitions import add_players_to_competition

    # Add players to competition roster
    add_players_to_competition(db_session, sample_competition.id, [p.id for p in sample_players])

    # Add 3 players to game
    player_ids_to_add = [p.id for p in sample_players[:3]]
    games.add_players_to_game(db_session, sample_game.id, player_ids_to_add)

    # Get game detail
    game_detail = games.get_game_detail(db_session, sample_game.id)

    assert game_detail is not None
    assert "players" in game_detail
    assert len(game_detail["players"]) == 3
    player_ids = {p.id for p in game_detail["players"]}
    assert sample_players[0].id in player_ids
    assert sample_players[1].id in player_ids
    assert sample_players[2].id in player_ids


# =====================================================
# Game Chrono Tests (Timestamps)
# =====================================================

def test_create_game_no_timestamps(db_session, sample_competition):
    """Test that new games have null start/end timestamps"""
    game_data = GameCreate(
        competition_id=sample_competition.id,
        opponent_name="Rival Team",
        date=datetime.now()
    )
    game = games.create_game(db_session, game_data)

    assert game.start_datetime is None
    assert game.end_datetime is None


def test_start_game_sets_start_datetime(db_session, sample_game):
    """Test that changing status to started sets start_datetime"""
    from app.schemas import GameStatus

    # Initially no timestamp
    assert sample_game.start_datetime is None

    # Start the game (this only changes status, not start_datetime)
    update_data = GameUpdate(status=GameStatus.started)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "started"
    # start_datetime is now set when first point is created, not when game starts
    assert updated_game.start_datetime is None
    assert updated_game.end_datetime is None


def test_end_game_sets_end_datetime(db_session, sample_game, sample_players):
    """Test that changing status to ended sets end_datetime"""
    from app.schemas import GameStatus, PointCreate
    from app.crud import points

    # Start the game first
    games.update_game(db_session, sample_game.id, GameUpdate(status=GameStatus.started))

    # Create first point to set start_datetime
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=[p.id for p in sample_players[:7]]
    )
    points.create_point(db_session, point_data)

    # Fetch to get updated game
    started_game = games.get_game(db_session, sample_game.id)
    assert started_game.start_datetime is not None
    assert started_game.end_datetime is None

    # End the game
    update_data = GameUpdate(status=GameStatus.ended)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status.value == "ended"
    assert updated_game.start_datetime is not None
    assert updated_game.end_datetime is not None
    # End time should be after start time
    assert updated_game.end_datetime > updated_game.start_datetime


def test_finish_game_sets_end_datetime(db_session, sample_game, sample_players):
    """Test that finish_game() sets end_datetime"""
    from app.schemas import GameStatus, PointCreate
    from app.crud import points

    # Start the game first
    games.update_game(db_session, sample_game.id, GameUpdate(status=GameStatus.started))

    # Create first point to set start_datetime
    point_data = PointCreate(
        game_id=sample_game.id,
        starting_on_offense=True,
        player_ids=[p.id for p in sample_players[:7]]
    )
    points.create_point(db_session, point_data)

    # Fetch to get updated game
    started_game = games.get_game(db_session, sample_game.id)
    assert started_game.start_datetime is not None

    # Finish the game
    finished_game = games.finish_game(db_session, sample_game.id)

    assert finished_game is not None
    assert finished_game.status.value == "ended"
    assert finished_game.start_datetime is not None
    assert finished_game.end_datetime is not None
    assert finished_game.end_datetime > finished_game.start_datetime


def test_invalid_status_transition_no_timestamp(db_session, sample_game):
    """Test that invalid transitions don't set timestamps"""
    from app.schemas import GameStatus

    # Try to go directly from ready to ended (skipping started)
    update_data = GameUpdate(status=GameStatus.ended)
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    # Status changes but end_datetime should not be set (only ready->started sets start, started->ended sets end)
    assert updated_game is not None
    assert updated_game.status.value == "ended"
    assert updated_game.start_datetime is None
    assert updated_game.end_datetime is None
