from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/games",
    tags=["games"]
)


@router.post("", response_model=schemas.Game, status_code=201)
def create_game(game: schemas.GameCreate, db: Session = Depends(get_db)):
    # Verify team exists
    team = crud.get_team(db, game.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return crud.create_game(db, game)


@router.get("/{game_id}", response_model=schemas.GameDetail)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game_detail = crud.get_game_detail(db, game_id)
    if not game_detail:
        raise HTTPException(status_code=404, detail="Game not found")
    return game_detail


@router.put("/{game_id}", response_model=schemas.Game)
def update_game(game_id: int, game_update: schemas.GameUpdate, db: Session = Depends(get_db)):
    game = crud.update_game(db, game_id, game_update)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.post("/{game_id}/finish", response_model=schemas.Game)
def finish_game(game_id: int, db: Session = Depends(get_db)):
    game = crud.finish_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, db: Session = Depends(get_db)):
    success = crud.delete_game(db, game_id)
    if not success:
        raise HTTPException(status_code=404, detail="Game not found")


# Nested endpoints for game resources
@router.get("/{game_id}/points", response_model=List[schemas.PointWithPlayers])
def list_game_points(game_id: int, db: Session = Depends(get_db)):
    return crud.get_points_by_game(db, game_id)
