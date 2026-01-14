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
    """Create 7 sample players for testing"""
    from app.crud import create_player
    from app.schemas import PlayerCreate

    players = []
    for i in range(1, 8):
        player = create_player(
            db_session,
            PlayerCreate(team_id=sample_team.id, name=f"Player {i}", number=i)
        )
        players.append(player)
    return players


@pytest.fixture
def sample_game(db_session, sample_team):
    """Create a sample game for testing"""
    from app.crud import create_game
    from app.schemas import GameCreate
    from datetime import datetime

    game = create_game(
        db_session,
        GameCreate(team_id=sample_team.id, opponent_name="Opponent Team", date=datetime.now())
    )
    return game
