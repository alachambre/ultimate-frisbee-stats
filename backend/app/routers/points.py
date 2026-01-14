from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db

router = APIRouter(
    prefix="/points",
    tags=["points"]
)


@router.post("", response_model=schemas.PointWithPlayers, status_code=201)
def create_point(point: schemas.PointCreate, db: Session = Depends(get_db)):
    # Verify game exists and is in progress
    game = crud.get_game(db, point.game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.status == "finished":
        raise HTTPException(status_code=400, detail="Cannot add points to a finished game")

    try:
        return crud.create_point(db, point)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{point_id}", response_model=schemas.PointWithPlayers)
def get_point(point_id: int, db: Session = Depends(get_db)):
    point = crud.get_point(db, point_id)
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return point


@router.put("/{point_id}", response_model=schemas.PointWithPlayers)
def update_point(point_id: int, point_update: schemas.PointUpdate, db: Session = Depends(get_db)):
    try:
        point = crud.update_point(db, point_id, point_update)
        if not point:
            raise HTTPException(status_code=404, detail="Point not found")
        return point
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{point_id}", status_code=204)
def delete_point(point_id: int, db: Session = Depends(get_db)):
    success = crud.delete_point(db, point_id)
    if not success:
        raise HTTPException(status_code=404, detail="Point not found")
