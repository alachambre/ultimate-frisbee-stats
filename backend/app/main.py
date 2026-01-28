from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import init_db
from app.routers import teams, players, games, points, competitions, lines, strategies, calls, turnovers
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
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
