import { describe, expect, it } from "vitest";
import { Chart as ChartJS } from "chart.js";
import { render, screen, waitFor, within } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
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
    {
      id: "offense_hold_rate",
      label: "Hold rate",
      description: "Offensive points won, out of all offensive points played.",
      unit: "percentage",
      group: "offense",
      format: "percentage",
      higher_is_better: true,
    },
    {
      id: "points_won",
      label: "Points won",
      description: "Completed points won by us.",
      unit: "count",
      group: "results",
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
        offense_hold_rate: 0.5,
        points_won: 2,
      },
    },
  ],
};

describe("StatisticsEvolutionTable", () => {
  it("registers Chart.js controllers needed by the lazy evolution chart", async () => {
    await import("../StatisticsEvolutionChart");

    expect(() => ChartJS.registry.getController("bar")).not.toThrow();
    expect(() => ChartJS.registry.getController("line")).not.toThrow();
  });

  it("renders the default preset columns and omitted games state", async () => {
    render(
      <StatisticsEvolutionTable
        evolution={baseEvolution}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByText("Evolution")).toBeInTheDocument();
    expect(screen.getByText("Evolution chart")).toBeInTheDocument();
    expect(screen.getByText("1 game omitted")).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Statistics evolution chart" })).toHaveAttribute(
      "data-chart-type",
      "bar"
    );
    expect(screen.getByRole("button", { name: "Auto" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    const table = screen.getByRole("table", { name: "Statistics evolution table" });
    expect(within(table).getByText("Rivals")).toBeInTheDocument();
    expect(within(table).getByText("Spring Cup")).toBeInTheDocument();
    expect(within(table).getByText("Our turnovers")).toBeInTheDocument();
    expect(within(table).getByText("Opponent turnovers")).toBeInTheDocument();
    expect(within(table).getByText("2 - 1")).toBeInTheDocument();
  });

  it("allows adding compatible count metrics", async () => {
    const user = userEvent.setup();
    render(
      <StatisticsEvolutionTable
        evolution={baseEvolution}
        isLoading={false}
        error={null}
      />
    );

    await user.click(screen.getByLabelText("Metrics"));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Points won"));

    const table = screen.getByRole("table", { name: "Statistics evolution table" });
    expect(within(table).getByText("Our turnovers")).toBeInTheDocument();
    expect(within(table).getByText("Opponent turnovers")).toBeInTheDocument();
    expect(within(table).getByText("Points won")).toBeInTheDocument();
  });

  it("keeps metric selections compatible and supports chart modes", async () => {
    const user = userEvent.setup();
    render(
      <StatisticsEvolutionTable
        evolution={baseEvolution}
        isLoading={false}
        error={null}
      />
    );

    await user.click(screen.getByLabelText("Metrics"));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Hold rate"));

    const table = screen.getByRole("table", { name: "Statistics evolution table" });
    expect(within(table).getByText("Hold rate")).toBeInTheDocument();
    expect(within(table).queryByText("Our turnovers")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Statistics evolution chart" })).toHaveAttribute(
        "data-chart-type",
        "line"
      );
    });

    await user.click(screen.getByRole("button", { name: "Bar" }));
    expect(screen.getByRole("button", { name: "Bar" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Statistics evolution chart" })).toHaveAttribute(
        "data-chart-type",
        "bar"
      );
    });

    await user.click(screen.getByRole("button", { name: "Line" }));
    expect(screen.getByRole("button", { name: "Line" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Statistics evolution chart" })).toHaveAttribute(
        "data-chart-type",
        "line"
      );
    });
  });

  it("allows clearing all metric selections without restoring the default preset", async () => {
    const user = userEvent.setup();
    render(
      <StatisticsEvolutionTable
        evolution={baseEvolution}
        isLoading={false}
        error={null}
      />
    );

    await screen.findByRole("img", { name: "Statistics evolution chart" });
    await user.click(screen.getByLabelText("Metrics"));

    let listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Our turnovers"));
    await user.click(within(listbox).getByText("Opponent turnovers"));

    expect(
      screen.getByText("No evolution metrics are available for this selection.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Statistics evolution chart" })
    ).not.toBeInTheDocument();

    listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Points won"));

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Statistics evolution chart" })).toHaveAttribute(
        "data-chart-type",
        "bar"
      );
    });

    const table = screen.getByRole("table", { name: "Statistics evolution table" });
    expect(within(table).getByText("Points won")).toBeInTheDocument();
    expect(within(table).queryByText("Our turnovers")).not.toBeInTheDocument();
    expect(within(table).queryByText("Opponent turnovers")).not.toBeInTheDocument();
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
