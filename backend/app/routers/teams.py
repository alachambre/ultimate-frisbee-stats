from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.auth.dependencies import require_team_member
from app.database import get_db
from app.statistics_cache import clear_statistics_cache

router = APIRouter(
    prefix="/teams",
    tags=["teams"],
    dependencies=[Depends(require_team_member)],
)


@router.post("", response_model=schemas.Team, status_code=201)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    created_team = crud.create_team(db, team)
    clear_statistics_cache("team_created")
    return created_team


@router.get("", response_model=List[schemas.TeamWithPlayers])
def list_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_teams(db, skip=skip, limit=limit)


@router.get("/{team_id}", response_model=schemas.TeamWithPlayers)
def get_team(team_id: int, db: Session = Depends(get_db)):
    team = crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.put("/{team_id}", response_model=schemas.Team)
def update_team(team_id: int, team_update: schemas.TeamUpdate, db: Session = Depends(get_db)):
    team = crud.update_team(db, team_id, team_update)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    clear_statistics_cache("team_updated")
    return team


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    success = crud.delete_team(db, team_id)
    if not success:
        raise HTTPException(status_code=404, detail="Team not found")
    clear_statistics_cache("team_deleted")


# Nested endpoints for team resources
@router.get("/{team_id}/players", response_model=List[schemas.Player])
def list_team_players(team_id: int, db: Session = Depends(get_db)):
    return crud.get_players_by_team(db, team_id)


@router.get("/{team_id}/competitions", response_model=List[schemas.Competition])
def list_team_competitions(team_id: int, db: Session = Depends(get_db)):
    team = crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return crud.get_competitions(db, team_id=team_id)


@router.get("/{team_id}/games", response_model=List[schemas.GameWithScore])
def list_team_games(team_id: int, db: Session = Depends(get_db)):
    team = crud.get_team(db, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    return crud.get_games_by_team_with_scores(db, team_id)
