"""Section builders shared by statistics CSV exports."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List

from app.models.base import PointStatusEnum
from app.models.point import Point
from app.models.stoppage import Stoppage
from app.models.turnover import Turnover
from app.crud.statistics_exports_formatters import (
    enum_value,
    format_datetime,
    format_percent,
    format_time_mmss,
    normalize_detail_mode,
    point_duration_seconds,
    stoppage_dead_time_seconds,
)


def _field_side_label(field_side: str) -> str:
    return "Left Side" if field_side == "table_left" else "Right Side"


def _format_field_side_percentage(
    points_started: int,
    rate: float,
) -> str:
    return format_percent(rate) if points_started > 0 else "-"


def append_team_statistics(
    rows: List[List[str]],
    team_stats: Dict | None,
    *,
    include_field_side_stats: bool = False,
) -> None:
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
            format_percent(team_stats["offense"]["hold_rate"]),
        ]
    )
    rows.append(
        [
            "Clean Hold Rate",
            str(team_stats["offense"]["points_won_no_turnover"]),
            str(team_stats["offense"]["points_won"]),
            format_percent(team_stats["offense"]["clean_hold_rate"]),
        ]
    )
    if include_field_side_stats:
        offense_field_side_stats = team_stats.get("field_side_stats", {})
        for field_side in ("table_left", "table_right"):
            side_stats = offense_field_side_stats.get(field_side, {}).get("offense", {})
            rows.append(
                [
                    f"Hold Rate ({_field_side_label(field_side)})",
                    str(side_stats.get("points_won", 0)),
                    str(side_stats.get("points_started", 0)),
                    _format_field_side_percentage(
                        side_stats.get("points_started", 0),
                        side_stats.get("hold_rate", 0),
                    ),
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
            format_percent(team_stats["defense"]["turnover_rate"]),
        ]
    )
    rows.append(
        [
            "Break Rate",
            str(team_stats["defense"]["points_won"]),
            str(team_stats["defense"]["points_started"]),
            format_percent(team_stats["defense"]["break_rate"]),
        ]
    )
    rows.append(
        [
            "Clean Break Rate",
            str(team_stats["defense"]["points_won_no_turnover"]),
            str(team_stats["defense"]["points_started"]),
            format_percent(team_stats["defense"]["clean_break_rate"]),
        ]
    )
    rows.append(
        [
            "Pull Inbound Rate",
            str(team_stats["defense"]["pull_stats"]["inbound_pulls"]),
            str(team_stats["defense"]["pull_stats"]["total_pulls"]),
            format_percent(team_stats["defense"]["pull_stats"]["inbound_rate"]),
        ]
    )
    if include_field_side_stats:
        defense_field_side_stats = team_stats.get("field_side_stats", {})
        for field_side in ("table_left", "table_right"):
            side_stats = defense_field_side_stats.get(field_side, {}).get("defense", {})
            rows.append(
                [
                    f"Break Rate ({_field_side_label(field_side)})",
                    str(side_stats.get("points_won", 0)),
                    str(side_stats.get("points_started", 0)),
                    _format_field_side_percentage(
                        side_stats.get("points_started", 0),
                        side_stats.get("break_rate", 0),
                    ),
                ]
            )
    rows.append([])


def append_player_statistics(rows: List[List[str]], player_stats: List[Dict]) -> None:
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
                format_time_mmss(player.get("effective_time_seconds", 0)),
                str(player["offense"]["points_played"]),
                str(player["offense"]["points_won"]),
                format_percent(player["offense"]["hold_rate"]),
                str(player["offense"]["points_won_no_turnover"]),
                format_percent(player["offense"]["clean_hold_rate"]),
                str(player["defense"]["points_played"]),
                str(player["defense"]["points_with_turnover"]),
                format_percent(player["defense"]["turnover_rate"]),
                str(player["defense"]["points_won"]),
                format_percent(player["defense"]["break_rate"]),
                str(player["defense"]["points_won_no_turnover"]),
                format_percent(player["defense"]["clean_break_rate"]),
            ]
        )
    rows.append([])


def append_strategy_statistics(rows: List[List[str]], strategy_stats: Dict | None) -> None:
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
                    format_percent(strategy["hold_rate"]),
                    str(strategy["clean_holds"]),
                    format_percent(strategy["clean_hold_rate"]),
                    str(strategy["quick_scores"]),
                    format_percent(strategy["quick_score_rate"]),
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
                    format_percent(strategy["break_rate"]),
                    str(strategy["points_with_turnover"]),
                    format_percent(strategy["turnover_rate"]),
                ]
            )
        rows.append([])


def append_point_details(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    *,
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
            format_datetime(point.game.date) if include_game_context and point.game else "",
            point.game_id if include_game_context else 0,
            point.point_number,
        ),
    )
    for point in points_ascending:
        game_score = scores_by_game.setdefault(point.game_id, [0, 0])
        status_value = enum_value(point.status)
        is_completed = status_value == PointStatusEnum.completed.value
        if is_completed and point.won is not None:
            if point.won:
                game_score[0] += 1
            else:
                game_score[1] += 1

        result = "In Progress" if point.won is None else ("Won" if point.won else "Lost")
        score_after = f"{game_score[0]} - {game_score[1]}" if is_completed and point.won is not None else "N/A"
        duration_seconds = point_duration_seconds(point)
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
                f"{format_datetime(point.game.date)} vs {point.game.opponent_name}"
            )
        rows.append([point_title])
        rows.append(["Field", "Value"])
        rows.append(["Type", "Offense" if point.starting_on_offense else "Defense"])
        rows.append(["Status", status_value])
        rows.append(["Result", result])
        rows.append(["Score After", score_after])
        rows.append(["Field Side", point.field_side or "N/A"])
        rows.append(["Pull", "N/A" if point.pull is None else ("In" if point.pull else "Out")])
        rows.append(["Strategy", point.strategy.name if point.strategy else "None"])
        rows.append(["Start Time", format_datetime(point.start_datetime) or "Not started"])
        rows.append(["End Time", format_datetime(point.end_datetime) or "Not ended"])
        rows.append(
            [
                "Duration",
                format_time_mmss(duration_seconds) if duration_seconds is not None else "N/A",
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
                        f"start={format_datetime(stoppage.call_timestamp)}, "
                        f"resume={format_datetime(stoppage.resume_timestamp) or 'ongoing'}, "
                        f"dead_time_seconds={stoppage_dead_time_seconds(stoppage)}, "
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
                        f"time={format_datetime(turnover.timestamp)}, "
                        f"player={turnover.player.name if turnover.player else 'Team'}, "
                        f"comments={turnover.comments or ''}"
                    ),
                ]
            )
        rows.append([])


def append_points_summary(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    *,
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
        status_value = enum_value(point.status)
        is_completed = status_value == PointStatusEnum.completed.value
        if is_completed and point.won is not None:
            if point.won:
                game_score[0] += 1
            else:
                game_score[1] += 1

        result = "In Progress" if point.won is None else ("Won" if point.won else "Lost")
        score_after = f"{game_score[0]} - {game_score[1]}" if is_completed and point.won is not None else "N/A"
        duration_seconds = point_duration_seconds(point)
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
            format_datetime(point.start_datetime),
            format_datetime(point.end_datetime),
            format_time_mmss(duration_seconds) if duration_seconds is not None else "N/A",
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
                format_datetime(point.game.date) if point.game else "",
                point.game.opponent_name if point.game else "",
            ] + row

        rows.append(row)
    rows.append([])


def append_points_sections(
    rows: List[List[str]],
    points: List[Point],
    stoppages_by_point: Dict[int, List[Stoppage]],
    turnovers_by_point: Dict[int, List[Turnover]],
    *,
    detail_mode: str,
    include_game_columns: bool = False,
) -> None:
    if not points:
        return

    normalized_detail_mode = normalize_detail_mode(detail_mode)
    append_points_summary(
        rows,
        points,
        stoppages_by_point,
        turnovers_by_point,
        include_game_columns=include_game_columns,
    )
    if normalized_detail_mode == "full":
        append_point_details(
            rows,
            points,
            stoppages_by_point,
            turnovers_by_point,
            include_game_context=include_game_columns,
        )


def append_games_overview(
    rows: List[List[str]],
    games: List[Dict],
    *,
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


def append_competitions_overview(rows: List[List[str]], competitions: List[Dict]) -> None:
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
