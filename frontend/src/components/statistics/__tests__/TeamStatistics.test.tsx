import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/test-utils";
import TeamStatistics from "../TeamStatistics";
import type { TeamStatsBase } from "../../../types";

describe("TeamStatistics", () => {
  it("uses offense started points as clean hold count denominator", () => {
    const teamStats: TeamStatsBase = {
      total_completed_points: 9,
      offense: {
        points_started: 4,
        points_won: 3,
        points_lost: 1,
        hold_rate: 0.75,
        points_won_no_turnover: 2,
        clean_hold_rate: 0.5,
        broken_rate: 0.25,
      },
      defense: {
        points_started: 5,
        points_won: 2,
        points_lost: 3,
        break_rate: 0.4,
        points_with_turnover: 3,
        turnover_rate: 0.6,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        points_lost_no_turnover: 1,
        pull_stats: {
          total_pulls: 5,
          inbound_pulls: 4,
          out_of_bounds_pulls: 1,
          inbound_rate: 0.8,
        },
      },
    };

    render(<TeamStatistics teamStats={teamStats} />);

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("2/4")).toBeInTheDocument();
    expect(screen.queryByText("2/3")).not.toBeInTheDocument();
  });

  it("uses all defense points as clean break count denominator", () => {
    const teamStats: TeamStatsBase = {
      total_completed_points: 9,
      offense: {
        points_started: 4,
        points_won: 3,
        points_lost: 1,
        hold_rate: 0.75,
        points_won_no_turnover: 2,
        clean_hold_rate: 0.5,
        broken_rate: 0.25,
      },
      defense: {
        points_started: 5,
        points_won: 2,
        points_lost: 3,
        break_rate: 0.4,
        points_with_turnover: 3,
        turnover_rate: 0.6,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        points_lost_no_turnover: 1,
        pull_stats: {
          total_pulls: 5,
          inbound_pulls: 4,
          out_of_bounds_pulls: 1,
          inbound_rate: 0.8,
        },
      },
    };

    render(<TeamStatistics teamStats={teamStats} />);

    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.queryByText("1/2")).not.toBeInTheDocument();
  });
});
