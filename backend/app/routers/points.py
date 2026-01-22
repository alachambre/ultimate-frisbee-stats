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
    if game.status.value == "ended":
        raise HTTPException(status_code=400, detail="Cannot add points to an ended game")

    # Verify strategy exists if provided
    if point.strategy_id:
        strategy = crud.get_strategy(db, point.strategy_id)
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")

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


@router.post("/{point_id}/finish", response_model=schemas.PointWithPlayers)
def finish_point(point_id: int, finish_data: schemas.PointFinish, db: Session = Depends(get_db)):
    try:
        point = crud.finish_point(db, point_id, finish_data)
        if not point:
            raise HTTPException(status_code=404, detail="Point not found")
        return point
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{point_id}/cancel", status_code=204)
def cancel_point(point_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.cancel_point(db, point_id)
        if not success:
            raise HTTPException(status_code=404, detail="Point not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/games/{game_id}/running", response_model=schemas.PointWithPlayers)
def get_running_point(game_id: int, db: Session = Depends(get_db)):
    """Get the running point for a game"""
    # Verify game exists
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    point = crud.get_running_point_for_game(db, game_id)
    if not point:
        raise HTTPException(status_code=404, detail="No running point found for this game")
    return point

