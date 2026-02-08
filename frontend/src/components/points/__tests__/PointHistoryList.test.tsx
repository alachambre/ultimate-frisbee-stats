import { render, screen } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PointHistoryList from "../PointHistoryList";
import type { PointWithPlayers, Halftime } from "../../../types";

const createPoint = (
  id: number,
  pointNumber: number,
  startDatetime: string
): PointWithPlayers => ({
  id,
  game_id: 1,
  point_number: pointNumber,
  starting_on_offense: true,
  won: true,
  field_side: null,
  pull: true,
  strategy_id: null,
  comments: null,
  start_datetime: startDatetime,
  end_datetime: "2024-01-01T10:05:00Z",
  status: "completed",
  created_at: startDatetime,
  players: [],
  strategy: null,
  duration_seconds: 300,
});

describe("PointHistoryList", () => {
  it("renders halftime between points based on timestamp", () => {
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z"),
      createPoint(2, 2, "2024-01-01T11:00:00Z"),
    ];

    const halftime: Halftime = {
      id: 1,
      game_id: 1,
      halftime_timestamp: "2024-01-01T10:30:00Z",
      comments: null,
      created_at: "2024-01-01T10:30:00Z",
    };

    render(
      <PointHistoryList
        points={points}
        halftime={halftime}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    expect(
      screen.getAllByRole("heading", { level: 6 }).map((heading) => heading.textContent)
    ).toEqual(["Point #2", "Half time", "Point #1"]);
  });

  it("calls delete halftime handler from history item", async () => {
    const user = userEvent.setup();
    const onDeleteHalftime = vi.fn();

    const halftime: Halftime = {
      id: 12,
      game_id: 1,
      halftime_timestamp: "2024-01-01T10:30:00Z",
      comments: "Break",
      created_at: "2024-01-01T10:30:00Z",
    };

    render(
      <PointHistoryList
        points={[]}
        halftime={halftime}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={onDeleteHalftime}
      />
    );

    await user.click(screen.getByRole("button", { name: /delete halftime/i }));

    expect(onDeleteHalftime).toHaveBeenCalledWith(halftime);
  });
});
