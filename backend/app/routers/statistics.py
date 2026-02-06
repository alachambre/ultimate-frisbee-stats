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


@router.get("/competitions/{competition_id}/players", response_model=List[schemas.PlayerGameStats])
def get_competition_player_statistics(
    competition_id: int,
    db: Session = Depends(get_db)
):
    """
    Get player statistics aggregated over all completed points in a competition.
    """
    stats = crud.get_competition_player_stats(db, competition_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Competition not found")

    return stats


@router.get("/teams/{team_id}/players", response_model=List[schemas.PlayerGameStats])
def get_team_player_statistics(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get player statistics aggregated over all completed points for a team.
    """
    stats = crud.get_team_player_stats(db, team_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Team not found")

    return stats


@router.get("/games/{game_id}/team", response_model=schemas.GameTeamStats)
def get_game_team_statistics(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Get team statistics for a game.
    Returns offense and defense efficiency metrics, including pull statistics.

    Only completed points are included in the calculations.
    Turnovers are attributed based on possession alternation logic.
    Pull statistics track inbound vs out-of-bounds pulls on defense points.
    """
    stats = crud.get_game_team_stats(db, game_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Game not found")

    return stats


@router.get("/competitions/{competition_id}/team", response_model=schemas.CompetitionTeamStats)
def get_competition_team_statistics(
    competition_id: int,
    db: Session = Depends(get_db)
):
    """
    Get aggregated team statistics for all completed points in a competition.
    Returns offense and defense efficiency metrics, including pull statistics.
    """
    stats = crud.get_competition_team_stats(db, competition_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Competition not found")

    return stats


@router.get("/teams/{team_id}/team", response_model=schemas.TeamTeamStats)
def get_team_team_statistics(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get aggregated team statistics across all competitions for a team.
    Returns offense and defense efficiency metrics, including pull statistics.
    """
    stats = crud.get_team_team_stats(db, team_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Team not found")

    return stats


@router.get("/competitions/{competition_id}/strategies", response_model=schemas.CompetitionStrategyStats)
def get_competition_strategy_statistics(
    competition_id: int,
    db: Session = Depends(get_db)
):
    """
    Get strategy statistics for a competition.
    Returns success rates per strategy on all completed points with assigned strategies.
    """
    stats = crud.get_competition_strategy_stats(db, competition_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Competition not found")

    return stats


@router.get("/teams/{team_id}/strategies", response_model=schemas.TeamStrategyStats)
def get_team_strategy_statistics(
    team_id: int,
    db: Session = Depends(get_db)
):
    """
    Get strategy statistics for a team across all competitions.
    Returns success rates per strategy on all completed points with assigned strategies.
    """
    stats = crud.get_team_strategy_stats(db, team_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Team not found")

    return stats


@router.get("/games/{game_id}/strategies", response_model=schemas.GameStrategyStats)
def get_game_strategy_statistics(
    game_id: int,
    db: Session = Depends(get_db)
):
    """
    Get strategy statistics for a game.
    Returns success rates per strategy.

    Only completed points with assigned strategies are included.

    Offense metrics:
    - Hold rate: % of points won on offense
    - Clean hold rate: % of offensive points won with 0 turnovers (over all offensive points with this strategy)
    - Quick score rate: % of offensive points won in < 90 seconds (over all offensive points with this strategy)

    Defense metrics:
    - Break rate: % of points won on defense
    - Turnover rate: % of points where at least 1 turnover occurred
    """
    stats = crud.get_game_strategy_stats(db, game_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Game not found")

    return stats
