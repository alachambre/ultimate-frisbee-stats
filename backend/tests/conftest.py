import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base
from app.database import get_db
from app.main import app


# Create in-memory SQLite database for testing
@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Use in-memory SQLite with shared cache for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with test database"""
    from fastapi.testclient import TestClient

    # Override the get_db dependency to use test database
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    # Clean up
    app.dependency_overrides.clear()


# Sample data fixtures
@pytest.fixture
def sample_team(db_session):
    """Create a sample team for testing"""
    from app.crud import create_team
    from app.schemas import TeamCreate

    team = create_team(db_session, TeamCreate(name="Test Team"))
    return team


@pytest.fixture
def sample_players(db_session, sample_team):
    """Create 7 sample players for testing (4 men, 3 women)"""
    from app.crud import create_player
    from app.schemas import PlayerCreate, Gender

    players = []
    for i in range(1, 8):
        gender = Gender.M if i <= 4 else Gender.W  # First 4 are men, last 3 are women
        player = create_player(
            db_session,
            PlayerCreate(team_id=sample_team.id, name=f"Player {i}", number=i, gender=gender)
        )
        players.append(player)
    return players


@pytest.fixture
def sample_competition(db_session, sample_team):
    """Create a sample competition for testing"""
    from app.crud import create_competition
    from app.schemas import CompetitionCreate
    from datetime import date

    competition = create_competition(
        db_session,
        CompetitionCreate(
            team_id=sample_team.id,
            name="Test Tournament",
            description="A test tournament",
            start_date=date(2026, 1, 20),
            end_date=date(2026, 1, 22)
        )
    )
    return competition


@pytest.fixture
def sample_game(db_session, sample_competition):
    """Create a sample game for testing"""
    from app.crud import create_game
    from app.schemas import GameCreate
    from datetime import datetime

    game = create_game(
        db_session,
        GameCreate(competition_id=sample_competition.id, opponent_name="Opponent Team", date=datetime.now())
    )
    return game


@pytest.fixture
def sample_line(db_session, sample_team, sample_players):
    """Create a sample line with 3 players for testing"""
    from app.crud import create_line
    from app.schemas import LineCreate

    # Use first 3 players
    player_ids = [p.id for p in sample_players[:3]]
    line = create_line(
        db_session,
        LineCreate(
            team_id=sample_team.id,
            name="O-Line",
            description="Offensive line",
            player_ids=player_ids
        )
    )
    return line


@pytest.fixture
def sample_strategy(db_session):
    """Create a sample offensive strategy for testing"""
    from app.crud import create_strategy
    from app.schemas import StrategyCreate, StrategyCategory

    strategy = create_strategy(
        db_session,
        StrategyCreate(
            name="Vertical Stack",
            description="Basic vertical offensive stack",
            category=StrategyCategory.offense
        )
    )
    return strategy


@pytest.fixture
def sample_defense_strategy(db_session):
    """Create a sample defensive strategy for testing"""
    from app.crud import create_strategy
    from app.schemas import StrategyCreate, StrategyCategory

    strategy = create_strategy(
        db_session,
        StrategyCreate(
            name="Person Defense",
            description="Basic person-to-person defense",
            category=StrategyCategory.defense
        )
    )
    return strategy


@pytest.fixture
def sample_player(db_session, sample_team):
    """Create a single sample player for testing"""
    from app.crud import create_player
    from app.schemas import PlayerCreate, Gender

    player = create_player(
        db_session,
        PlayerCreate(team_id=sample_team.id, name="Test Player", number=1, gender=Gender.M)
    )
    return player


@pytest.fixture
def sample_point(db_session, sample_game, sample_players):
    """Create a sample point for testing"""
    from app.crud import create_point
    from app.schemas import PointCreate

    # Create a point with 7 players
    player_ids = [p.id for p in sample_players]
    point = create_point(
        db_session,
        PointCreate(
            game_id=sample_game.id,
            point_number=1,
            starting_on_offense=True,
            player_ids=player_ids
        )
    )
    return point
