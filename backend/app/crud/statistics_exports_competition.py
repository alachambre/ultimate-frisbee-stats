"""Competition scope CSV export builder."""

from __future__ import annotations

from typing import Dict, List, Literal, Optional, Tuple

from sqlalchemy.orm import Session

from app.crud import games as games_crud
from app.crud import statistics as statistics_crud
from app.crud.statistics_exports_formatters import enum_value, format_date, format_datetime, to_csv
from app.crud.statistics_exports_sections import (
    append_games_overview,
    append_player_statistics,
    append_points_sections,
    append_strategy_statistics,
    append_team_statistics,
)
from app.crud.statistics_queries import (
    get_competition,
    get_completed_points_for_competition,
    get_stoppages_for_points,
    get_turnovers_for_points,
)


def get_competition_statistics_csv(
    db: Session,
    competition_id: int,
    detail_mode: Literal["summary", "full"] = "summary",
) -> Optional[Tuple[str, str]]:
    competition = get_competition(db, competition_id)
    if not competition:
        return None

    team_stats = statistics_crud.get_competition_team_stats(db, competition_id)
    player_stats = statistics_crud.get_competition_player_stats(db, competition_id) or []
    strategy_stats = statistics_crud.get_competition_strategy_stats(db, competition_id)
    completed_points = get_completed_points_for_competition(
        db,
        competition_id,
        load_players=True,
        load_strategy=True,
        load_game=True,
    )
    point_ids = [point.id for point in completed_points]
    stoppages_by_point = get_stoppages_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    competition_games: List[Dict] = []
    scored_games = games_crud.get_games_by_competition_with_scores(db, competition_id)
    for game in sorted(scored_games, key=lambda item: item["date"]):
        competition_games.append(
            {
                "date": format_datetime(game["date"]),
                "opponent": game["opponent_name"],
                "status": enum_value(game["status"]),
                "our_score": game["our_score"],
                "opponent_score": game["opponent_score"],
            }
        )

    rows: List[List[str]] = []
    rows.append(["COMPETITION INFORMATION"])
    rows.append(["Name", competition.name])
    rows.append(["Team", competition.team.name if competition.team else "Unknown"])
    rows.append(["Status", enum_value(competition.status)])
    rows.append(["Start Date", format_date(competition.start_date)])
    rows.append(["End Date", format_date(competition.end_date)])
    rows.append(["Games", str(len(competition_games))])
    rows.append([])

    append_games_overview(rows, competition_games, include_competition_column=False)
    append_team_statistics(rows, team_stats)
    append_player_statistics(rows, player_stats)
    append_strategy_statistics(rows, strategy_stats)
    append_points_sections(
        rows,
        completed_points,
        stoppages_by_point,
        turnovers_by_point,
        detail_mode=detail_mode,
        include_game_columns=True,
    )

    return to_csv(rows), f"competition-{competition_id}-statistics.csv"
