import { describe, expect, it } from "vitest";
import { render, screen, within } from "../../../test/test-utils";
import type { TeamEvolutionResponse } from "../../../types";
import StatisticsEvolutionTable from "../StatisticsEvolutionTable";

const baseEvolution: TeamEvolutionResponse = {
  team_id: 1,
  filters: {
    competition_ids: [],
    game_ids: [],
    player_ids: [],
  },
  default_preset_id: "turnover_battle",
  omitted_games_count: 1,
  metrics: [
    {
      id: "total_our_turnovers",
      label: "Our turnovers",
      description: "Our turns",
      unit: "count",
      group: "turnovers",
      format: "integer",
      higher_is_better: false,
    },
    {
      id: "total_opponent_turnovers",
      label: "Opponent turnovers",
      description: "Opponent turns",
      unit: "count",
      group: "turnovers",
      format: "integer",
      higher_is_better: true,
    },
  ],
  presets: [
    {
      id: "turnover_battle",
      label: "Turnover battle",
      metric_ids: ["total_our_turnovers", "total_opponent_turnovers"],
    },
  ],
  games: [
    {
      game_id: 10,
      competition_id: 20,
      competition_name: "Spring Cup",
      opponent_name: "Rivals",
      date: "2026-03-15T10:00:00Z",
      our_score: 2,
      opponent_score: 1,
      completed_points: 3,
      metrics: {
        total_our_turnovers: 4,
        total_opponent_turnovers: 5,
      },
    },
  ],
};

describe("StatisticsEvolutionTable", () => {
  it("renders the default preset columns and omitted games state", () => {
    render(
      <StatisticsEvolutionTable
        evolution={baseEvolution}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText("Evolution")).toBeInTheDocument();
    expect(screen.getByText("1 game omitted")).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Statistics evolution table" });
    expect(within(table).getByText("Rivals")).toBeInTheDocument();
    expect(within(table).getByText("Spring Cup")).toBeInTheDocument();
    expect(within(table).getByText("Our turnovers")).toBeInTheDocument();
    expect(within(table).getByText("Opponent turnovers")).toBeInTheDocument();
    expect(within(table).getByText("2 - 1")).toBeInTheDocument();
  });

  it("renders loading, error, and empty states", () => {
    const { rerender } = render(
      <StatisticsEvolutionTable isLoading error={null} />
    );

    expect(screen.getByText("Loading evolution data...")).toBeInTheDocument();

    rerender(
      <StatisticsEvolutionTable
        isLoading={false}
        error={new Error("Evolution failed")}
      />
    );
    expect(screen.getByText(/Evolution failed/)).toBeInTheDocument();

    rerender(
      <StatisticsEvolutionTable
        evolution={{ ...baseEvolution, games: [] }}
        isLoading={false}
        error={null}
      />
    );
    expect(
      screen.getByText("No completed games are available for this selection.")
    ).toBeInTheDocument();
  });
});
