from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel

from app import schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/lines",
    tags=["lines"]
)


@router.post("", response_model=schemas.Line, status_code=201)
def create_line(line: schemas.LineCreate, db: Session = Depends(get_db)):
    # Verify team exists
    team = crud.get_team(db, line.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Verify all players exist and belong to the team
    if line.player_ids:
        players = crud.get_players_by_team(db, line.team_id)
        player_ids_set = {p.id for p in players}
        invalid_players = set(line.player_ids) - player_ids_set
        if invalid_players:
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in team {line.team_id}"
            )

    try:
        return crud.create_line(db, line)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Line with name '{line.name}' already exists for this team"
        )


@router.get("", response_model=List[schemas.LineWithPlayers])
def list_lines(team_id: Optional[int] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_lines(db, team_id=team_id, skip=skip, limit=limit)


@router.get("/{line_id}", response_model=schemas.LineWithPlayers)
def get_line(line_id: int, db: Session = Depends(get_db)):
    line = crud.get_line(db, line_id)
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return line


@router.put("/{line_id}", response_model=schemas.Line)
def update_line(line_id: int, line_update: schemas.LineUpdate, db: Session = Depends(get_db)):
    try:
        line = crud.update_line(db, line_id, line_update)
        if not line:
            raise HTTPException(status_code=404, detail="Line not found")
        return line
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Line with name '{line_update.name}' already exists for this team"
        )


@router.delete("/{line_id}", status_code=204)
def delete_line(line_id: int, db: Session = Depends(get_db)):
    success = crud.delete_line(db, line_id)
    if not success:
        raise HTTPException(status_code=404, detail="Line not found")


# Nested endpoints for line resources
@router.get("/{line_id}/players", response_model=List[schemas.Player])
def list_line_players(line_id: int, db: Session = Depends(get_db)):
    """Get all players in this line"""
    line = crud.get_line(db, line_id)
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")
    return crud.get_line_players(db, line_id)


class PlayerIdsRequest(BaseModel):
    player_ids: List[int]


@router.post("/{line_id}/players", response_model=schemas.LineWithPlayers)
def add_players_to_line(line_id: int, request: PlayerIdsRequest, db: Session = Depends(get_db)):
    """Add players to line"""
    line = crud.get_line(db, line_id)
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")

    # Verify all players belong to the same team
    if request.player_ids:
        players = crud.get_players_by_team(db, line.team_id)
        player_ids_set = {p.id for p in players}
        invalid_players = set(request.player_ids) - player_ids_set
        if invalid_players:
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in team {line.team_id}"
            )

    return crud.add_players_to_line(db, line_id, request.player_ids)


@router.delete("/{line_id}/players", response_model=schemas.LineWithPlayers)
def remove_players_from_line(line_id: int, request: PlayerIdsRequest, db: Session = Depends(get_db)):
    """Remove players from line"""
    line = crud.get_line(db, line_id)
    if not line:
        raise HTTPException(status_code=404, detail="Line not found")

    return crud.remove_players_from_line(db, line_id, request.player_ids)
