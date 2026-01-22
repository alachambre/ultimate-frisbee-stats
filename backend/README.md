# Ultimate Frisbee Stats - Backend API

FastAPI-based REST API for tracking ultimate frisbee team statistics, game scores, and point-by-point gameplay.

## Architecture

### Project Structure

```
backend/
├── app/
│   ├── routers/           # API endpoints organized by domain
│   │   ├── teams.py       # Team management endpoints
│   │   ├── competitions.py # Competition management endpoints
│   │   ├── players.py     # Player management endpoints
│   │   ├── games.py       # Game management endpoints
│   │   ├── points.py      # Point tracking endpoints
│   │   └── lines.py       # Line management endpoints (Phase 5)
│   ├── crud/              # Database operations by domain
│   │   ├── teams.py       # Team CRUD operations
│   │   ├── competitions.py # Competition CRUD operations
│   │   ├── players.py     # Player CRUD operations
│   │   ├── games.py       # Game CRUD operations
│   │   ├── points.py      # Point CRUD operations
│   │   └── lines.py       # Line CRUD operations (Phase 5)
│   ├── models/            # SQLAlchemy database models organized by domain
│   │   ├── base.py        # Base model, enums, association tables
│   │   ├── team.py        # Team model
│   │   ├── competition.py # Competition model
│   │   ├── player.py      # Player model
│   │   ├── game.py        # Game model
│   │   ├── point.py       # Point model
│   │   └── line.py        # Line model (Phase 5)
│   ├── schemas/           # Pydantic request/response schemas organized by domain
│   │   ├── enums.py       # Shared enums (Gender, CompetitionStatus, GameStatus)
│   │   ├── team.py        # Team schemas
│   │   ├── competition.py # Competition schemas
│   │   ├── player.py      # Player schemas
│   │   ├── game.py        # Game schemas
│   │   ├── point.py       # Point schemas
│   │   └── line.py        # Line schemas (Phase 5)
│   ├── database.py        # Database connection & session management
│   └── main.py            # FastAPI application setup
├── tests/
│   ├── conftest.py        # Test fixtures and configuration
│   ├── test_crud/         # Unit tests for database operations
│   └── test_api/          # Integration tests for API endpoints
└── requirements.txt       # Python dependencies
```

### Design Principles

- **Clean separation of concerns**: Routers handle HTTP, CRUD handles database, Models define schema
- **Domain-driven organization**: Code organized by business domain (teams, players, games, points)
- **Comprehensive testing**: Comprehensive test coverage at both unit and integration levels
- **V2-ready architecture**: Designed to easily add event tracking (goals, assists, turnovers) later

### Data Model

**Phase 5 - Lines & Enhanced Game Model:**
- **Team** → has many Players, Competitions, and Lines
- **Competition** → belongs to Team, has many Games, has player roster (M:N with Players)
- **Player** → belongs to Team, has gender (M/W), participates in Competitions, Points, Lines, and Games
- **Game** → belongs to Competition, has many Points, has 3-status lifecycle, comments, and optional player selection
- **Point** → belongs to Game, has exactly 7 Players (many-to-many), tracks duration
- **Line** → belongs to Team, has many Players (many-to-many), user-defined player groups (e.g., O-line, D-line)

Key features:
- **Competition-based hierarchy**: Team → Competition → Game → Point
- **Player gender tracking**: Required field (M/W) for mixity validation
- **Competition roster management**: Select players attending each competition
- **Line management** (Phase 5): Create custom player groups for quick selection
  - Unique line names per team
  - Many-to-many with players (team validation enforced)
- **Enhanced game model** (Phase 5):
  - 3-status lifecycle: ready → started → ended
  - Optional comments field for game notes
  - Optional player selection from competition roster
- Auto-incrementing point numbers per game
- Automatic score calculation from point results
- **Live point tracking with duration**:
  - Two-state workflow: active → completed
  - Timestamp tracking: `start_datetime`, `end_datetime`
  - Only one active point per game at a time
- Cascade deletes (deleting a team removes all related data)
- Validation: exactly 7 players per point, strict player selection hierarchy

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

### Run all tests

```bash
source venv/bin/activate
pytest tests/ -v
```

### Run only CRUD unit tests

```bash
pytest tests/test_crud/ -v
```

### Run only API integration tests

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
- `GET /teams/{team_id}/competitions` - List team competitions (Phase 4)
- `GET /teams/{team_id}/games` - List all team games across competitions

### Competitions (Phase 4)
- `POST /competitions` - Create a competition (with optional player roster)
- `GET /competitions` - List all competitions (filter by team_id)
- `GET /competitions/{competition_id}` - Get competition with player roster
- `PUT /competitions/{competition_id}` - Update competition (name, dates, status)
- `DELETE /competitions/{competition_id}` - Delete competition
- `GET /competitions/{competition_id}/players` - Get competition roster
- `POST /competitions/{competition_id}/players` - Add players to roster
- `DELETE /competitions/{competition_id}/players` - Remove players from roster
- `GET /competitions/{competition_id}/games` - List games in competition

**Competition Features:**
- Tournament/event management with start/end dates
- Status tracking: ongoing ↔ completed (reversible for corrections)
- Player roster selection (only rostered players can play in games)
- Automatic cascade to games when competition is deleted

### Players
- `POST /players` - Create a player (requires gender: M or W)
- `GET /players/{player_id}` - Get player details
- `PUT /players/{player_id}` - Update player (including gender)
- `DELETE /players/{player_id}` - Delete player

**Player Features (Phase 4):**
- Gender field required (M/W) for mixity tracking
- Used for 4M+3W or 3M+4W point validation

### Games
- `POST /games` - Create a game (requires competition_id, optional: player_ids, comments)
- `GET /games` - List all games with scores, team, and competition names
- `GET /games/{game_id}` - Get game with score, points, and selected players
- `PUT /games/{game_id}` - Update game (status, comments, opponent_name)
- `POST /games/{game_id}/finish` - Mark game as ended (status: ended)
- `DELETE /games/{game_id}` - Delete game
- `GET /games/{game_id}/points` - List all points for a game
- `GET /games/{game_id}/players` - List selected players for game (Phase 5)
- `POST /games/{game_id}/players` - Add players to game (must be in roster) (Phase 5)
- `DELETE /games/{game_id}/players` - Remove players from game (Phase 5)

**Game Features (Phase 5):**
- 3-status lifecycle: ready → started → ended
- Optional comments field for game notes
- Optional player selection from competition roster (M:N relationship)
- Status defaults to "ready" on creation
- Games belong to competitions (not directly to teams)

### Lines (Phase 5)
- `POST /lines` - Create a line (requires team_id, name, optional: description, player_ids)
- `GET /lines` - List all lines (filter by team_id)
- `GET /lines/{line_id}` - Get line with players
- `PUT /lines/{line_id}` - Update line (name, description)
- `DELETE /lines/{line_id}` - Delete line
- `GET /lines/{line_id}/players` - List players in line
- `POST /lines/{line_id}/players` - Add players to line
- `DELETE /lines/{line_id}/players` - Remove players from line

**Line Features:**
- User-defined player groups (e.g., "O-Line", "D-Line", "Handlers")
- Line names must be unique per team
- Many-to-many relationship with players
- Players must belong to the line's team
- Quick player selection for game planning

### Points (Phase 3: Live Point Tracking)
- `POST /points` - Start a new point (requires exactly 7 player IDs, creates active point)
- `GET /points/{point_id}` - Get point with player details
- `PUT /points/{point_id}` - Update point (players, timestamps)
- `POST /points/{point_id}/finish` - Finish active point (set won/lost outcome)
- `DELETE /points/{point_id}/cancel` - Cancel active point
- `DELETE /points/{point_id}` - Delete point
- `GET /points/games/{game_id}/active` - Get active point for game (404 if none)

**Point Tracking Features:**
- Two-state workflow: active → completed
- Timestamp tracking: `start_datetime`, `end_datetime` with timezone awareness
- Duration calculation for playing time stats (via @computed_field)
- Only one active point per game allowed
- Real-time point tracking during live games
- Proper ISO8601 datetime serialization with 'Z' suffix for UTC times
- Points ordered descending by point_number (most recent first)

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
- Sample fixtures available:
  - `sample_team` - A test team
  - `sample_competition` - A test competition
  - `sample_players` - 7 players (4 men, 3 women) with gender
  - `sample_game` - A test game
  - `sample_line` - A test line with 3 players (Phase 5)
- Complete test isolation - no side effects between tests

### Test Coverage
- **225 tests passing** (Phase 5)
  - 31 Line CRUD tests (Phase 5)
  - 27 Line API tests (Phase 5)
  - 17 enhanced Game tests (Phase 5)
  - Comprehensive coverage of all domains and edge cases
  - Tests include CRUD operations, M2M relationships, cascade deletes, unique constraints

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

## Contributing

1. Write tests for new features
2. Ensure all tests pass: `pytest tests/`
3. Follow existing code organization patterns
4. Update this README if adding new features

## License

See LICENSE file in the root directory.
