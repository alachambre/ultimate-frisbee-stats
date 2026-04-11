from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app import schemas, crud
from app.auth.context import AccessContext
from app.auth.dependencies import get_request_access_context, require_team_member
from app.auth.redaction import (
    serialize_game_detail,
    serialize_games_with_score,
    serialize_points,
    serialize_turnovers,
)
from app.database import get_db
from app.logging_config import get_logger

logger = get_logger("routers.games")

router = APIRouter(
    prefix="/games",
    tags=["games"]
)


@router.get("", response_model=List[schemas.GameWithScore])
def list_games(
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    games = crud.get_all_games(db)
    # Transform to include scores, team name, and competition name
    result = []
    for game in games:
        competition = crud.get_competition(db, game.competition_id)
        result.append({
            **game.__dict__,
            "our_score": crud.get_game_score(db, game.id)[0],
            "opponent_score": crud.get_game_score(db, game.id)[1],
            "team_name": competition.team.name if competition and competition.team else "Unknown",
            "competition_name": competition.name if competition else "Unknown",
        })
    return serialize_games_with_score(result, access_context)


@router.post("", response_model=schemas.Game, status_code=201)
def create_game(
    game: schemas.GameCreate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    # Verify competition exists
    competition = crud.get_competition(db, game.competition_id)
    if not competition:
        logger.warning(
            f"Failed to create game: competition {game.competition_id} not found"
        )
        raise HTTPException(status_code=404, detail="Competition not found")

    # If no players specified, use all competition roster players
    if not game.player_ids:
        game.player_ids = [p.id for p in competition.players]
    else:
        # Verify all players are in competition roster
        roster_player_ids = {p.id for p in competition.players}
        invalid_players = set(game.player_ids) - roster_player_ids
        if invalid_players:
            logger.warning(
                f"Failed to create game: players {invalid_players} not in competition {game.competition_id} roster"
            )
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in competition roster"
            )

    created_game = crud.create_game(db, game)
    logger.info(
        f"Game created: id={created_game.id}, competition={game.competition_id}, "
        f"opponent={game.opponent_name}, players={len(game.player_ids)}"
    )
    return created_game


@router.get("/{game_id}", response_model=schemas.GameDetail)
def get_game(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    game_detail = crud.get_game_detail(db, game_id)
    if not game_detail:
        raise HTTPException(status_code=404, detail="Game not found")
    return serialize_game_detail(game_detail, access_context)


@router.put("/{game_id}", response_model=schemas.Game)
def update_game(
    game_id: int,
    game_update: schemas.GameUpdate,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    game = crud.update_game(db, game_id, game_update)
    if not game:
        logger.warning(f"Failed to update game: game {game_id} not found")
        raise HTTPException(status_code=404, detail="Game not found")

    # Log status changes (important for tracking game lifecycle)
    if game_update.status:
        logger.info(f"Game {game_id} status changed to {game_update.status.value}")

    return game


@router.post("/{game_id}/finish", response_model=schemas.Game)
def finish_game(
    game_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    game = crud.finish_game(db, game_id)
    if not game:
        logger.warning(f"Failed to finish game: game {game_id} not found")
        raise HTTPException(status_code=404, detail="Game not found")

    logger.info(f"Game {game_id} finished")
    return game


@router.delete("/{game_id}", status_code=204)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    success = crud.delete_game(db, game_id)
    if not success:
        raise HTTPException(status_code=404, detail="Game not found")


# Nested endpoints for game resources
@router.get("/{game_id}/points", response_model=List[schemas.PointWithPlayers])
def list_game_points(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    return serialize_points(crud.get_points_by_game(db, game_id), access_context)


@router.get("/{game_id}/turnovers", response_model=List[schemas.TurnoverWithPlayer])
def list_game_turnovers(
    game_id: int,
    db: Session = Depends(get_db),
    access_context: AccessContext = Depends(get_request_access_context),
):
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return serialize_turnovers(crud.get_turnovers_by_game(db, game_id), access_context)


@router.get("/{game_id}/players", response_model=List[schemas.Player])
def list_game_players(game_id: int, db: Session = Depends(get_db)):
    """Get all selected players for this game"""
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game.players


class PlayerIdsRequest(BaseModel):
    player_ids: List[int]


@router.post("/{game_id}/players", response_model=schemas.Game)
def add_players_to_game(
    game_id: int,
    request: PlayerIdsRequest,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Add players to game (must be from competition roster)"""
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    # Verify all players are in competition roster
    if request.player_ids:
        competition = crud.get_competition(db, game.competition_id)
        roster_player_ids = {p.id for p in competition.players}
        invalid_players = set(request.player_ids) - roster_player_ids
        if invalid_players:
            raise HTTPException(
                status_code=400,
                detail=f"Players {invalid_players} not found in competition roster"
            )

    return crud.add_players_to_game(db, game_id, request.player_ids)


@router.delete("/{game_id}/players", response_model=schemas.Game)
def remove_players_from_game(
    game_id: int,
    request: PlayerIdsRequest,
    db: Session = Depends(get_db),
    _access_context: AccessContext = Depends(require_team_member),
):
    """Remove players from game"""
    game = crud.get_game(db, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    try:
        return crud.remove_players_from_game(db, game_id, request.player_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
