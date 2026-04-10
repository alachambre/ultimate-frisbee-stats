from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import time

from app.auth.bootstrap import bootstrap_initial_admin
from app.auth.settings import get_auth_settings
from app.database import check_db_connection, init_db
from app.database import SessionLocal
from app.routers import auth, teams, players, games, points, competitions, lines, strategies, stoppages, turnovers, statistics, exports, halftimes, users
from app.logging_config import setup_logging, get_logger

APP_VERSION = "1.0.0"

# Initialize logging
setup_logging()
logger = get_logger("main")
DB_STARTUP_MAX_ATTEMPTS = max(1, int(os.getenv("DB_STARTUP_MAX_ATTEMPTS", "6")))
DB_STARTUP_INITIAL_DELAY_SECONDS = max(
    0.0,
    float(os.getenv("DB_STARTUP_INITIAL_DELAY_SECONDS", "2")),
)
DB_STARTUP_BACKOFF_MULTIPLIER = max(
    1.0,
    float(os.getenv("DB_STARTUP_BACKOFF_MULTIPLIER", "1.5")),
)

app = FastAPI(
    title="Ultimate Frisbee Stats API",
    description="API for tracking ultimate frisbee team statistics",
    version=APP_VERSION
)

# CORS middleware to allow frontend to communicate with backend
# Get allowed origins from environment variable, fallback to localhost for development
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
allowed_origins = [FRONTEND_URL]

# Allow localhost variants for development
if "localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL:
    allowed_origins.extend([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log them."""
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "method": request.method,
            "url": str(request.url),
            "client": request.client.host if request.client else None,
        }
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# Initialize database on startup
@app.on_event("startup")
def startup_event():
    logger.info("Application starting up...")
    initialize_database_with_retry()


@app.on_event("shutdown")
def shutdown_event():
    logger.info("Application shutting down...")


@app.get("/")
def root():
    return {"message": "Ultimate Frisbee Stats API", "version": APP_VERSION}


@app.get("/health")
def health():
    try:
        check_db_connection()
    except Exception as exc:
        logger.warning("Health check failed to reach database: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "service": "ultimate-frisbee-stats-api",
                "version": APP_VERSION,
                "database": "unreachable",
            },
        )

    return {
        "status": "ok",
        "service": "ultimate-frisbee-stats-api",
        "version": APP_VERSION,
        "database": "ok",
    }


# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(teams.router)
app.include_router(competitions.router)
app.include_router(players.router)
app.include_router(games.router)
app.include_router(points.router)
app.include_router(lines.router)
app.include_router(strategies.router)
app.include_router(stoppages.router)
app.include_router(halftimes.router)
app.include_router(turnovers.router)
app.include_router(statistics.router)
app.include_router(exports.router)


def initialize_database_state():
    init_db()
    auth_settings = get_auth_settings()
    with SessionLocal() as db:
        bootstrapped_admin = bootstrap_initial_admin(db, auth_settings)
    if bootstrapped_admin:
        logger.info(
            "Initial admin bootstrap ensured for %s",
            bootstrapped_admin.email,
        )


def initialize_database_with_retry():
    last_error: Exception | None = None

    for attempt in range(1, DB_STARTUP_MAX_ATTEMPTS + 1):
        try:
            initialize_database_state()
            logger.info("Database initialized successfully")
            return
        except Exception as exc:
            last_error = exc
            if attempt == DB_STARTUP_MAX_ATTEMPTS:
                logger.critical(f"Failed to initialize database: {exc}", exc_info=True)
                raise

            delay_seconds = DB_STARTUP_INITIAL_DELAY_SECONDS * (
                DB_STARTUP_BACKOFF_MULTIPLIER ** (attempt - 1)
            )
            logger.warning(
                "Database initialization attempt %s/%s failed: %s. Retrying in %.1fs",
                attempt,
                DB_STARTUP_MAX_ATTEMPTS,
                exc,
                delay_seconds,
                exc_info=True,
            )
            time.sleep(delay_seconds)

    if last_error:
        raise last_error
