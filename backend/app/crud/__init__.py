# Re-export all CRUD functions for backward compatibility
# This allows imports like: from app.crud import create_team, get_team, etc.

from app.crud.teams import (
    create_team,
    get_team,
    get_teams,
    update_team,
    delete_team,
)

from app.crud.competitions import (
    create_competition,
    get_competition,
    get_competitions,
    update_competition,
    delete_competition,
    add_players_to_competition,
    remove_players_from_competition,
    get_competition_players,
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
    get_games_by_competition,
    update_game,
    finish_game,
    delete_game,
    get_game_score,
    get_game_detail,
    add_players_to_game,
    remove_players_from_game,
)

from app.crud.points import (
    create_point,
    get_point,
    get_points_by_game,
    update_point,
    delete_point,
    finish_point,
    get_running_point_for_game,
    get_active_point_for_game,
    cancel_point,
)

from app.crud.lines import (
    create_line,
    get_line,
    get_lines,
    update_line,
    delete_line,
    add_players_to_line,
    remove_players_from_line,
    get_line_players,
)

from app.crud.strategies import (
    create_strategy,
    get_strategy,
    get_strategies,
    update_strategy,
    delete_strategy,
)

from app.crud.stoppages import (
    create_stoppage,
    get_stoppage,
    get_stoppages_by_point,
    update_stoppage,
    delete_stoppage,
)

from app.crud.halftimes import (
    create_halftime,
    get_halftime,
    get_halftime_by_game,
    update_halftime,
    delete_halftime,
)

from app.crud.turnovers import (
    create_turnover,
    get_turnover,
    get_turnovers_by_point,
    get_turnovers_by_game,
    get_turnovers_by_player,
    update_turnover,
    delete_turnover,
)

from app.crud.users import (
    count_active_admin_users,
    create_user,
    get_user,
    get_user_by_auth_user_id,
    get_user_by_email,
    get_users,
    update_user,
)

__all__ = [
    # Teams
    "create_team",
    "get_team",
    "get_teams",
    "update_team",
    "delete_team",
    # Competitions
    "create_competition",
    "get_competition",
    "get_competitions",
    "update_competition",
    "delete_competition",
    "add_players_to_competition",
    "remove_players_from_competition",
    "get_competition_players",
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
    "get_games_by_competition",
    "update_game",
    "finish_game",
    "delete_game",
    "get_game_score",
    "get_game_detail",
    "add_players_to_game",
    "remove_players_from_game",
    # Points
    "create_point",
    "get_point",
    "get_points_by_game",
    "update_point",
    "delete_point",
    "finish_point",
    "get_running_point_for_game",
    "get_active_point_for_game",
    "cancel_point",
    # Lines
    "create_line",
    "get_line",
    "get_lines",
    "update_line",
    "delete_line",
    "add_players_to_line",
    "remove_players_from_line",
    "get_line_players",
    # Strategies
    "create_strategy",
    "get_strategy",
    "get_strategies",
    "update_strategy",
    "delete_strategy",
    # Stoppages
    "create_stoppage",
    "get_stoppage",
    "get_stoppages_by_point",
    "update_stoppage",
    "delete_stoppage",
    # Halftimes
    "create_halftime",
    "get_halftime",
    "get_halftime_by_game",
    "update_halftime",
    "delete_halftime",
    # Turnovers
    "create_turnover",
    "get_turnover",
    "get_turnovers_by_point",
    "get_turnovers_by_game",
    "get_turnovers_by_player",
    "update_turnover",
    "delete_turnover",
    # Users
    "count_active_admin_users",
    "create_user",
    "get_user",
    "get_user_by_auth_user_id",
    "get_user_by_email",
    "get_users",
    "update_user",
]
