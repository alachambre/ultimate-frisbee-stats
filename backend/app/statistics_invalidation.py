"""Centralized statistics cache invalidation reasons for mutating routes."""

from enum import Enum
from typing import Union

from app.statistics_cache import clear_statistics_cache


class StatisticsCacheInvalidationReason(str, Enum):
    COMPETITION_CREATED = "competition_created"
    COMPETITION_UPDATED = "competition_updated"
    COMPETITION_DELETED = "competition_deleted"
    COMPETITION_PLAYERS_ADDED = "competition_players_added"
    COMPETITION_PLAYERS_REMOVED = "competition_players_removed"
    GAME_CREATED = "game_created"
    GAME_UPDATED = "game_updated"
    GAME_FINISHED = "game_finished"
    GAME_DELETED = "game_deleted"
    GAME_PLAYERS_ADDED = "game_players_added"
    GAME_PLAYERS_REMOVED = "game_players_removed"
    HALFTIME_CREATED = "halftime_created"
    HALFTIME_UPDATED = "halftime_updated"
    HALFTIME_DELETED = "halftime_deleted"
    PLAYER_CREATED = "player_created"
    PLAYER_UPDATED = "player_updated"
    PLAYER_DELETED = "player_deleted"
    POINT_CREATED = "point_created"
    POINT_UPDATED = "point_updated"
    POINT_DELETED = "point_deleted"
    POINT_FINISHED = "point_finished"
    POINT_CANCELLED = "point_cancelled"
    STOPPAGE_CREATED = "stoppage_created"
    STOPPAGE_UPDATED = "stoppage_updated"
    STOPPAGE_DELETED = "stoppage_deleted"
    STRATEGY_CREATED = "strategy_created"
    STRATEGY_UPDATED = "strategy_updated"
    STRATEGY_DELETED = "strategy_deleted"
    TEAM_CREATED = "team_created"
    TEAM_UPDATED = "team_updated"
    TEAM_DELETED = "team_deleted"
    TURNOVER_CREATED = "turnover_created"
    TURNOVER_UPDATED = "turnover_updated"
    TURNOVER_DELETED = "turnover_deleted"


def invalidate_statistics_cache(
    reason: Union[StatisticsCacheInvalidationReason, str],
) -> int:
    reason_value = (
        reason.value
        if isinstance(reason, StatisticsCacheInvalidationReason)
        else reason
    )
    return clear_statistics_cache(reason_value)
