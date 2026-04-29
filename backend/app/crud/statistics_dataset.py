"""Shared statistics dataset builder.

This module keeps statistics data access in one place so calculators receive an
already-filtered point set plus only the related data they need.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Optional

from sqlalchemy.orm import Session

from app.crud.statistics_queries import (
    get_competition,
    get_competition_players,
    get_completed_points,
    get_completed_points_for_competition,
    get_completed_points_for_team,
    get_game,
    get_game_players,
    get_stoppages_for_points,
    get_strategies_by_ids,
    get_team,
    get_team_players,
    get_turnovers_for_points,
)
from app.models.player import Player
from app.models.point import Point
from app.models.stoppage import Stoppage
from app.models.strategy import Strategy
from app.models.turnover import Turnover


StatisticsScope = Literal["game", "competition", "team"]


@dataclass(frozen=True)
class StatisticsDatasetFilters:
    competition_ids: list[int] = field(default_factory=list)
    game_ids: list[int] = field(default_factory=list)
    player_ids: list[int] = field(default_factory=list)


@dataclass(frozen=True)
class StatisticsDataset:
    scope_type: StatisticsScope
    scope_id: int
    scope: Any
    filters: StatisticsDatasetFilters
    completed_points: list[Point]
    players: list[Player] = field(default_factory=list)
    turnovers_by_point: dict[int, list[Turnover]] = field(default_factory=dict)
    stoppages_by_point: dict[int, list[Stoppage]] = field(default_factory=dict)
    strategies_by_id: dict[int, Strategy] = field(default_factory=dict)

    @property
    def point_ids(self) -> list[int]:
        return [point.id for point in self.completed_points]


def normalize_filter_ids(values: Optional[list[int]]) -> list[int]:
    if not values:
        return []
    return sorted(set(values))


def build_statistics_dataset(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    *,
    required_player_ids: Optional[list[int]] = None,
    competition_ids: Optional[list[int]] = None,
    game_ids: Optional[list[int]] = None,
    require_timestamps: bool = False,
    include_players: bool = False,
    include_players_from_points: bool = False,
    include_turnovers: bool = False,
    include_stoppages: bool = False,
    include_strategies: bool = False,
) -> Optional[StatisticsDataset]:
    filters = StatisticsDatasetFilters(
        competition_ids=normalize_filter_ids(competition_ids),
        game_ids=normalize_filter_ids(game_ids),
        player_ids=normalize_filter_ids(required_player_ids),
    )

    scope = _get_scope(db, scope_type, scope_id)
    if scope is None:
        return None

    load_players = include_players or include_players_from_points
    completed_points = _get_completed_points_for_scope(
        db,
        scope_type,
        scope_id,
        filters=filters,
        require_timestamps=require_timestamps,
        load_players=load_players,
    )

    players = (
        _get_players_for_scope(
            db,
            scope_type,
            scope_id,
            filters=filters,
            completed_points=completed_points,
            include_players_from_points=include_players_from_points,
        )
        if include_players or include_players_from_points
        else []
    )

    point_ids = [point.id for point in completed_points]
    turnovers_by_point = (
        get_turnovers_for_points(db, point_ids) if include_turnovers else {}
    )
    stoppages_by_point = (
        get_stoppages_for_points(db, point_ids) if include_stoppages else {}
    )
    strategies_by_id = (
        get_strategies_by_ids(
            db,
            [point.strategy_id for point in completed_points if point.strategy_id],
        )
        if include_strategies
        else {}
    )

    return StatisticsDataset(
        scope_type=scope_type,
        scope_id=scope_id,
        scope=scope,
        filters=filters,
        completed_points=completed_points,
        players=players,
        turnovers_by_point=turnovers_by_point,
        stoppages_by_point=stoppages_by_point,
        strategies_by_id=strategies_by_id,
    )


def _get_scope(db: Session, scope_type: StatisticsScope, scope_id: int) -> Any:
    if scope_type == "game":
        return get_game(db, scope_id)
    if scope_type == "competition":
        return get_competition(db, scope_id)
    if scope_type == "team":
        return get_team(db, scope_id)
    raise ValueError(f"Unsupported statistics scope: {scope_type}")


def _get_completed_points_for_scope(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    *,
    filters: StatisticsDatasetFilters,
    require_timestamps: bool,
    load_players: bool,
) -> list[Point]:
    if scope_type == "game":
        return get_completed_points(
            db,
            scope_id,
            require_timestamps=require_timestamps,
            required_player_ids=filters.player_ids,
            load_players=load_players,
        )

    if scope_type == "competition":
        return get_completed_points_for_competition(
            db,
            scope_id,
            require_timestamps=require_timestamps,
            required_player_ids=filters.player_ids,
            load_players=load_players,
        )

    if scope_type == "team":
        return get_completed_points_for_team(
            db,
            scope_id,
            require_timestamps=require_timestamps,
            required_player_ids=filters.player_ids,
            competition_ids=filters.competition_ids,
            game_ids=filters.game_ids,
            load_players=load_players,
        )

    raise ValueError(f"Unsupported statistics scope: {scope_type}")


def _get_players_for_scope(
    db: Session,
    scope_type: StatisticsScope,
    scope_id: int,
    *,
    filters: StatisticsDatasetFilters,
    completed_points: list[Point],
    include_players_from_points: bool,
) -> list[Player]:
    if scope_type == "game":
        scope_players = get_game_players(db, scope_id)
    elif scope_type == "competition":
        scope_players = get_competition_players(db, scope_id)
    elif scope_type == "team":
        scope_players = get_team_players(
            db,
            scope_id,
            competition_ids=filters.competition_ids,
            game_ids=filters.game_ids,
        )
    else:
        raise ValueError(f"Unsupported statistics scope: {scope_type}")

    if not include_players_from_points:
        return scope_players

    players_by_id = {player.id: player for player in scope_players}
    for point in completed_points:
        for player in point.players:
            players_by_id.setdefault(player.id, player)

    return list(players_by_id.values())
