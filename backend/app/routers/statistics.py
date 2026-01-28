"""
Statistics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import statistics as schemas
from app.crud import statistics as crud
from app.models.game import Game

router = APIRouter(prefix="/statistics", tags=["statistics"])


@router.get("/games/{game_id}/live", response_model=List[schemas.PlayerGameStats])
def get_live_game_statistics(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Get live player statistics for an ongoing game.
    Returns stats for all players in the game roster.

    Only completed points are included in the calculations.
    Effective time = point duration - call durations (dead time).
    """
    # Verify game exists
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    stats = crud.get_live_game_player_stats(db, game_id)
    return stats


@router.get("/games/{game_id}/team", response_model=schemas.GameTeamStats)
def get_game_team_statistics(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Get team statistics for a game.
    Returns offense and defense efficiency metrics.

    Only completed points are included in the calculations.
    Turnovers are attributed based on possession alternation logic.
    """
    stats = crud.get_game_team_stats(db, game_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Game not found")

    return stats
