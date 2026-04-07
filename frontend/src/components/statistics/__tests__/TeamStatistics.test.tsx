import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "../../../test/test-utils";
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanHoldStat = screen.getByRole("group", { name: "Clean Hold" });
    expect(within(cleanHoldStat).getByText("50%")).toBeInTheDocument();
    expect(within(cleanHoldStat).getByText("2/4")).toBeInTheDocument();
    expect(within(cleanHoldStat).queryByText("2/3")).not.toBeInTheDocument();
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanBreakStat = screen.getByRole("group", { name: "Clean Break" });
    expect(within(cleanBreakStat).getByText("20%")).toBeInTheDocument();
    expect(within(cleanBreakStat).getByText("1/5")).toBeInTheDocument();
    expect(within(cleanBreakStat).queryByText("1/2")).not.toBeInTheDocument();
  });

  it("uses defensive turnover points as conversion denominator", () => {
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const conversionStat = screen.getByRole("group", { name: "Conversion" });
    expect(within(conversionStat).getByText("67%")).toBeInTheDocument();
    expect(within(conversionStat).getByText("2/3")).toBeInTheDocument();
    expect(within(conversionStat).queryByText("2/5")).not.toBeInTheDocument();
  });

  it("uses breaks as clean conversion denominator", () => {
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanConversionStat = screen.getByRole("group", { name: "Clean Conversion" });
    expect(within(cleanConversionStat).getByText("50%")).toBeInTheDocument();
    expect(within(cleanConversionStat).getByText("1/2")).toBeInTheDocument();
    expect(within(cleanConversionStat).queryByText("1/5")).not.toBeInTheDocument();
  });

  it("renders field-side stats inside advanced accordions only when enabled", async () => {
    const user = userEvent.setup();

    const teamStats: TeamStatsBase = {
      total_completed_points: 6,
      offense: {
        points_started: 3,
        points_won: 2,
        points_lost: 1,
        hold_rate: 2 / 3,
        points_won_no_turnover: 2,
        clean_hold_rate: 2 / 3,
        broken_rate: 1 / 3,
      },
      defense: {
        points_started: 3,
        points_won: 2,
        points_lost: 1,
        break_rate: 2 / 3,
        points_with_turnover: 2,
        turnover_rate: 2 / 3,
        conversion_rate: 1,
        points_won_no_turnover: 1,
        clean_break_rate: 1 / 3,
        clean_conversion_rate: 0.5,
        points_lost_no_turnover: 0,
        pull_stats: {
          total_pulls: 3,
          inbound_pulls: 2,
          out_of_bounds_pulls: 1,
          inbound_rate: 2 / 3,
        },
      },
      field_side_stats: {
        table_left: {
          offense: {
            points_started: 2,
            points_won: 2,
            hold_rate: 1,
          },
          defense: {
            points_started: 1,
            points_won: 1,
            break_rate: 1,
          },
        },
        table_right: {
          offense: {
            points_started: 1,
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
    expect(screen.queryByRole("button", { name: "Advanced stats" })).not.toBeInTheDocument();

    rerender(<TeamStatistics teamStats={teamStats} showFieldSideStats />);

    const advancedButtons = screen.getAllByRole("button", { name: "Advanced stats" });
    expect(advancedButtons).toHaveLength(2);

    await user.click(advancedButtons[0]);
    expect(screen.getByText("Hold by field side")).toBeVisible();
    expect(screen.getByText("100% (2/2)")).toBeVisible();
    expect(screen.getByText("0% (0/1)")).toBeVisible();

    await user.click(advancedButtons[1]);
    expect(screen.getByText("Break by field side")).toBeVisible();
    expect(screen.getByText("100% (1/1)")).toBeVisible();
    expect(screen.getByText("50% (1/2)")).toBeVisible();
  });

  it("renders raw turnover totals for offense and defense", () => {
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
        our_turnovers: 3,
        opponent_turnovers: 1,
      },
      defense: {
        points_started: 2,
        points_won: 1,
        points_lost: 1,
        break_rate: 0.5,
        points_with_turnover: 1,
        turnover_rate: 0.5,
        conversion_rate: 1,
        points_won_no_turnover: 1,
        clean_break_rate: 0.5,
        clean_conversion_rate: 1,
        points_lost_no_turnover: 0,
        our_turnovers: 1,
        opponent_turnovers: 4,
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

    expect(screen.getAllByText("Our turns")).toHaveLength(2);
    expect(screen.getAllByText("Opponent turns")).toHaveLength(2);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders advanced stats below turnover totals", () => {
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
        our_turnovers: 1,
        opponent_turnovers: 0,
      },
      defense: {
        points_started: 2,
        points_won: 1,
        points_lost: 1,
        break_rate: 0.5,
        points_with_turnover: 1,
        turnover_rate: 0.5,
        conversion_rate: 1,
        points_won_no_turnover: 1,
        clean_break_rate: 0.5,
        clean_conversion_rate: 1,
        points_lost_no_turnover: 0,
        our_turnovers: 1,
        opponent_turnovers: 1,
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
            points_started: 1,
            points_won: 0,
            hold_rate: 0,
          },
          defense: {
            points_started: 1,
            points_won: 1,
            break_rate: 1,
          },
        },
        table_right: {
          offense: {
            points_started: 1,
            points_won: 1,
            hold_rate: 1,
          },
          defense: {
            points_started: 1,
            points_won: 0,
            break_rate: 0,
          },
        },
      },
    };

    render(<TeamStatistics teamStats={teamStats} showFieldSideStats />);

    const firstOpponentTurns = screen.getAllByText("Opponent turns")[0];
    const firstAdvancedStats = screen.getAllByRole("button", { name: "Advanced stats" })[0];

    expect(
      firstOpponentTurns.compareDocumentPosition(firstAdvancedStats) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
