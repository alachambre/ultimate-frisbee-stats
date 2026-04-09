import { render, screen } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { within } from "@testing-library/react";
import PointHistoryList from "../PointHistoryList";
import type { PointWithPlayers, Halftime } from "../../../types";

const createPoint = (
  id: number,
  pointNumber: number,
  startDatetime: string,
  fieldSide: "table_left" | "table_right" | null = null,
  turnoverSummary?: { our: number; opponent: number }
): PointWithPlayers => ({
  id,
  game_id: 1,
  point_number: pointNumber,
  starting_on_offense: true,
  won: true,
  field_side: fieldSide,
  pull: true,
  strategy_id: null,
  comments: null,
  start_datetime: startDatetime,
  end_datetime: "2024-01-01T10:05:00Z",
  status: "completed",
  created_at: startDatetime,
  players: [],
  strategy: null,
  our_turnovers: turnoverSummary?.our ?? 0,
  opponent_turnovers: turnoverSummary?.opponent ?? 0,
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

  it("renders game end summary above halftime and points when the game is finished", () => {
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
        gameEndedAt="2024-01-01T11:15:00Z"
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    expect(
      screen.getAllByRole("heading", { level: 6 }).map((heading) => heading.textContent)
    ).toEqual(["End of game", "Point #2", "Half time", "Point #1"]);
    expect(screen.getByText("Finished")).toBeInTheDocument();
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

  it("renders halftime overview snapshot from points before halftime", () => {
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z", "table_left", { our: 1, opponent: 0 }),
      {
        ...createPoint(2, 2, "2024-01-01T10:20:00Z", "table_right", { our: 0, opponent: 2 }),
        starting_on_offense: false,
        won: false,
      },
      createPoint(3, 3, "2024-01-01T11:00:00Z", "table_left", { our: 3, opponent: 1 }),
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

    expect(screen.getByText("1 - 1")).toBeInTheDocument();
    const halftimeCard = screen.getByRole("heading", { level: 6, name: "Half time" }).closest(".MuiCard-root");
    expect(halftimeCard).not.toBeNull();

    const halftimeWithin = within(halftimeCard as HTMLElement);
    expect(halftimeWithin.getByText("30:00")).toBeInTheDocument();
    expect(halftimeWithin.getByText("Offense time")).toBeInTheDocument();
    expect(halftimeWithin.getByText("Defense time")).toBeInTheDocument();
    expect(halftimeWithin.getAllByText("5:00")).toHaveLength(2);
    expect(halftimeWithin.getByText("Hold by field side")).toBeInTheDocument();
    expect(halftimeWithin.getByText("Break by field side")).toBeInTheDocument();
    expect(halftimeWithin.getByText("100% (1/1)")).toBeInTheDocument();
    expect(halftimeWithin.getByText("0% (0/1)")).toBeInTheDocument();

    const offenseSection = halftimeWithin.getByText("Offense").closest("div");
    expect(offenseSection).not.toBeNull();
    expect(within(offenseSection as HTMLElement).getByText("1")).toBeInTheDocument();
    expect(within(offenseSection as HTMLElement).getByText("0")).toBeInTheDocument();

    const defenseSection = halftimeWithin.getByText("Defense").closest("div");
    expect(defenseSection).not.toBeNull();
    expect(within(defenseSection as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("renders field side in chronology when available", async () => {
    const user = userEvent.setup();
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z", "table_left"),
    ];

    render(
      <PointHistoryList
        points={points}
        halftime={null}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /show chronology/i }));

    expect(await screen.findByText(/point start in offense - left side/i)).toBeInTheDocument();
  });

  it("renders our turns summary on completed point cards", () => {
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z", null, { our: 2, opponent: 1 }),
    ];

    render(
      <PointHistoryList
        points={points}
        halftime={null}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    expect(screen.getByText("2 turns")).toBeInTheDocument();
  });

  it("renders zero-turn summary when no turns happened", () => {
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z"),
    ];

    render(
      <PointHistoryList
        points={points}
        halftime={null}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    expect(screen.getByText("0 turn")).toBeInTheDocument();
  });

  it("renders point duration next to the point title", () => {
    const points: PointWithPlayers[] = [
      createPoint(1, 1, "2024-01-01T10:00:00Z"),
    ];

    render(
      <PointHistoryList
        points={points}
        halftime={null}
        onEditPoint={vi.fn()}
        onDeletePoint={vi.fn()}
        onDeleteHalftime={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { level: 6, name: "Point #1" })).toBeInTheDocument();
    expect(screen.getByText("5:00")).toBeInTheDocument();
  });
});
