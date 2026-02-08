"""Game scope CSV export builder."""

from __future__ import annotations

from typing import List, Literal, Optional, Tuple

from sqlalchemy.orm import Session

from app.crud import games as games_crud
from app.crud import statistics as statistics_crud
from app.crud.statistics_calculations import build_live_player_stats
from app.crud.statistics_exports_formatters import enum_value, format_datetime, to_csv
from app.crud.statistics_exports_sections import (
    append_player_statistics,
    append_points_sections,
    append_strategy_statistics,
    append_team_statistics,
)
from app.crud.statistics_queries import get_game, get_stoppages_for_points, get_turnovers_for_points


def get_game_statistics_csv(
    db: Session,
    game_id: int,
    detail_mode: Literal["summary", "full"] = "summary",
) -> Optional[Tuple[str, str]]:
    game = get_game(db, game_id)
    if not game:
        return None

    game_detail = games_crud.get_game_detail(db, game_id)
    if not game_detail:
        return None

    team_stats = statistics_crud.get_game_team_stats(db, game_id)
    strategy_stats = statistics_crud.get_game_strategy_stats(db, game_id)

    points = game_detail.get("points", [])
    point_ids = [point.id for point in points]
    stoppages_by_point = get_stoppages_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)
    player_stats = statistics_crud.get_live_game_player_stats(db, game_id)
    if not player_stats and points:
        # Be resilient to missing game roster by deriving player set from points.
        players_by_id = {}
        for point in points:
            for player in point.players:
                players_by_id[player.id] = player
        if players_by_id:
            player_stats = build_live_player_stats(
                points,
                list(players_by_id.values()),
                stoppages_by_point,
                turnovers_by_point,
            )

    rows: List[List[str]] = []
    rows.append(["GAME INFORMATION"])
    rows.append(["Competition", game_detail.get("competition_name", "")])
    rows.append(
        [
            "Teams",
            f"{game_detail.get('team_name', '')} vs {game_detail.get('opponent_name', '')}",
        ]
    )
    rows.append(
        [
            "Score",
            f"{game_detail.get('our_score', 0)} - {game_detail.get('opponent_score', 0)}",
        ]
    )
    rows.append(["Status", enum_value(game_detail.get("status"))])
    rows.append(["Date", format_datetime(game_detail.get("date"))])
    rows.append(["Start Time", format_datetime(game_detail.get("start_datetime"))])
    rows.append(["End Time", format_datetime(game_detail.get("end_datetime"))])
    rows.append([])

    append_team_statistics(rows, team_stats)
    append_player_statistics(rows, player_stats)
    append_strategy_statistics(rows, strategy_stats)
    append_points_sections(
        rows,
        points,
        stoppages_by_point,
        turnovers_by_point,
        detail_mode=detail_mode,
        include_game_columns=False,
    )

    return to_csv(rows), f"game-{game_id}-statistics.csv"
