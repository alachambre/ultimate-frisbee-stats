# Ultimate Frisbee Stats - Backend API

FastAPI-based REST API for tracking ultimate frisbee team statistics, game scores, and point-by-point gameplay.

## Architecture

### Project Structure

```
backend/
├── app/
│   ├── routers/           # API endpoints organized by domain
│   │   ├── teams.py       # Team management endpoints
│   │   ├── players.py     # Player management endpoints
│   │   ├── games.py       # Game management endpoints
│   │   └── points.py      # Point tracking endpoints
│   ├── crud/              # Database operations by domain
│   │   ├── teams.py       # Team CRUD operations
│   │   ├── players.py     # Player CRUD operations
│   │   ├── games.py       # Game CRUD operations
│   │   └── points.py      # Point CRUD operations
│   ├── models.py          # SQLAlchemy database models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── database.py        # Database connection & session management
│   └── main.py            # FastAPI application setup
├── tests/
│   ├── conftest.py        # Test fixtures and configuration
│   ├── test_crud/         # Unit tests for database operations (48 tests)
│   └── test_api/          # Integration tests for API endpoints (50 tests)
└── requirements.txt       # Python dependencies
```

### Design Principles

- **Clean separation of concerns**: Routers handle HTTP, CRUD handles database, Models define schema
- **Domain-driven organization**: Code organized by business domain (teams, players, games, points)
- **Comprehensive testing**: 98 tests covering both unit and integration levels
- **V2-ready architecture**: Designed to easily add event tracking (goals, assists, turnovers) later

### Data Model

**Team** → has many Players and Games
**Player** → belongs to Team, participates in many Points
**Game** → belongs to Team, has many Points
**Point** → belongs to Game, has exactly 7 Players (many-to-many)

Key features:
- Auto-incrementing point numbers per game
- Automatic score calculation from point results
- Cascade deletes (deleting a team removes its players and games)
- Validation: exactly 7 players per point, can't add points to finished games

## Prerequisites

- **Python 3.11+**
- **pip** (Python package manager)
- **(Optional) PostgreSQL** - For production; SQLite is used by default for local development

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd ultimate-frisbee-stats/backend
```

### 2. Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### Dependencies Overview

- **FastAPI** (0.115.5) - Modern web framework for building APIs
- **Uvicorn** (0.32.1) - ASGI server to run FastAPI
- **SQLAlchemy** (2.0.36) - ORM for database operations
- **Pydantic** (2.10.3) - Data validation and serialization
- **PostgreSQL driver** (psycopg2-binary 2.9.10) - For PostgreSQL support
- **Alembic** (1.14.0) - Database migration tool
- **Pytest** (8.3.4) - Testing framework
- **httpx** (0.28.1) - HTTP client for testing

## Configuration

### Database Configuration

By default, the application uses **SQLite** for local development (no setup required).

To use **PostgreSQL** in production:

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and set your database URL:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ultimate_stats
```

If `DATABASE_URL` is not set, the app automatically falls back to SQLite (`ultimate_stats.db` file).

## Running the Application

### Start the development server

```bash
# Make sure you're in the backend directory with venv activated
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive API docs**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

### Server will auto-reload on code changes

The `--reload` flag enables automatic reloading when you modify code files.

## Running Tests

### Run all tests (98 tests)

```bash
source venv/bin/activate
pytest tests/ -v
```

### Run only CRUD unit tests (48 tests)

```bash
pytest tests/test_crud/ -v
```

### Run only API integration tests (50 tests)

```bash
pytest tests/test_api/ -v
```

### Run tests with coverage report

```bash
pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html in your browser
```

### Run specific test file

```bash
pytest tests/test_api/test_teams_api.py -v
```

### Run with detailed output on failures

```bash
pytest tests/ -v --tb=short
```

## API Endpoints

### Teams
- `POST /teams` - Create a team
- `GET /teams` - List all teams
- `GET /teams/{team_id}` - Get team with players
- `PUT /teams/{team_id}` - Update team
- `DELETE /teams/{team_id}` - Delete team
- `GET /teams/{team_id}/players` - List team players
- `GET /teams/{team_id}/games` - List team games with scores

### Players
- `POST /players` - Create a player
- `GET /players/{player_id}` - Get player details
- `PUT /players/{player_id}` - Update player
- `DELETE /players/{player_id}` - Delete player

### Games
- `POST /games` - Create a game
- `GET /games/{game_id}` - Get game with score and points
- `PUT /games/{game_id}` - Update game
- `POST /games/{game_id}/finish` - Mark game as finished
- `DELETE /games/{game_id}` - Delete game
- `GET /games/{game_id}/points` - List all points for a game

### Points
- `POST /points` - Create a point (requires exactly 7 player IDs)
- `GET /points/{point_id}` - Get point with player details
- `PUT /points/{point_id}` - Update point
- `DELETE /points/{point_id}` - Delete point

**Full API documentation**: Visit http://localhost:8000/docs after starting the server.

## Development Workflow

### 1. Make code changes
Edit files in `app/` directory

### 2. Run tests
```bash
pytest tests/ -v
```

### 3. Check the API
- Visit http://localhost:8000/docs to test endpoints interactively
- Server auto-reloads when you save changes

### 4. Commit changes
```bash
git add .
git commit -m "Your commit message"
```

## Testing Strategy

### Unit Tests (`tests/test_crud/`)
- Test database operations in isolation
- Verify data persistence with explicit DB queries
- Test business logic (auto-increment, validation, cascade deletes)
- Fast execution with in-memory SQLite

### Integration Tests (`tests/test_api/`)
- Test full HTTP request → database → response cycle
- Verify status codes (200, 201, 204, 400, 404, 422)
- Test JSON serialization
- Validate business rules at API level

### Test Fixtures
- Each test gets a fresh in-memory database
- Sample fixtures available: `sample_team`, `sample_players`, `sample_game`
- Complete test isolation - no side effects between tests

## Troubleshooting

### Import errors
Make sure you're in the backend directory and venv is activated:
```bash
cd backend
source venv/bin/activate
```

### Database is locked (SQLite)
Stop any running uvicorn instances:
```bash
pkill -f uvicorn
```

### Tests failing
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

### Port 8000 already in use
Change the port:
```bash
uvicorn app.main:app --reload --port 8001
```

## Future Enhancements (V2)

The architecture is designed to support these upcoming features:
- **Event tracking**: Goals, assists, turnovers, blocks per point
- **Player statistics**: Individual performance metrics
- **Multi-team support**: Manage multiple teams
- **User accounts**: Authentication and authorization
- **Offline support**: PWA with local data sync

## Contributing

1. Write tests for new features
2. Ensure all tests pass: `pytest tests/`
3. Follow existing code organization patterns
4. Update this README if adding new features

## License

See LICENSE file in the root directory.
