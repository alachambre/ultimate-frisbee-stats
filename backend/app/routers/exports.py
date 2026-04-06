"""
CSV export endpoints for statistics.
"""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.auth.dependencies import require_team_analyst
from app.database import get_db
from app.crud import statistics_exports as crud

router = APIRouter(
    prefix="/exports",
    tags=["exports"],
    dependencies=[Depends(require_team_analyst)],
)


def _csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/games/{game_id}/csv")
def export_game_statistics_csv(
    game_id: int,
    detail: Literal["summary", "full"] = "summary",
    db: Session = Depends(get_db),
):
    """
    Export game statistics as a CSV file.
    """
    result = crud.get_game_statistics_csv(db, game_id, detail_mode=detail)
    if not result:
        raise HTTPException(status_code=404, detail="Game not found")

    content, filename = result
    return _csv_response(content, filename)


@router.get("/competitions/{competition_id}/csv")
def export_competition_statistics_csv(
    competition_id: int,
    detail: Literal["summary", "full"] = "summary",
    db: Session = Depends(get_db),
):
    """
    Export competition statistics as a CSV file.
    """
    result = crud.get_competition_statistics_csv(db, competition_id, detail_mode=detail)
    if not result:
        raise HTTPException(status_code=404, detail="Competition not found")

    content, filename = result
    return _csv_response(content, filename)


@router.get("/teams/{team_id}/csv")
def export_team_statistics_csv(
    team_id: int,
    detail: Literal["summary", "full"] = "summary",
    db: Session = Depends(get_db),
):
    """
    Export team statistics as a CSV file.
    """
    result = crud.get_team_statistics_csv(db, team_id, detail_mode=detail)
    if not result:
        raise HTTPException(status_code=404, detail="Team not found")

    content, filename = result
    return _csv_response(content, filename)
