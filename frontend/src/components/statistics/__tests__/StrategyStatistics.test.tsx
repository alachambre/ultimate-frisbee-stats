import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import StrategyStatistics from "../StrategyStatistics";
import type { GameStrategyStats } from "../../../types";

function buildTurnoverTypeStats() {
  return {
    all_points: {
      our_possession_turnovers: {
        total_turnovers: 1,
        by_type: {
          defended_pass: { count: 0, percentage: 0 },
          missed_pass: { count: 0, percentage: 0 },
          defended_huck: { count: 0, percentage: 0 },
          missed_huck: { count: 0, percentage: 0 },
          drop: { count: 1, percentage: 1 },
          stall_out: { count: 0, percentage: 0 },
          miscommunication: { count: 0, percentage: 0 },
          other: { count: 0, percentage: 0 },
        },
      },
      opponent_possession_turnovers: {
        total_turnovers: 2,
        by_type: {
          defended_pass: { count: 1, percentage: 0.5 },
          missed_pass: { count: 0, percentage: 0 },
          defended_huck: { count: 0, percentage: 0 },
          missed_huck: { count: 1, percentage: 0.5 },
          drop: { count: 0, percentage: 0 },
          stall_out: { count: 0, percentage: 0 },
          miscommunication: { count: 0, percentage: 0 },
          other: { count: 0, percentage: 0 },
        },
      },
    },
    started_on_offense: {
      our_possession_turnovers: {
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
      },
      opponent_possession_turnovers: {
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
      },
    },
    started_on_defense: {
      our_possession_turnovers: {
        total_turnovers: 1,
        by_type: {
          defended_pass: { count: 0, percentage: 0 },
          missed_pass: { count: 0, percentage: 0 },
          defended_huck: { count: 0, percentage: 0 },
          missed_huck: { count: 0, percentage: 0 },
          drop: { count: 1, percentage: 1 },
          stall_out: { count: 0, percentage: 0 },
          miscommunication: { count: 0, percentage: 0 },
          other: { count: 0, percentage: 0 },
        },
      },
      opponent_possession_turnovers: {
        total_turnovers: 2,
        by_type: {
          defended_pass: { count: 1, percentage: 0.5 },
          missed_pass: { count: 0, percentage: 0 },
          defended_huck: { count: 0, percentage: 0 },
          missed_huck: { count: 1, percentage: 0.5 },
          drop: { count: 0, percentage: 0 },
          stall_out: { count: 0, percentage: 0 },
          miscommunication: { count: 0, percentage: 0 },
          other: { count: 0, percentage: 0 },
        },
      },
    },
  };
}

describe("StrategyStatistics", () => {
  it("does not render when there are no strategies", () => {
    const emptyStats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [],
      defense_strategies: [],
    };

    const { container } = render(<StrategyStatistics strategyStats={emptyStats} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders offense strategies with basic stats", () => {
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [
        {
          strategy_id: 1,
          strategy_name: "Ho Stack",
          points_played: 5,
          points_won: 4,
          points_lost: 1,
          hold_rate: 0.8,
          clean_holds: 3,
          clean_hold_rate: 0.75,
          quick_scores: 2,
          quick_score_rate: 0.5,
        },
      ],
      defense_strategies: [],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    expect(screen.getByText("Strategies statistics")).toBeInTheDocument();
    expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    expect(screen.getByText("Ho Stack")).toBeInTheDocument();
    expect(screen.getByText("5 points played")).toBeInTheDocument();
    expect(screen.getByText("80% (4/5)")).toBeInTheDocument();
  });

  it("renders defense strategies with basic stats", () => {
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [],
      defense_strategies: [
        {
          strategy_id: 2,
          strategy_name: "Zone",
          points_played: 3,
          points_won: 1,
          points_lost: 2,
          break_rate: 0.333,
          points_with_turnover: 2,
          turnover_rate: 0.667,
        },
      ],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    expect(screen.getByText("Strategies statistics")).toBeInTheDocument();
    expect(screen.getByText("Defense Strategies")).toBeInTheDocument();
    expect(screen.getByText("Zone")).toBeInTheDocument();
    expect(screen.getByText("3 points played")).toBeInTheDocument();
    // Turnover rate is now the main metric (67%)
    expect(screen.getByText("67% (2/3)")).toBeInTheDocument();
  });

  it("expands offense strategy to show detailed stats", async () => {
    const user = userEvent.setup();
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [
        {
          strategy_id: 1,
          strategy_name: "Ho Stack",
          points_played: 5,
          points_won: 4,
          points_lost: 1,
          hold_rate: 0.8,
          clean_holds: 3,
          clean_hold_rate: 0.6, // 3/5 (relative to points_played)
          quick_scores: 2,
          quick_score_rate: 0.4, // 2/5 (relative to points_played)
        },
      ],
      defense_strategies: [],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    // Initially, detailed stats should not be visible
    expect(screen.queryByText("Clean Holds")).not.toBeVisible();
    expect(screen.queryByText("Quick Scores (< 90s)")).not.toBeVisible();

    // Click to expand
    const strategyCard = screen.getByText("Ho Stack").closest("div[role='button']") || screen.getByText("Ho Stack").parentElement?.parentElement;
    if (strategyCard) {
      await user.click(strategyCard);
    }

    // Detailed stats should now be visible (relative to points_played, not points_won)
    expect(screen.getByText("Clean Holds")).toBeVisible();
    expect(screen.getByText("60% (3/5)")).toBeInTheDocument();
    expect(screen.getByText("Quick Scores (< 90s)")).toBeVisible();
    expect(screen.getByText("40% (2/5)")).toBeInTheDocument();
  });

  it("expands defense strategy to show detailed stats", async () => {
    const user = userEvent.setup();
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [],
      defense_strategies: [
        {
          strategy_id: 2,
          strategy_name: "Zone",
          points_played: 3,
          points_won: 1,
          points_lost: 2,
          break_rate: 0.333,
          points_with_turnover: 2,
          turnover_rate: 0.667,
        },
      ],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    // Turnover Rate is now the main metric (always visible)
    expect(screen.getByText("Turnover Rate")).toBeVisible();

    // Initially, detailed stats (Break Rate) should not be visible
    expect(screen.queryByText("Break Rate")).not.toBeVisible();

    // Click to expand
    const strategyCard = screen.getByText("Zone").closest("div[role='button']") || screen.getByText("Zone").parentElement?.parentElement;
    if (strategyCard) {
      await user.click(strategyCard);
    }

    // Detailed stats should now be visible
    expect(screen.getByText("Break Rate")).toBeVisible();
    expect(screen.getByText("33% (1/3)")).toBeInTheDocument();
  });

  it("renders turnover type breakdown for expanded defense strategies", async () => {
    const user = userEvent.setup();
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [],
      defense_strategies: [
        {
          strategy_id: 2,
          strategy_name: "Zone",
          points_played: 3,
          points_won: 1,
          points_lost: 2,
          break_rate: 0.333,
          points_with_turnover: 2,
          turnover_rate: 0.667,
          turnover_type_stats: buildTurnoverTypeStats(),
        },
      ],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    const strategyCard =
      screen.getByText("Zone").closest("div[role='button']") ||
      screen.getByText("Zone").parentElement?.parentElement;
    if (strategyCard) {
      await user.click(strategyCard);
    }

    expect(screen.getByText("Turnover types for Zone")).toBeVisible();
    expect(screen.queryByText("All points")).not.toBeInTheDocument();
    expect(screen.queryByText("Started on offense")).not.toBeInTheDocument();
    expect(screen.queryByText("Started on defense")).not.toBeInTheDocument();

    expect(screen.getByRole("group", { name: "We lost possession" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Opponent lost possession" })).toBeVisible();
    expect(screen.getAllByText("Defended pass").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Missed huck").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Drop").length).toBeGreaterThan(0);
  });

  it("renders both offense and defense strategies", () => {
    const stats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [
        {
          strategy_id: 1,
          strategy_name: "Ho Stack",
          points_played: 5,
          points_won: 4,
          points_lost: 1,
          hold_rate: 0.8,
          clean_holds: 3,
          clean_hold_rate: 0.75,
          quick_scores: 2,
          quick_score_rate: 0.5,
        },
      ],
      defense_strategies: [
        {
          strategy_id: 2,
          strategy_name: "Zone",
          points_played: 3,
          points_won: 1,
          points_lost: 2,
          break_rate: 0.333,
          points_with_turnover: 2,
          turnover_rate: 0.667,
        },
      ],
    };

    render(<StrategyStatistics strategyStats={stats} />);

    expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    expect(screen.getByText("Ho Stack")).toBeInTheDocument();
    expect(screen.getByText("Defense Strategies")).toBeInTheDocument();
    expect(screen.getByText("Zone")).toBeInTheDocument();
  });
});
