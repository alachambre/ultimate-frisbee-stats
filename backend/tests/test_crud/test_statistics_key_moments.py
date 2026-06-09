from app.crud.statistics_key_moments import build_timeline_markers_and_key_moments


def point(
    point_id: int,
    point_number: int,
    *,
    offense: bool,
    won: bool,
    duration: int = 60,
    our_turnovers: int = 0,
    opponent_turnovers: int = 0,
    score: tuple[int, int],
) -> dict:
    return {
        "point_id": point_id,
        "point_number": point_number,
        "starting_on_offense": offense,
        "won": won,
        "duration_seconds": duration,
        "our_turnovers": our_turnovers,
        "opponent_turnovers": opponent_turnovers,
        "our_score_after": score[0],
        "opponent_score_after": score[1],
    }


def test_key_moments_mark_break_broken_long_and_high_turn_points():
    markers, key_moments = build_timeline_markers_and_key_moments([
        point(1, 1, offense=True, won=True, duration=45, score=(1, 0)),
        point(2, 2, offense=True, won=False, duration=160, our_turnovers=3, score=(1, 1)),
        point(3, 3, offense=False, won=True, duration=60, score=(2, 1)),
        point(4, 4, offense=True, won=True, duration=65, score=(3, 1)),
    ])

    assert markers[2] == ["broken", "high_turn_point", "long_point"]
    assert markers[3] == ["break"]
    assert {moment["type"] for moment in key_moments} >= {
        "counter_break_for_us",
        "broken",
        "break",
        "high_turn_point",
    }


def test_key_moments_mark_break_runs_for_each_side():
    markers, key_moments = build_timeline_markers_and_key_moments([
        point(1, 1, offense=False, won=True, score=(1, 0)),
        point(2, 2, offense=False, won=True, score=(2, 0)),
        point(3, 3, offense=True, won=True, score=(3, 0)),
        point(4, 4, offense=True, won=False, score=(3, 1)),
        point(5, 5, offense=True, won=False, score=(3, 2)),
    ])

    moment_by_type = {moment["type"]: moment for moment in key_moments}

    assert markers[1] == ["break"]
    assert markers[2] == ["break"]
    assert markers[4] == ["broken"]
    assert markers[5] == ["broken"]
    assert moment_by_type["break_run_for_us"]["point_ids"] == [1, 2]
    assert moment_by_type["break_run_for_us"]["primary_point_id"] == 2
    assert moment_by_type["break_run_against_us"]["point_ids"] == [4, 5]
    assert moment_by_type["break_run_against_us"]["primary_point_id"] == 5


def test_key_moments_mark_counter_breaks_for_each_side():
    markers, key_moments = build_timeline_markers_and_key_moments([
        point(1, 1, offense=True, won=False, score=(0, 1)),
        point(2, 2, offense=False, won=True, score=(1, 1)),
        point(3, 3, offense=False, won=True, score=(2, 1)),
        point(4, 4, offense=True, won=False, score=(2, 2)),
    ])

    moment_by_type = {moment["type"]: moment for moment in key_moments}

    assert markers[1] == ["broken"]
    assert markers[2] == ["break"]
    assert markers[4] == ["broken"]
    assert moment_by_type["counter_break_for_us"]["point_ids"] == [1, 2]
    assert moment_by_type["counter_break_for_us"]["primary_point_id"] == 2
    assert moment_by_type["counter_break_against_us"]["point_ids"] == [3, 4]
    assert moment_by_type["counter_break_against_us"]["primary_point_id"] == 4


def test_key_moments_mark_galaxy_and_universe_points():
    markers, key_moments = build_timeline_markers_and_key_moments(
        [
            point(1, 1, offense=True, won=True, score=(1, 0)),
            point(2, 2, offense=False, won=False, score=(1, 1)),
            point(3, 3, offense=True, won=True, score=(2, 1)),
        ],
        halftime_after_point_number=1,
        is_game_ended=True,
    )

    assert "galaxy_point" in markers[1]
    assert "universe_point" in markers[3]
    assert [moment["type"] for moment in key_moments[:2]] == [
        "universe_point",
        "galaxy_point",
    ]


def test_key_moments_do_not_mark_universe_before_game_is_ended():
    markers, key_moments = build_timeline_markers_and_key_moments([
        point(1, 1, offense=True, won=True, score=(1, 0)),
        point(2, 2, offense=False, won=False, score=(1, 1)),
        point(3, 3, offense=True, won=True, score=(2, 1)),
    ])

    assert "universe_point" not in markers[3]
    assert "universe_point" not in {moment["type"] for moment in key_moments}


def test_key_moments_mark_universe_only_from_tied_score():
    markers, key_moments = build_timeline_markers_and_key_moments(
        [
            point(1, 1, offense=True, won=True, score=(1, 0)),
            point(2, 2, offense=False, won=False, score=(1, 1)),
            point(3, 3, offense=True, won=True, score=(2, 1)),
            point(4, 4, offense=False, won=False, score=(2, 2)),
        ],
        is_game_ended=True,
    )

    assert "universe_point" not in markers[4]
    assert "universe_point" not in {moment["type"] for moment in key_moments}


def test_key_moments_do_not_mark_universe_on_filtered_non_final_point():
    markers, key_moments = build_timeline_markers_and_key_moments(
        [
            point(1, 1, offense=True, won=True, score=(1, 0)),
            point(2, 2, offense=False, won=False, score=(1, 1)),
            point(3, 3, offense=True, won=True, score=(2, 1)),
        ],
        final_point_id=4,
        is_game_ended=True,
    )

    assert "universe_point" not in markers[3]
    assert "universe_point" not in {moment["type"] for moment in key_moments}


def test_key_moments_keep_only_most_important_visible_moments():
    markers, key_moments = build_timeline_markers_and_key_moments([
        point(1, 1, offense=True, won=True, duration=180, our_turnovers=3, score=(1, 0)),
        point(2, 2, offense=True, won=False, duration=160, our_turnovers=3, score=(1, 1)),
        point(3, 3, offense=True, won=True, duration=170, our_turnovers=3, score=(2, 1)),
        point(4, 4, offense=False, won=True, duration=155, our_turnovers=3, score=(3, 1)),
        point(5, 5, offense=True, won=False, duration=190, our_turnovers=3, score=(3, 2)),
        point(6, 6, offense=True, won=True, duration=200, our_turnovers=3, score=(4, 2)),
        point(7, 7, offense=False, won=True, duration=210, our_turnovers=3, score=(5, 2)),
    ])

    assert len(key_moments) <= 4
    assert all("high_turn_point" in markers[point_id] for point_id in markers)
    assert "counter_break_against_us" in {moment["type"] for moment in key_moments}
