# Re-export all CRUD functions for backward compatibility
# This allows imports like: from app.crud import create_team, get_team, etc.

from app.crud.teams import (
    create_team,
    get_team,
    get_teams,
    update_team,
    delete_team,
)

from app.crud.players import (
    create_player,
    get_player,
    get_players_by_team,
    update_player,
    delete_player,
)

from app.crud.games import (
    create_game,
    get_game,
    get_all_games,
    get_games_by_team,
    update_game,
    finish_game,
    delete_game,
    get_game_score,
    get_game_detail,
)

from app.crud.points import (
    create_point,
    get_point,
    get_points_by_game,
    update_point,
    delete_point,
    finish_point,
    get_active_point_for_game,
    cancel_point,
)

__all__ = [
    # Teams
    "create_team",
    "get_team",
    "get_teams",
    "update_team",
    "delete_team",
    # Players
    "create_player",
    "get_player",
    "get_players_by_team",
    "update_player",
    "delete_player",
    # Games
    "create_game",
    "get_game",
    "get_all_games",
    "get_games_by_team",
    "update_game",
    "finish_game",
    "delete_game",
    "get_game_score",
    "get_game_detail",
    # Points
    "create_point",
    "get_point",
    "get_points_by_game",
    "update_point",
    "delete_point",
    "finish_point",
    "get_active_point_for_game",
    "cancel_point",
]
