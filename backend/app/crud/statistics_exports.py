"""
CSV export builders for statistics scopes (game, competition, team).
"""
from __future__ import annotations

import csv
import io
from datetime import date, datetime, timezone
from typing import Dict, List, Literal, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.base import PointStatusEnum
from app.models.stoppage import Stoppage
from app.models.point import Point
from app.models.turnover import Turnover
from app.crud import competitions as competitions_crud
from app.crud import games as games_crud
from app.crud import statistics as statistics_crud
from app.crud.statistics_calculations import build_live_player_stats
from app.crud.statistics_queries import (
    get_stoppages_for_points,
    get_competition,
    get_completed_points_for_competition,
    get_completed_points_for_team,
    get_game,
    get_team,
    get_turnovers_for_points,
)


def _to_csv(rows: List[List[str]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerows(rows)
    return buffer.getvalue()


def _enum_value(value: object) -> str:
    if hasattr(value, "value"):
        return str(value.value)
    return str(value)


def _format_percent(value: float) -> str:
    return f"{value * 100:.0f}%"


def _format_time_mmss(seconds: int) -> str:
    minutes = seconds // 60
    remaining = seconds % 60
    return f"{minutes}:{remaining:02d}"


def _format_datetime(value: Optional[datetime]) -> str:
    if not value:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def _format_date(value: Optional[date]) -> str:
    if not value:
        return ""
    return value.isoformat()


def _append_team_statistics(rows: List[List[str]], team_stats: Optional[Dict]) -> None:
    if not team_stats or team_stats.get("total_completed_points", 0) == 0:
        return

    rows.append(["TEAM STATISTICS"])
    rows.append([])

    rows.append(["Offense"])
    rows.append(["Metric", "Count", "Total", "Percentage"])
    rows.append(
        [
            "Hold Rate",
            str(team_stats["offense"]["points_won"]),
            str(team_stats["offense"]["points_started"]),
            _format_percent(team_stats["offense"]["hold_rate"]),
        ]
    )
    rows.append(
        [
            "Clean Hold Rate",
            str(team_stats["offense"]["points_won_no_turnover"]),
            str(team_stats["offense"]["points_won"]),
            _format_percent(team_stats["offense"]["clean_hold_rate"]),
        ]
    )
    rows.append([])

    rows.append(["Defense"])
    rows.append(["Metric", "Count", "Total", "Percentage"])
    rows.append(
        [
            "Turnover Rate",
            str(team_stats["defense"]["points_with_turnover"]),
            str(team_stats["defense"]["points_started"]),
            _format_percent(team_stats["defense"]["turnover_rate"]),
        ]
    )
    rows.append(
        [
            "Break Rate",
            str(team_stats["defense"]["points_won"]),
            str(team_stats["defense"]["points_started"]),
            _format_percent(team_stats["defense"]["break_rate"]),
        ]
    )
    rows.append(
        [
            "Clean Break Rate",
            str(team_stats["defense"]["points_won_no_turnover"]),
            str(team_stats["defense"]["points_started"]),
            _format_percent(team_stats["defense"]["clean_break_rate"]),
        ]
    )
    rows.append(
        [
            "Pull Inbound Rate",
            str(team_stats["defense"]["pull_stats"]["inbound_pulls"]),
            str(team_stats["defense"]["pull_stats"]["total_pulls"]),
            _format_percent(team_stats["defense"]["pull_stats"]["inbound_rate"]),
        ]
    )
    rows.append([])


def _append_player_statistics(rows: List[List[str]], player_stats: List[Dict]) -> None:
    if not player_stats:
        return

    sorted_players = sorted(
        player_stats,
        key=lambda player: (
            player.get("player_number") is None,
            player.get("player_number") if player.get("player_number") is not None else 9999,
            player.get("player_name", ""),
        ),
    )

    rows.append(["PLAYER STATISTICS"])
    rows.append([])
    rows.append(
        [
            "Player Number",
            "Player Name",
            "Time",
            "Offense Points",
            "Offense Won",
            "Offense Hold Rate",
            "Offense Clean Points",
            "Offense Clean Hold Rate",
            "Defense Points",
            "Defense With Turnover",
            "Defense Turnover Rate",
            "Defense Won",
            "Defense Break Rate",
            "Defense Clean Breaks",
            "Defense Clean Break Rate",
        ]
    )

    for player in sorted_players:
        rows.append(
            [
                str(player.get("player_number") or ""),
                str(player.get("player_name", "")),
                _format_time_mmss(player.get("effective_time_seconds", 0)),
                str(player["offense"]["points_played"]),
                str(player["offense"]["points_won"]),
                _format_percent(player["offense"]["hold_rate"]),
                str(player["offense"]["points_won_no_turnover"]),
                _format_percent(player["offense"]["clean_hold_rate"]),
                str(player["defense"]["points_played"]),
                str(player["defense"]["points_with_turnover"]),
                _format_percent(player["defense"]["turnover_rate"]),
                str(player["defense"]["points_won"]),
                _format_percent(player["defense"]["break_rate"]),
                str(player["defense"]["points_won_no_turnover"]),
                _format_percent(player["defense"]["clean_break_rate"]),
            ]
        )
    rows.append([])


def _append_strategy_statistics(rows: List[List[str]], strategy_stats: Optional[Dict]) -> None:
    if not strategy_stats:
        return

    offense_strategies = strategy_stats.get("offense_strategies", [])
    defense_strategies = strategy_stats.get("defense_strategies", [])
    if not offense_strategies and not defense_strategies:
        return

    rows.append(["STRATEGY STATISTICS"])
    rows.append([])

    if offense_strategies:
        rows.append(["Offense Strategies"])
        rows.append(
            [
                "Strategy Name",
                "Points Played",
                "Points Won",
                "Hold Rate",
                "Clean Holds",
                "Clean Hold Rate",
                "Quick Scores",
                "Quick Score Rate",
            ]
        )
        for strategy in sorted(offense_strategies, key=lambda item: item["strategy_name"]):
            rows.append(
                [
                    strategy["strategy_name"],
                    str(strategy["points_played"]),
                    str(strategy["points_won"]),
                    _format_percent(strategy["hold_rate"]),
                    str(strategy["clean_holds"]),
                    _format_percent(strategy["clean_hold_rate"]),
                    str(strategy["quick_scores"]),
                    _format_percent(strategy["quick_score_rate"]),
                ]
            )
        rows.append([])

    if defense_strategies:
        rows.append(["Defense Strategies"])
        rows.append(
            [
                "Strategy Name",
                "Points Played",
                "Points Won",
                "Break Rate",
                "Points With Turnover",
                "Turnover Rate",
            ]
        )
        for strategy in sorted(defense_strategies, key=lambda item: item["strategy_name"]):
            rows.append(
                [
                    strategy["strategy_name"],
                    str(strategy["points_played"]),
                    str(strategy["points_won"]),
                    _format_percent(strategy["break_rate"]),
                    str(strategy["points_with_turnover"]),
                    _format_percent(strategy["turnover_rate"]),
                ]
            )
        rows.append([])


def _point_duration_seconds(point: Point) -> Optional[int]:
    if not point.start_datetime or not point.end_datetime:
        return None
    start = point.start_datetime
    end = point.end_datetime
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return max(0, int((end - start).total_seconds()))


def _stoppage_dead_time_seconds(stoppage: Stoppage) -> int:
    if not stoppage.call_timestamp or not stoppage.resume_timestamp:
        return 0
    start = stoppage.call_timestamp
    end = stoppage.resume_timestamp
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return max(0, int((end - start).total_seconds()))


def _append_point_details(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    include_game_context: bool = False,
) -> None:
    if not points:
        return

    rows.append(["POINTS DETAIL"])
    rows.append([])

    scores_by_game: Dict[int, List[int]] = {}
    points_ascending = sorted(
        points,
        key=lambda point: (
            _format_datetime(point.game.date) if include_game_context and point.game else "",
            point.game_id if include_game_context else 0,
            point.point_number,
        ),
    )
    for point in points_ascending:
        game_score = scores_by_game.setdefault(point.game_id, [0, 0])
        status_value = _enum_value(point.status)
        is_completed = status_value == PointStatusEnum.completed.value
        if is_completed and point.won is not None:
            if point.won:
                game_score[0] += 1
            else:
                game_score[1] += 1

        result = "In Progress" if point.won is None else ("Won" if point.won else "Lost")
        score_after = f"{game_score[0]} - {game_score[1]}" if is_completed and point.won is not None else "N/A"
        duration_seconds = _point_duration_seconds(point)
        player_names = ", ".join(
            sorted(
                f"#{player.number} {player.name}" if player.number is not None else player.name
                for player in point.players
            )
        )

        point_title = f"Point {point.point_number}"
        if include_game_context and point.game:
            point_title = (
                f"{point_title} - "
                f"{_format_datetime(point.game.date)} vs {point.game.opponent_name}"
            )
        rows.append([point_title])
        rows.append(["Field", "Value"])
        rows.append(["Type", "Offense" if point.starting_on_offense else "Defense"])
        rows.append(["Status", status_value])
        rows.append(["Result", result])
        rows.append(["Score After", score_after])
        rows.append(["Field Side", point.field_side or "N/A"])
        rows.append(
            [
                "Pull",
                "N/A" if point.pull is None else ("In" if point.pull else "Out"),
            ]
        )
        rows.append(["Strategy", point.strategy.name if point.strategy else "None"])
        rows.append(["Start Time", _format_datetime(point.start_datetime) or "Not started"])
        rows.append(["End Time", _format_datetime(point.end_datetime) or "Not ended"])
        rows.append(
            [
                "Duration",
                _format_time_mmss(duration_seconds) if duration_seconds is not None else "N/A",
            ]
        )
        rows.append(["Players", player_names or "None"])
        rows.append(["Comments", point.comments or ""])

        stoppages = stoppages_by_point.get(point.id, [])
        rows.append(["Stoppages", str(len(stoppages))])
        for index, stoppage in enumerate(stoppages, start=1):
            rows.append(
                [
                    f"Stoppage {index}",
                    (
                        f"type={stoppage.stoppage_type}, "
                        f"start={_format_datetime(stoppage.call_timestamp)}, "
                        f"resume={_format_datetime(stoppage.resume_timestamp) or 'ongoing'}, "
                        f"dead_time_seconds={_stoppage_dead_time_seconds(stoppage)}, "
                        f"comments={stoppage.comments or ''}"
                    ),
                ]
            )

        turnovers = turnovers_by_point.get(point.id, [])
        rows.append(["Turnovers", str(len(turnovers))])
        for index, turnover in enumerate(turnovers, start=1):
            rows.append(
                [
                    f"Turnover {index}",
                    (
                        f"time={_format_datetime(turnover.timestamp)}, "
                        f"player={turnover.player.name if turnover.player else 'Team'}, "
                        f"comments={turnover.comments or ''}"
                    ),
                ]
            )
        rows.append([])


def _append_points_summary(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    include_game_columns: bool = False,
) -> None:
    if not points:
        return

    rows.append(["POINTS SUMMARY"])
    rows.append([])
    header = [
        "Point",
        "Type",
        "Status",
        "Result",
        "Score After",
        "Start Time",
        "End Time",
        "Duration",
        "Field Side",
        "Pull",
        "Strategy",
        "Players",
        "Stoppages",
        "Turnovers",
        "Comments",
    ]
    if include_game_columns:
        header = ["Game Date", "Opponent"] + header
    rows.append(header)

    def sort_key(point: Point):
        game_date = point.game.date if include_game_columns and point.game else None
        if isinstance(game_date, datetime):
            if game_date.tzinfo is None:
                game_date = game_date.replace(tzinfo=timezone.utc)
        else:
            game_date = datetime.min.replace(tzinfo=timezone.utc)
        game_id = point.game_id if include_game_columns else 0
        return (game_date, game_id, point.point_number)

    scores_by_game: Dict[int, List[int]] = {}
    for point in sorted(points, key=sort_key):
        game_score = scores_by_game.setdefault(point.game_id, [0, 0])
        status_value = _enum_value(point.status)
        is_completed = status_value == PointStatusEnum.completed.value
        if is_completed and point.won is not None:
            if point.won:
                game_score[0] += 1
            else:
                game_score[1] += 1

        result = "In Progress" if point.won is None else ("Won" if point.won else "Lost")
        score_after = f"{game_score[0]} - {game_score[1]}" if is_completed and point.won is not None else "N/A"
        duration_seconds = _point_duration_seconds(point)
        players = ", ".join(
            sorted(
                f"#{player.number} {player.name}" if player.number is not None else player.name
                for player in point.players
            )
        )
        row = [
            str(point.point_number),
            "Offense" if point.starting_on_offense else "Defense",
            status_value,
            result,
            score_after,
            _format_datetime(point.start_datetime),
            _format_datetime(point.end_datetime),
            _format_time_mmss(duration_seconds) if duration_seconds is not None else "N/A",
            point.field_side or "",
            "N/A" if point.pull is None else ("In" if point.pull else "Out"),
            point.strategy.name if point.strategy else "",
            players,
            str(len(stoppages_by_point.get(point.id, []))),
            str(len(turnovers_by_point.get(point.id, []))),
            point.comments or "",
        ]
        if include_game_columns:
            row = [
                _format_datetime(point.game.date) if point.game else "",
                point.game.opponent_name if point.game else "",
            ] + row

        rows.append(row)
    rows.append([])


def _normalize_detail_mode(detail_mode: str) -> Literal["summary", "full"]:
    return "full" if detail_mode == "full" else "summary"


def _append_points_sections(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    detail_mode: str,
    include_game_columns: bool = False,
) -> None:
    if not points:
        return

    normalized_detail_mode = _normalize_detail_mode(detail_mode)
    _append_points_summary(
        rows,
        points,
        stoppages_by_point,
        turnovers_by_point,
        include_game_columns=include_game_columns,
    )
    if normalized_detail_mode == "full":
        _append_point_details(
            rows,
            points,
            stoppages_by_point,
            turnovers_by_point,
            include_game_context=include_game_columns,
        )


def _append_games_overview(
    rows: List[List[str]],
    games: List[Dict],
    include_competition_column: bool,
) -> None:
    if not games:
        return

    rows.append(["GAMES OVERVIEW"])
    rows.append([])
    header = ["Date", "Opponent", "Status", "Score"]
    if include_competition_column:
        header.insert(1, "Competition")
    rows.append(header)

    for game in games:
        row = [
            game["date"],
            game["opponent"],
            game["status"],
            f"{game['our_score']} - {game['opponent_score']}",
        ]
        if include_competition_column:
            row.insert(1, game.get("competition_name", ""))
        rows.append(row)
    rows.append([])


def _append_competitions_overview(rows: List[List[str]], competitions: List[Dict]) -> None:
    if not competitions:
        return

    rows.append(["COMPETITIONS OVERVIEW"])
    rows.append([])
    rows.append(["Name", "Status", "Start Date", "End Date"])
    for competition in competitions:
        rows.append(
            [
                competition["name"],
                competition["status"],
                competition["start_date"],
                competition["end_date"],
            ]
        )
    rows.append([])


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
    rows.append(["Status", _enum_value(game_detail.get("status"))])
    rows.append(["Date", _format_datetime(game_detail.get("date"))])
    rows.append(["Start Time", _format_datetime(game_detail.get("start_datetime"))])
    rows.append(["End Time", _format_datetime(game_detail.get("end_datetime"))])
    rows.append([])

    _append_team_statistics(rows, team_stats)
    _append_player_statistics(rows, player_stats)
    _append_strategy_statistics(rows, strategy_stats)
    _append_points_sections(
        rows,
        points,
        stoppages_by_point,
        turnovers_by_point,
        detail_mode=detail_mode,
        include_game_columns=False,
    )

    return _to_csv(rows), f"game-{game_id}-statistics.csv"


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
    completed_points = get_completed_points_for_competition(db, competition_id)
    point_ids = [point.id for point in completed_points]
    stoppages_by_point = get_stoppages_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    competition_games = []
    for game in sorted(games_crud.get_games_by_competition(db, competition_id), key=lambda item: item.date):
        our_score, opponent_score = games_crud.get_game_score(db, game.id)
        competition_games.append(
            {
                "date": _format_datetime(game.date),
                "opponent": game.opponent_name,
                "status": _enum_value(game.status),
                "our_score": our_score,
                "opponent_score": opponent_score,
            }
        )

    rows: List[List[str]] = []
    rows.append(["COMPETITION INFORMATION"])
    rows.append(["Name", competition.name])
    rows.append(["Team", competition.team.name if competition.team else "Unknown"])
    rows.append(["Status", _enum_value(competition.status)])
    rows.append(["Start Date", _format_date(competition.start_date)])
    rows.append(["End Date", _format_date(competition.end_date)])
    rows.append(["Games", str(len(competition_games))])
    rows.append([])

    _append_games_overview(rows, competition_games, include_competition_column=False)
    _append_team_statistics(rows, team_stats)
    _append_player_statistics(rows, player_stats)
    _append_strategy_statistics(rows, strategy_stats)
    _append_points_sections(
        rows,
        completed_points,
        stoppages_by_point,
        turnovers_by_point,
        detail_mode=detail_mode,
        include_game_columns=True,
    )

    return _to_csv(rows), f"competition-{competition_id}-statistics.csv"


def get_team_statistics_csv(
    db: Session,
    team_id: int,
    detail_mode: Literal["summary", "full"] = "summary",
) -> Optional[Tuple[str, str]]:
    team = get_team(db, team_id)
    if not team:
        return None

    team_stats = statistics_crud.get_team_team_stats(db, team_id)
    player_stats = statistics_crud.get_team_player_stats(db, team_id) or []
    strategy_stats = statistics_crud.get_team_strategy_stats(db, team_id)
    completed_points = get_completed_points_for_team(db, team_id)
    point_ids = [point.id for point in completed_points]
    stoppages_by_point = get_stoppages_for_points(db, point_ids)
    turnovers_by_point = get_turnovers_for_points(db, point_ids)

    competitions = sorted(
        competitions_crud.get_competitions(db, team_id=team_id, skip=0, limit=10000),
        key=lambda competition: competition.start_date,
    )
    competition_summary = [
        {
            "name": competition.name,
            "status": _enum_value(competition.status),
            "start_date": _format_date(competition.start_date),
            "end_date": _format_date(competition.end_date),
        }
        for competition in competitions
    ]

    team_games = []
    for game in sorted(games_crud.get_games_by_team(db, team_id), key=lambda item: item.date):
        our_score, opponent_score = games_crud.get_game_score(db, game.id)
        team_games.append(
            {
                "date": _format_datetime(game.date),
                "competition_name": game.competition.name if game.competition else "",
                "opponent": game.opponent_name,
                "status": _enum_value(game.status),
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

    _append_competitions_overview(rows, competition_summary)
    _append_games_overview(rows, team_games, include_competition_column=True)
    _append_team_statistics(rows, team_stats)
    _append_player_statistics(rows, player_stats)
    _append_strategy_statistics(rows, strategy_stats)
    _append_points_sections(
        rows,
        completed_points,
        stoppages_by_point,
        turnovers_by_point,
        detail_mode=detail_mode,
        include_game_columns=True,
    )

    return _to_csv(rows), f"team-{team_id}-statistics.csv"
