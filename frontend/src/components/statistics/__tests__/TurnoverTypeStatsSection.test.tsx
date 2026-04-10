import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "../../../test/test-utils";
import type { TurnoverTypeStats } from "../../../types";
import TurnoverTypeStatsSection from "../TurnoverTypeStatsSection";

function createEmptyBucket() {
  return {
    total_turnovers: 0,
    by_type: {
      defended_pass: { count: 0, percentage: 0 },
      missed_pass: { count: 0, percentage: 0 },
      defended_huck: { count: 0, percentage: 0 },
      missed_huck: { count: 0, percentage: 0 },
      drop: { count: 0, percentage: 0 },
      stall_out: { count: 0, percentage: 0 },
      miscommunication: { count: 0, percentage: 0 },
      other: { count: 0, percentage: 0 },
    },
  };
}

function createTurnoverTypeStats(): TurnoverTypeStats {
  return {
    all_points: {
      our_possession_turnovers: {
        total_turnovers: 4,
        by_type: {
          ...createEmptyBucket().by_type,
          defended_pass: { count: 2, percentage: 0.5 },
          drop: { count: 1, percentage: 0.25 },
          other: { count: 1, percentage: 0.25 },
        },
      },
      opponent_possession_turnovers: {
        total_turnovers: 1,
        by_type: {
          ...createEmptyBucket().by_type,
          miscommunication: { count: 1, percentage: 1 },
        },
      },
    },
    started_on_offense: {
      our_possession_turnovers: {
        total_turnovers: 1,
        by_type: {
          ...createEmptyBucket().by_type,
          defended_huck: { count: 1, percentage: 1 },
        },
      },
      opponent_possession_turnovers: createEmptyBucket(),
    },
    started_on_defense: {
      our_possession_turnovers: createEmptyBucket(),
      opponent_possession_turnovers: {
        total_turnovers: 1,
        by_type: {
          ...createEmptyBucket().by_type,
          missed_pass: { count: 1, percentage: 1 },
        },
      },
    },
  };
}

describe("TurnoverTypeStatsSection", () => {
  it("renders visible turnover types for the default all-points bucket", () => {
    render(<TurnoverTypeStatsSection turnoverTypeStats={createTurnoverTypeStats()} />);

    expect(screen.getByText("Turnover types")).toBeInTheDocument();
    const opponentBucket = screen.getByRole("group", {
      name: "Opponent lost possession",
    });
    const ourBucket = screen.getByRole("group", { name: "We lost possession" });

    const bucketGroups = screen.getAllByRole("group");
    expect(bucketGroups[0]).toBe(opponentBucket);
    expect(bucketGroups[1]).toBe(ourBucket);

    expect(within(opponentBucket).getByText("Miscommunication")).toBeInTheDocument();
    expect(within(opponentBucket).getByText("100% (1)")).toBeInTheDocument();
    expect(within(ourBucket).getByText("4 turnovers")).toBeInTheDocument();
    expect(within(ourBucket).getByText("Defended pass")).toBeInTheDocument();
    expect(within(ourBucket).getByText("50% (2)")).toBeInTheDocument();
    expect(within(ourBucket).getByText("Drop")).toBeInTheDocument();
  });

  it("shows empty-state text for empty buckets in collapsed phases", async () => {
    const user = userEvent.setup();

    render(<TurnoverTypeStatsSection turnoverTypeStats={createTurnoverTypeStats()} />);

    await user.click(screen.getByRole("button", { name: "Started on offense" }));

    expect(screen.getByText("Defended huck")).toBeInTheDocument();
    expect(screen.getAllByText("No turnovers recorded in this bucket.").length).toBeGreaterThan(0);
  });
});
