import { describe, expect, it } from "vitest";
import type { Halftime, PointWithPlayers } from "../../types";
import { buildGamePointTimelineFromPoints } from "../gameTimeline";

function createPoint(overrides: Partial<PointWithPlayers>): PointWithPlayers {
  return {
    id: 1,
    game_id: 1,
    point_number: 1,
    starting_on_offense: true,
    won: true,
    status: "completed",
    start_datetime: "2026-04-09T10:00:00Z",
    end_datetime: "2026-04-09T10:01:00Z",
    created_at: "2026-04-09T10:00:00Z",
    comments: null,
    pull: null,
    field_side: "table_left",
    players: [],
    ...overrides,
  };
}

describe("buildGamePointTimelineFromPoints", () => {
  it("builds cumulative scores from completed points", () => {
    const timeline = buildGamePointTimelineFromPoints(1, [
      createPoint({
        id: 1,
        point_number: 1,
        won: true,
        our_turnovers: 1,
        opponent_turnovers: 0,
      }),
      createPoint({
        id: 2,
        point_number: 2,
        won: false,
        start_datetime: "2026-04-09T10:02:00Z",
        end_datetime: "2026-04-09T10:03:30Z",
      }),
      createPoint({
        id: 3,
        point_number: 3,
        won: true,
        start_datetime: "2026-04-09T10:04:00Z",
        end_datetime: "2026-04-09T10:05:00Z",
      }),
    ]);

    expect(timeline.points.map((point) => [point.our_score_after, point.opponent_score_after])).toEqual([
      [1, 0],
      [1, 1],
      [2, 1],
    ]);
    expect(timeline.points.map((point) => point.duration_seconds)).toEqual([60, 90, 60]);
  });

  it("marks halftime after the last point completed before the halftime timestamp", () => {
    const halftime: Halftime = {
      id: 1,
      game_id: 1,
      halftime_timestamp: "2026-04-09T10:03:00Z",
      comments: null,
      created_at: "2026-04-09T10:03:00Z",
    };

    const timeline = buildGamePointTimelineFromPoints(
      1,
      [
        createPoint({
          id: 1,
          point_number: 1,
          end_datetime: "2026-04-09T10:01:00Z",
        }),
        createPoint({
          id: 2,
          point_number: 2,
          start_datetime: "2026-04-09T10:04:00Z",
          end_datetime: "2026-04-09T10:05:00Z",
        }),
      ],
      halftime
    );

    expect(timeline.halftime_after_point_number).toBe(1);
  });
});
