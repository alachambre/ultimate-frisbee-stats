import pytest
from datetime import datetime
from app.crud import games, points
from app.schemas import GameCreate, GameUpdate, PointCreate


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
    assert game.status == "in_progress"
    assert game.date is not None
    assert game.created_at is not None

    # Explicitly verify it's actually in the database with a fresh query
    fetched_game = games.get_game(db_session, game.id)
    assert fetched_game is not None
    assert fetched_game.id == game.id
    assert fetched_game.opponent_name == "Rival Team"
    assert fetched_game.status == "in_progress"


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
    # Create multiple games in the same competition
    for i in range(3):
        games.create_game(
            db_session,
            GameCreate(
                competition_id=sample_competition.id,
                opponent_name=f"Opponent {i+1}",
                date=datetime.now()
            )
        )

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
    assert updated_game.status == "in_progress"


def test_update_game_status(db_session, sample_game):
    """Test updating game status"""
    update_data = GameUpdate(status="finished")
    updated_game = games.update_game(db_session, sample_game.id, update_data)

    assert updated_game is not None
    assert updated_game.status == "finished"


def test_update_game_not_found(db_session):
    """Test updating a non-existent game"""
    update_data = GameUpdate(opponent_name="Updated Name")
    updated_game = games.update_game(db_session, 999, update_data)

    assert updated_game is None


def test_finish_game(db_session, sample_game):
    """Test finishing a game"""
    finished_game = games.finish_game(db_session, sample_game.id)

    assert finished_game is not None
    assert finished_game.status == "finished"


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
