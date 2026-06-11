"""Backend-owned key moment detection for game timeline charts."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Literal, Optional, Sequence, Set, Tuple


LONG_POINT_MIN_SECONDS = 5 * 60
HIGH_TURN_COUNT = 3
MAX_KEY_MOMENTS = 4


@dataclass(frozen=True)
class TimelinePoint:
    point_id: int
    point_number: int
    starting_on_offense: bool
    won: bool
    duration_seconds: int
    our_turnovers: int
    opponent_turnovers: int
    our_score_after: int
    opponent_score_after: int


BreakSide = Literal["for_us", "against_us"]
BreakSegment = Tuple[BreakSide, List[TimelinePoint]]


def _pre_point_score(point: TimelinePoint) -> tuple[int, int]:
    our_before = point.our_score_after - (1 if point.won else 0)
    opponent_before = point.opponent_score_after - (0 if point.won else 1)
    return our_before, opponent_before


def _is_tight_score(point: TimelinePoint) -> bool:
    our_before, opponent_before = _pre_point_score(point)
    return abs(our_before - opponent_before) <= 1


def _is_tied_before_point(point: TimelinePoint) -> bool:
    our_before, opponent_before = _pre_point_score(point)
    return our_before == opponent_before


def _is_break(point: TimelinePoint) -> bool:
    return not point.starting_on_offense and point.won


def _is_broken(point: TimelinePoint) -> bool:
    return point.starting_on_offense and not point.won


def _is_hold(point: TimelinePoint) -> bool:
    return point.starting_on_offense and point.won


def _is_opponent_hold(point: TimelinePoint) -> bool:
    return not point.starting_on_offense and not point.won


def _break_side(point: TimelinePoint) -> Optional[BreakSide]:
    if _is_break(point):
        return "for_us"

    if _is_broken(point):
        return "against_us"

    return None


def _is_long_point(point: TimelinePoint) -> bool:
    return point.duration_seconds > LONG_POINT_MIN_SECONDS


def _is_high_turn_point(point: TimelinePoint, high_turn_cutoff: int) -> bool:
    return point.our_turnovers + point.opponent_turnovers >= high_turn_cutoff


def _percentile_cutoff(values: Sequence[int], percentile: float, minimum: int) -> int:
    if not values:
        return minimum

    sorted_values = sorted(values)
    index = max(0, min(len(sorted_values) - 1, int((len(sorted_values) - 1) * percentile)))
    return max(minimum, sorted_values[index])


def _build_moment(
    *,
    moment_type: str,
    primary_point_id: int,
    point_ids: List[int],
    importance: int,
    reasons: List[str],
) -> Dict:
    return {
        "id": f"{moment_type}-{'-'.join(str(point_id) for point_id in point_ids)}",
        "type": moment_type,
        "primary_point_id": primary_point_id,
        "point_ids": point_ids,
        "importance": importance,
        "reasons": reasons,
    }


def _select_visible_key_moments(moments: Sequence[Dict]) -> List[Dict]:
    deduped_moments: Dict[str, Dict] = {}
    for moment in moments:
        current = deduped_moments.get(moment["id"])
        if current is None or moment["importance"] > current["importance"]:
            deduped_moments[moment["id"]] = moment

    claimed_point_ids: Set[int] = set()
    visible_moments: List[Dict] = []

    for moment in sorted(
        deduped_moments.values(),
        key=lambda candidate: (
            -candidate["importance"],
            min(candidate["point_ids"]),
            candidate["id"],
        ),
    ):
        point_ids = set(moment["point_ids"])
        if claimed_point_ids.intersection(point_ids):
            continue

        visible_moments.append(moment)
        claimed_point_ids.update(point_ids)

        if len(visible_moments) >= MAX_KEY_MOMENTS:
            break

    return visible_moments


def _add_marker(markers_by_point_id: Dict[int, Set[str]], point_id: int, marker: str) -> None:
    markers_by_point_id.setdefault(point_id, set()).add(marker)


def _find_point_by_number(points: Sequence[TimelinePoint], point_number: Optional[int]) -> Optional[TimelinePoint]:
    if point_number is None:
        return None

    return next((point for point in points if point.point_number == point_number), None)


def _find_break_runs(points: Sequence[TimelinePoint]) -> List[BreakSegment]:
    break_runs: List[BreakSegment] = []
    current_side: Optional[BreakSide] = None
    current_run: List[TimelinePoint] = []

    for point in points:
        side = _break_side(point)
        if side is not None and side == current_side:
            current_run.append(point)
            continue

        if len(current_run) >= 2 and current_side is not None:
            break_runs.append((current_side, current_run))

        current_side = side
        current_run = [point] if side is not None else []

    if len(current_run) >= 2 and current_side is not None:
        break_runs.append((current_side, current_run))

    return break_runs


def _find_counter_breaks(points: Sequence[TimelinePoint]) -> List[BreakSegment]:
    counter_breaks: List[BreakSegment] = []

    for index in range(len(points) - 2):
        first = points[index]
        second = points[index + 1]
        third = points[index + 2]

        if _is_broken(first) and _is_hold(second) and _is_break(third):
            counter_breaks.append(("for_us", [first, second, third]))

        if _is_break(first) and _is_opponent_hold(second) and _is_broken(third):
            counter_breaks.append(("against_us", [first, second, third]))

    return counter_breaks


def build_timeline_markers_and_key_moments(
    raw_points: Sequence[Dict],
    halftime_after_point_number: Optional[int] = None,
    *,
    final_point_id: Optional[int] = None,
    is_game_ended: bool = False,
) -> tuple[Dict[int, List[str]], List[Dict]]:
    """Return point markers and ranked key moments for a timeline payload.

    The output is intentionally data-only so frontend components can own labels,
    selection, layout, and localization.
    """
    points = [
        TimelinePoint(
            point_id=point["point_id"],
            point_number=point["point_number"],
            starting_on_offense=point["starting_on_offense"],
            won=point["won"],
            duration_seconds=point["duration_seconds"],
            our_turnovers=point["our_turnovers"],
            opponent_turnovers=point["opponent_turnovers"],
            our_score_after=point["our_score_after"],
            opponent_score_after=point["opponent_score_after"],
        )
        for point in raw_points
    ]
    if not points:
        return {}, []

    high_turn_cutoff = _percentile_cutoff(
        [point.our_turnovers + point.opponent_turnovers for point in points],
        0.85,
        HIGH_TURN_COUNT,
    )
    markers_by_point_id: Dict[int, Set[str]] = {point.point_id: set() for point in points}
    moments: List[Dict] = []

    final_point = points[-1]
    actual_final_point_id = final_point_id if final_point_id is not None else final_point.point_id
    halftime_point = _find_point_by_number(points, halftime_after_point_number)

    for point in points:
        if _is_break(point):
            _add_marker(markers_by_point_id, point.point_id, "break")
        if _is_broken(point):
            _add_marker(markers_by_point_id, point.point_id, "broken")
        if _is_long_point(point):
            _add_marker(markers_by_point_id, point.point_id, "long_point")
        if _is_high_turn_point(point, high_turn_cutoff):
            _add_marker(markers_by_point_id, point.point_id, "high_turn_point")

    if is_game_ended and final_point.point_id == actual_final_point_id and _is_tied_before_point(final_point):
        _add_marker(markers_by_point_id, final_point.point_id, "universe_point")
        moments.append(
            _build_moment(
                moment_type="universe_point",
                primary_point_id=final_point.point_id,
                point_ids=[final_point.point_id],
                importance=100,
                reasons=["game_clinch", "tight_score"],
            )
        )

    if halftime_point is not None and _is_tied_before_point(halftime_point):
        _add_marker(markers_by_point_id, halftime_point.point_id, "galaxy_point")
        moments.append(
            _build_moment(
                moment_type="galaxy_point",
                primary_point_id=halftime_point.point_id,
                point_ids=[halftime_point.point_id],
                importance=90,
                reasons=["halftime_clinch", "tight_score"],
            )
        )

    for side, break_run in _find_break_runs(points):
        primary = break_run[-1]
        point_ids = [point.point_id for point in break_run]
        is_tight = _is_tight_score(break_run[0])
        moment_type = (
            "break_run_for_us" if side == "for_us" else "break_run_against_us"
        )
        reasons = ["break_run", side]
        if is_tight:
            reasons.append("tight_score")

        moments.append(
            _build_moment(
                moment_type=moment_type,
                primary_point_id=primary.point_id,
                point_ids=point_ids,
                importance=86
                + min((len(break_run) - 2) * 3, 9)
                + (4 if is_tight else 0),
                reasons=reasons,
            )
        )

    for side, counter_break in _find_counter_breaks(points):
        primary = counter_break[-1]
        point_ids = [primary.point_id]
        is_tight = _is_tight_score(counter_break[0])
        moment_type = (
            "counter_break_for_us" if side == "for_us" else "counter_break_against_us"
        )
        reasons = ["counter_break", side]
        if is_tight:
            reasons.append("tight_score")

        moments.append(
            _build_moment(
                moment_type=moment_type,
                primary_point_id=primary.point_id,
                point_ids=point_ids,
                importance=84 + (4 if is_tight else 0),
                reasons=reasons,
            )
        )

    for point in points:
        total_turnovers = point.our_turnovers + point.opponent_turnovers
        is_tight = _is_tight_score(point)

        if _is_break(point):
            moments.append(
                _build_moment(
                    moment_type="break",
                    primary_point_id=point.point_id,
                    point_ids=[point.point_id],
                    importance=78 + (7 if is_tight else 0),
                    reasons=["break", "tight_score"] if is_tight else ["break"],
                )
            )
        elif _is_broken(point):
            moments.append(
                _build_moment(
                    moment_type="broken",
                    primary_point_id=point.point_id,
                    point_ids=[point.point_id],
                    importance=74 + (6 if is_tight else 0),
                    reasons=["broken", "tight_score"] if is_tight else ["broken"],
                )
            )

        if _is_high_turn_point(point, high_turn_cutoff):
            moments.append(
                _build_moment(
                    moment_type="high_turn_point",
                    primary_point_id=point.point_id,
                    point_ids=[point.point_id],
                    importance=64 + min(total_turnovers, 8) + (6 if is_tight else 0),
                    reasons=["high_turn_point", "tight_score"] if is_tight else ["high_turn_point"],
                )
            )

        if _is_long_point(point):
            moments.append(
                _build_moment(
                    moment_type="long_point",
                    primary_point_id=point.point_id,
                    point_ids=[point.point_id],
                    importance=58 + min(point.duration_seconds // 60, 8) + (6 if is_tight else 0),
                    reasons=["long_point", "tight_score"] if is_tight else ["long_point"],
                )
            )

    return {
        point_id: sorted(markers)
        for point_id, markers in markers_by_point_id.items()
    }, _select_visible_key_moments(moments)
