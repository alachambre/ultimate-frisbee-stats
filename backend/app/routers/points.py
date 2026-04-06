from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context
from app.auth.redaction import serialize_point
from app.database import get_db
from app.logging_config import get_logger

logger = get_logger("routers.points")

router = APIRouter(
    prefix="/points",
    tags=["points"]
)


@router.post("", response_model=schemas.PointWithPlayers, status_code=201)
def create_point(point: schemas.PointCreate, db: Session = Depends(get_db)):
    try:
        created_point = crud.create_point(db, point)
        player_count = len(point.player_ids) if point.player_ids else 0
        logger.info(
            f"Point created: id={created_point.id}, game={point.game_id}, "
            f"offense={point.starting_on_offense}, players={player_count}, status=ready"
        )
        return created_point
    except ValueError as e:
        logger.warning(
            f"Failed to create point for game {point.game_id}: {str(e)}"
        )
        # Map known not-found errors to 404
        error_text = str(e).lower()
        status_code = 404 if error_text in ["game not found", "strategy not found"] else 400
        raise HTTPException(status_code=status_code, detail=str(e))


@router.get("/{point_id}", response_model=schemas.PointWithPlayers)
def get_point(
    point_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    point = crud.get_point(db, point_id)
    if not point:
        raise HTTPException(status_code=404, detail="Point not found")
    return serialize_point(point, access_context)


@router.put("/{point_id}", response_model=schemas.PointWithPlayers)
def update_point(point_id: int, point_update: schemas.PointUpdate, db: Session = Depends(get_db)):
    try:
        point = crud.update_point(db, point_id, point_update)
        if not point:
            logger.warning(f"Failed to update point: point {point_id} not found")
            raise HTTPException(status_code=404, detail="Point not found")

        # Log status changes (important for tracking point lifecycle)
        if point_update.status:
            logger.info(f"Point {point_id} status changed to {point_update.status.value}")

        return point
    except ValueError as e:
        logger.warning(f"Failed to update point {point_id}: {str(e)}")
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
            logger.warning(f"Failed to finish point: point {point_id} not found")
            raise HTTPException(status_code=404, detail="Point not found")

        logger.info(f"Point {point_id} finished: won={finish_data.won}")
        return point
    except ValueError as e:
        logger.warning(f"Failed to finish point {point_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{point_id}/cancel", status_code=204)
def cancel_point(point_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.cancel_point(db, point_id)
        if not success:
            logger.warning(f"Failed to cancel point: point {point_id} not found")
            raise HTTPException(status_code=404, detail="Point not found")

        logger.info(f"Point {point_id} cancelled")
    except ValueError as e:
        logger.warning(f"Failed to cancel point {point_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/games/{game_id}/running", response_model=schemas.PointWithPlayers)
def get_running_point(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get the running point for a game"""
    # Verify game exists
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    point = crud.get_running_point_for_game(db, game_id)
    if not point:
        raise HTTPException(status_code=404, detail="No running point found for this game")
    return serialize_point(point, access_context)


@router.get("/games/{game_id}/active", response_model=schemas.PointWithPlayers)
def get_active_point(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    """Get the active (ready or running) point for a game"""
    # Verify game exists
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    point = crud.get_active_point_for_game(db, game_id)
    if not point:
        raise HTTPException(status_code=404, detail="No active point found for this game")
    return serialize_point(point, access_context)
