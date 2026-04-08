"""Team scope CSV export builder."""

from __future__ import annotations

from typing import Dict, List, Literal, Optional, Tuple

from sqlalchemy.orm import Session

from app.crud import competitions as competitions_crud
from app.crud import games as games_crud
from app.crud import statistics as statistics_crud
from app.crud.statistics_exports_formatters import enum_value, format_date, format_datetime, to_csv
from app.crud.statistics_exports_sections import (
    append_competitions_overview,
    append_games_overview,
    append_player_statistics,
    append_points_sections,
    append_strategy_statistics,
    append_team_statistics,
)
from app.crud.statistics_queries import (
    filter_points_by_player_ids,
    get_completed_points_for_team,
    get_stoppages_for_points,
    get_team,
    get_turnovers_for_points,
)


def get_team_statistics_csv(
    db: Session,
    team_id: int,
    detail_mode: Literal["summary", "full"] = "summary",
    required_player_ids: Optional[List[int]] = None,
    competition_ids: Optional[List[int]] = None,
    game_ids: Optional[List[int]] = None,
) -> Optional[Tuple[str, str]]:
    team = get_team(db, team_id)
    if not team:
        return None

    team_stats = statistics_crud.get_team_team_stats(
        db,
        team_id,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
    )
    player_stats = (
        statistics_crud.get_team_player_stats(
            db,
            team_id,
            required_player_ids=required_player_ids,
            competition_ids=competition_ids,
            game_ids=game_ids,
        )
        or []
    )
    strategy_stats = statistics_crud.get_team_strategy_stats(
        db,
        team_id,
        required_player_ids=required_player_ids,
        competition_ids=competition_ids,
        game_ids=game_ids,
    )
    completed_points = filter_points_by_player_ids(
        get_completed_points_for_team(
            db,
            team_id,
            competition_ids=competition_ids,
            game_ids=game_ids,
        ),
        required_player_ids,
    )
    point_ids = [point.id for point in completed_points]
    stoppages_by_point = get_stoppages_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    all_competitions = sorted(
        competitions_crud.get_competitions(db, team_id=team_id, skip=0, limit=10000),
        key=lambda competition: competition.start_date,
    )
    filtered_games = sorted(games_crud.get_games_by_team(db, team_id), key=lambda item: item.date)
    if competition_ids:
        competition_ids_set = set(competition_ids)
        filtered_games = [
            game for game in filtered_games if game.competition_id in competition_ids_set
        ]
    if game_ids:
        game_ids_set = set(game_ids)
        filtered_games = [game for game in filtered_games if game.id in game_ids_set]

    if game_ids:
        represented_competition_ids = {game.competition_id for game in filtered_games}
        competitions = [
            competition
            for competition in all_competitions
            if competition.id in represented_competition_ids
        ]
    elif competition_ids:
        competition_ids_set = set(competition_ids)
        competitions = [
            competition
            for competition in all_competitions
            if competition.id in competition_ids_set
        ]
    else:
        competitions = all_competitions

    competition_summary: List[Dict] = [
        {
            "name": competition.name,
            "status": enum_value(competition.status),
            "start_date": format_date(competition.start_date),
            "end_date": format_date(competition.end_date),
        }
        for competition in competitions
    ]

    team_games: List[Dict] = []
    for game in filtered_games:
        our_score, opponent_score = games_crud.get_game_score(db, game.id)
        team_games.append(
            {
                "date": format_datetime(game.date),
                "competition_name": game.competition.name if game.competition else "",
                "opponent": game.opponent_name,
                "status": enum_value(game.status),
                "our_score": our_score,
                "opponent_score": opponent_score,
            }
        )

    rows: List[List[str]] = []
    rows.append(["TEAM INFORMATION"])
    rows.append(["Name", team.name])
    rows.append(["Competitions", str(len(competitions))])
    rows.append(["Games", str(len(team_games))])
    rows.append([])

    append_competitions_overview(rows, competition_summary)
    append_games_overview(rows, team_games, include_competition_column=True)
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

    return to_csv(rows), f"team-{team_id}-statistics.csv"
