from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import teams, players, games, points, competitions

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


# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "Ultimate Frisbee Stats API", "version": "1.0.0"}


# Include all routers
app.include_router(teams.router)
app.include_router(competitions.router)
app.include_router(players.router)
app.include_router(games.router)
app.include_router(points.router)
