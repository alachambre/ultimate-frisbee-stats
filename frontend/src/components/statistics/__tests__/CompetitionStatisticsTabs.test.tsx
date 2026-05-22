import { describe, expect, it } from "vitest";
import { render, screen, within } from "../../../test/test-utils";
import CompetitionStatisticsTabs from "../CompetitionStatisticsTabs";
import type {
  PlayerGameStats,
  StrategyStatsBase,
  TeamEvolutionResponse,
  TeamStatsBase,
} from "../../../types";

const teamStats: TeamStatsBase = {
  total_completed_points: 12,
  offense: {
    points_started: 8,
    points_won: 6,
    points_lost: 2,
    hold_rate: 0.75,
    points_won_no_turnover: 5,
    clean_hold_rate: 0.625,
    broken_rate: 0.25,
  },
  defense: {
    points_started: 4,
    points_won: 2,
    points_lost: 2,
    break_rate: 0.5,
    points_with_turnover: 3,
    turnover_rate: 0.75,
    conversion_rate: 0.667,
    points_won_no_turnover: 1,
    clean_break_rate: 0.25,
    clean_conversion_rate: 0.333,
    points_lost_no_turnover: 1,
    pull_stats: {
      total_pulls: 4,
      inbound_pulls: 3,
      out_of_bounds_pulls: 1,
      inbound_rate: 0.75,
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

const teamEvolution: TeamEvolutionResponse = {
  team_id: 1,
  filters: {
    competition_ids: [],
    game_ids: [],
    player_ids: [],
  },
  default_preset_id: "turnover_battle",
  omitted_games_count: 2,
  metrics: [],
  presets: [],
  games: [
    {
      game_id: 1,
      competition_id: 1,
      competition_name: "Spring Cup",
      opponent_name: "Blue Tigers",
      date: "2026-05-22T10:00:00Z",
      our_score: 13,
      opponent_score: 9,
      completed_points: 22,
      metrics: {},
    },
    {
      game_id: 2,
      competition_id: 1,
      competition_name: "Spring Cup",
      opponent_name: "Red Hawks",
      date: "2026-05-23T10:00:00Z",
      our_score: 11,
      opponent_score: 13,
      completed_points: 24,
      metrics: {},
    },
  ],
};

const strategyStats: StrategyStatsBase = {
  offense_strategies: [
    {
      strategy_id: 1,
      strategy_name: "Ho Stack",
      points_played: 5,
      points_won: 4,
      points_lost: 1,
      hold_rate: 0.8,
      clean_holds: 3,
      clean_hold_rate: 0.6,
      quick_scores: 2,
      quick_score_rate: 0.4,
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

const playerStats: PlayerGameStats[] = [
  {
    player_id: 1,
    player_name: "Alex Morgan",
    player_number: 7,
    points_played: 6,
    effective_time_seconds: 420,
    offense: {
      points_played: 4,
      points_won: 3,
      points_lost: 1,
      hold_rate: 0.75,
      points_won_no_turnover: 2,
      clean_hold_rate: 0.5,
    },
    defense: {
      points_played: 2,
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
    },
  },
];

function getSummary() {
  return screen.getByLabelText("Statistics summary");
}

describe("CompetitionStatisticsTabs", () => {
  it("does not render the compact summary by default", () => {
    render(
      <CompetitionStatisticsTabs
        activeTab="team"
        onTabChange={() => undefined}
        teamStats={teamStats}
      />
    );

    expect(screen.queryByLabelText("Statistics summary")).not.toBeInTheDocument();
  });

  it("renders a compact team summary when requested", () => {
    render(
      <CompetitionStatisticsTabs
        activeTab="team"
        onTabChange={() => undefined}
        summaryVariant="compact"
        teamStats={teamStats}
      />
    );

    const summary = getSummary();
    expect(within(summary).getByText("12")).toBeInTheDocument();
    expect(within(summary).getByText("Total Completed Points")).toBeInTheDocument();
    expect(within(summary).getByText("8")).toBeInTheDocument();
    expect(within(summary).getByText("Offense Points")).toBeInTheDocument();
    expect(within(summary).getByText("4")).toBeInTheDocument();
    expect(within(summary).getByText("Defense Points")).toBeInTheDocument();
  });

  it("summarizes the active evolution tab", () => {
    render(
      <CompetitionStatisticsTabs
        activeTab="evolution"
        onTabChange={() => undefined}
        summaryVariant="compact"
        teamEvolution={teamEvolution}
      />
    );

    const summary = getSummary();
    expect(within(summary).getAllByText("2")).toHaveLength(2);
    expect(within(summary).getByText("Completed games")).toBeInTheDocument();
    expect(within(summary).getByText("Omitted games")).toBeInTheDocument();
  });

  it("summarizes strategy and player tabs", () => {
    const { rerender } = render(
      <CompetitionStatisticsTabs
        activeTab="strategies"
        onTabChange={() => undefined}
        strategyStats={strategyStats}
        summaryVariant="compact"
      />
    );

    let summary = getSummary();
    expect(within(summary).getByText("Offense Strategies")).toBeInTheDocument();
    expect(within(summary).getByText("Defense Strategies")).toBeInTheDocument();

    rerender(
      <CompetitionStatisticsTabs
        activeTab="players"
        onTabChange={() => undefined}
        playerStats={playerStats}
        summaryVariant="compact"
      />
    );

    summary = getSummary();
    expect(within(summary).getByText("1")).toBeInTheDocument();
    expect(within(summary).getByText("player(s)")).toBeInTheDocument();
  });

  it("does not summarize a permission-hidden tab", () => {
    render(
      <CompetitionStatisticsTabs
        activeTab="players"
        canViewPlayerStatistics={false}
        onTabChange={() => undefined}
        playerStats={playerStats}
        summaryVariant="compact"
        teamStats={teamStats}
      />
    );

    const summary = getSummary();
    expect(within(summary).queryByText("player(s)")).not.toBeInTheDocument();
    expect(within(summary).getByText("Total Completed Points")).toBeInTheDocument();
  });
});
