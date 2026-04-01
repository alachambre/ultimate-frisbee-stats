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
      field_side_stats: {
        table_left: {
          offense: {
            points_started: 0,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 0,
            points_won: 0,
            break_rate: 0,
          },
        },
        table_right: {
          offense: {
            points_started: 0,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 0,
            points_won: 0,
            break_rate: 0,
          },
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
      field_side_stats: {
        table_left: {
          offense: {
            points_started: 0,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 0,
            points_won: 0,
            break_rate: 0,
          },
        },
        table_right: {
          offense: {
            points_started: 0,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 0,
            points_won: 0,
            break_rate: 0,
          },
        },
      },
    };

    render(<TeamStatistics teamStats={teamStats} />);

    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.queryByText("1/2")).not.toBeInTheDocument();
  });

  it("renders field-side stats only when explicitly enabled", () => {
    const teamStats: TeamStatsBase = {
      total_completed_points: 4,
      offense: {
        points_started: 2,
        points_won: 1,
        points_lost: 1,
        hold_rate: 0.5,
        points_won_no_turnover: 1,
        clean_hold_rate: 0.5,
        broken_rate: 0.5,
      },
      defense: {
        points_started: 2,
        points_won: 1,
        points_lost: 1,
        break_rate: 0.5,
        points_with_turnover: 1,
        turnover_rate: 0.5,
        points_won_no_turnover: 1,
        clean_break_rate: 0.5,
        points_lost_no_turnover: 0,
        pull_stats: {
          total_pulls: 2,
          inbound_pulls: 1,
          out_of_bounds_pulls: 1,
          inbound_rate: 0.5,
        },
      },
      field_side_stats: {
        table_left: {
          offense: {
            points_started: 2,
            points_won: 1,
            hold_rate: 0.5,
          },
          defense: {
            points_started: 0,
            points_won: 0,
            break_rate: 0,
          },
        },
        table_right: {
          offense: {
            points_started: 0,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 2,
            points_won: 1,
            break_rate: 0.5,
          },
        },
      },
    };

    const { rerender } = render(<TeamStatistics teamStats={teamStats} />);
    expect(screen.queryByText("Hold by field side")).not.toBeInTheDocument();
    expect(screen.queryByText("Break by field side")).not.toBeInTheDocument();

    rerender(<TeamStatistics teamStats={teamStats} showFieldSideStats />);

    expect(screen.getByText("Hold by field side")).toBeInTheDocument();
    expect(screen.getByText("Break by field side")).toBeInTheDocument();
    expect(screen.getAllByText("Left side")).toHaveLength(2);
    expect(screen.getAllByText("Right side")).toHaveLength(2);
    expect(screen.getAllByText("50% (1/2)")).toHaveLength(2);
    expect(screen.getAllByText("-")).toHaveLength(2);
  });
});
