from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app import schemas, crud
from app.database import get_db
from app.logging_config import get_logger

logger = get_logger("routers.calls")

router = APIRouter(
    prefix="/calls",
    tags=["calls"]
)


@router.post("", response_model=schemas.Call, status_code=201)
def create_call(call: schemas.CallCreate, db: Session = Depends(get_db)):
    """Create a new call."""
    try:
        created_call = crud.create_call(db, call)
        logger.info(
            f"Call created: id={created_call.id}, point={call.point_id}, "
            f"resume={'resolved' if call.resume_timestamp else 'pending'}"
        )
        return created_call
    except ValueError as e:
        logger.warning(f"Failed to create call: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{call_id}", response_model=schemas.Call)
def get_call(call_id: int, db: Session = Depends(get_db)):
    """Get a specific call."""
    call = crud.get_call(db, call_id)
    if not call:
        logger.warning(f"Call {call_id} not found")
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.put("/{call_id}", response_model=schemas.Call)
def update_call(call_id: int, call_update: schemas.CallUpdate, db: Session = Depends(get_db)):
    """Update a call (typically to set resume_timestamp)."""
    try:
        call = crud.update_call(db, call_id, call_update)
        if not call:
            logger.warning(f"Failed to update call: call {call_id} not found")
            raise HTTPException(status_code=404, detail="Call not found")

        if call_update.resume_timestamp:
            logger.info(f"Call {call_id} resolved with resume timestamp")

        return call
    except ValueError as e:
        logger.warning(f"Failed to update call {call_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{call_id}", status_code=204)
def delete_call(call_id: int, db: Session = Depends(get_db)):
    """Delete a call."""
    success = crud.delete_call(db, call_id)
    if not success:
        logger.warning(f"Failed to delete call: call {call_id} not found")
        raise HTTPException(status_code=404, detail="Call not found")

    logger.info(f"Call {call_id} deleted")


# Nested endpoint for point's calls
@router.get("/points/{point_id}/calls", response_model=List[schemas.Call])
def list_point_calls(point_id: int, db: Session = Depends(get_db)):
    """Get all calls for a specific point."""
    return crud.get_calls_by_point(db, point_id)
