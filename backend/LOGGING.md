# Backend Logging Guide

## Overview

Essential logging has been added to the backend to help debug production issues. The logging system captures errors, key operations, and application lifecycle events without creating excessive noise.

## Logging Configuration

**Location:** `backend/app/logging_config.py`

- **Format:** Timestamp - Module - Level - Message
- **Default Level:** INFO (configurable)
- **Output:** Console (stdout) with colored formatting
- **External Libraries:** Reduced noise from uvicorn and sqlalchemy

## What Gets Logged

### Application Lifecycle
- **Startup:** Database initialization success/failure
- **Shutdown:** Clean shutdown notification
- **Unhandled Exceptions:** Global exception handler catches all uncaught errors with full stack traces

### Games (routers/games.py)
- Game creation with details (competition, opponent, player count)
- Game status changes (ready → started → ended)
- Game finish events
- Validation errors (competition not found, invalid players)

### Points (routers/points.py)
- Point creation (game ID, offense/defense, player count)
- Point status transitions (ready → running → scored → completed)
- Point completion with outcome (won/lost)
- Point cancellation
- Validation errors (game ended, strategy not found, wrong player count)

### Database Errors (crud/*.py)
- SQLAlchemy exceptions in games CRUD operations
- SQLAlchemy exceptions in points CRUD operations
- Database rollbacks with full context

## Log Levels

- **INFO:** Successful operations and state changes
  - Game created/finished
  - Point created/finished
  - Application startup/shutdown

- **WARNING:** Expected errors and validation failures
  - Resource not found (404)
  - Business logic violations (400)
  - Invalid player assignments

- **ERROR:** Database errors and unexpected failures
  - SQLAlchemy exceptions
  - Database rollbacks

- **CRITICAL:** Fatal errors preventing application startup
  - Database initialization failures

## Example Log Output

```
2026-01-28 12:47:28 - app.main - INFO - Application starting up...
2026-01-28 12:47:28 - app.main - INFO - Database initialized successfully
2026-01-28 12:50:15 - app.routers.games - INFO - Game created: id=1, competition=1, opponent=Rivals, players=12
2026-01-28 12:51:22 - app.routers.points - INFO - Point created: id=1, game=1, offense=True, players=7
2026-01-28 12:53:45 - app.routers.points - WARNING - Failed to create point: game 999 not found
2026-01-28 12:55:10 - app.crud.games - ERROR - Database error updating game 1: <exception details>
```

## Production Usage

### Viewing Logs
When running in production (e.g., with systemd or Docker):

```bash
# Follow logs in real-time
journalctl -u frisbee-api -f

# Or with Docker
docker logs -f frisbee-api
```

### Log Rotation
Configure your deployment to rotate logs to prevent disk space issues:

```bash
# Example systemd service with journald (automatic rotation)
[Service]
StandardOutput=journal
StandardError=journal
```

### Troubleshooting Common Issues

**Game won't start:**
```
Look for: "Game X status changed to started"
If missing: Check for validation errors or database errors before that point
```

**Point creation fails:**
```
Look for: "Failed to create point" warnings
Check: Game ID, player count (must be 7), strategy ID
```

**Database errors:**
```
Look for: ERROR level logs with full stack traces
Check: Database file permissions, disk space, SQLite locking
```

## Future Enhancements

For Phase 7+, consider adding:
- Request ID tracking for correlating logs across multiple operations
- Performance metrics (slow query logging)
- User action tracking for audit trails
- Structured JSON logging for production log aggregation systems
