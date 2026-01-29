from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from app.database import init_db
from app.routers import teams, players, games, points, competitions, lines, strategies, calls, turnovers, statistics
from app.logging_config import setup_logging, get_logger

# Initialize logging
setup_logging()
logger = get_logger("main")

app = FastAPI(
    title="Ultimate Frisbee Stats API",
    description="API for tracking ultimate frisbee team statistics",
    version="1.0.0"
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
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.critical(f"Failed to initialize database: {e}", exc_info=True)
        raise


@app.on_event("shutdown")
def shutdown_event():
    logger.info("Application shutting down...")


@app.get("/")
def root():
    return {"message": "Ultimate Frisbee Stats API", "version": "1.0.0"}


# Include all routers
app.include_router(teams.router)
app.include_router(competitions.router)
app.include_router(players.router)
app.include_router(games.router)
app.include_router(points.router)
app.include_router(lines.router)
app.include_router(strategies.router)
app.include_router(calls.router)
app.include_router(turnovers.router)
app.include_router(statistics.router)
