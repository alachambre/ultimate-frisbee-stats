import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor, within } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import type {
  PlayerGameStats,
  TeamEvolutionResponse,
  TeamStrategyStats,
  TeamTeamStats,
  TurnoverTypeBucket,
  TurnoverTypeStats,
} from "../../../types";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewStatisticsPage from "../NewStatisticsPage";

const BASE_URL = "http://localhost:8000";

const teamStats: TeamTeamStats = {
  team_id: 1,
  total_completed_points: 12,
  turnover_type_stats: createTurnoverTypeStats(),
  offense: {
    points_started: 8,
    points_won: 6,
    points_lost: 2,
    hold_rate: 0.75,
    points_won_no_turnover: 5,
    clean_hold_rate: 0.625,
    broken_rate: 0.25,
    our_turnovers: 4,
    opponent_turnovers: 2,
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
    our_turnovers: 1,
    opponent_turnovers: 6,
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
  omitted_games_count: 0,
  metrics: [
    {
      id: "total_our_turnovers",
      label: "Our turns",
      description: "Our turns",
      unit: "count",
      group: "turnovers",
      format: "integer",
      higher_is_better: false,
    },
    {
      id: "total_opponent_turnovers",
      label: "Opponent turns",
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
      game_id: 1,
      competition_id: 10,
      competition_name: "Spring Cup",
      opponent_name: "Blue Tigers",
      date: "2026-05-22T10:00:00Z",
      our_score: 13,
      opponent_score: 9,
      completed_points: 12,
      metrics: {
        total_our_turnovers: 5,
        total_opponent_turnovers: 8,
      },
    },
  ],
};

const teamStrategyStats: TeamStrategyStats = {
  team_id: 1,
  offense_strategies: [
    {
      strategy_id: 1,
      strategy_name: "Vertical stack",
      points_played: 8,
      points_won: 6,
      points_lost: 2,
      hold_rate: 0.75,
      clean_holds: 5,
      clean_hold_rate: 0.625,
      quick_scores: 1,
      quick_score_rate: 0.125,
    },
  ],
  defense_strategies: [
    {
      strategy_id: 2,
      strategy_name: "Zone defense",
      points_played: 4,
      points_won: 2,
      points_lost: 2,
      break_rate: 0.5,
      points_with_turnover: 3,
      turnover_rate: 0.75,
      turnover_type_stats: createTurnoverTypeStats(),
    },
  ],
};

const teamPlayerStats: PlayerGameStats[] = [
  {
    player_id: 1,
    player_name: "Alice",
    player_number: 12,
    points_played: 10,
    effective_time_seconds: 1840,
    offense: {
      points_played: 6,
      points_won: 5,
      points_lost: 1,
      hold_rate: 0.833,
      points_won_no_turnover: 4,
      clean_hold_rate: 0.667,
      our_turnovers: 1,
      opponent_turnovers: 0,
    },
    defense: {
      points_played: 4,
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
      our_turnovers: 0,
      opponent_turnovers: 4,
    },
  },
  {
    player_id: 2,
    player_name: "Boris",
    player_number: 8,
    points_played: 8,
    effective_time_seconds: 960,
    offense: {
      points_played: 8,
      points_won: 4,
      points_lost: 4,
      hold_rate: 0.5,
      points_won_no_turnover: 3,
      clean_hold_rate: 0.375,
      our_turnovers: 3,
      opponent_turnovers: 1,
    },
    defense: {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      break_rate: 0,
      points_with_turnover: 0,
      turnover_rate: 0,
      conversion_rate: 0,
      points_won_no_turnover: 0,
      clean_break_rate: 0,
      clean_conversion_rate: 0,
      points_lost_no_turnover: 0,
      our_turnovers: 0,
      opponent_turnovers: 0,
    },
  },
];

function createTurnoverTypeBucket(total: number): TurnoverTypeBucket {
  return {
    total_turnovers: total,
    by_type: {
      defended_pass: { count: 0, percentage: 0 },
      missed_pass: { count: 0, percentage: 0 },
      defended_huck: { count: 0, percentage: 0 },
      missed_huck: { count: 0, percentage: 0 },
      drop: { count: Math.min(total, 1), percentage: total > 0 ? 1 / total : 0 },
      stall_out: { count: 0, percentage: 0 },
      miscommunication: { count: Math.max(total - 1, 0), percentage: total > 0 ? (total - 1) / total : 0 },
      other: { count: 0, percentage: 0 },
    },
  };
}

function createTurnoverTypeStats(): TurnoverTypeStats {
  return {
    all_points: {
      our_possession_turnovers: createTurnoverTypeBucket(5),
      opponent_possession_turnovers: createTurnoverTypeBucket(8),
    },
    started_on_offense: {
      our_possession_turnovers: createTurnoverTypeBucket(4),
      opponent_possession_turnovers: createTurnoverTypeBucket(2),
    },
    started_on_defense: {
      our_possession_turnovers: createTurnoverTypeBucket(1),
      opponent_possession_turnovers: createTurnoverTypeBucket(6),
    },
  };
}

function setupHandlers() {
  server.use(
    http.get(`${BASE_URL}/teams`, () =>
      HttpResponse.json([
        {
          id: 1,
          name: "Monkey Stats",
          created_at: "2026-01-01T00:00:00Z",
          players: [],
        },
        {
          id: 2,
          name: "Flying Foxes",
          created_at: "2026-01-01T00:00:00Z",
          players: [],
        },
      ])
    ),
    http.get(`${BASE_URL}/competitions`, ({ request }) => {
      const teamId = new URL(request.url).searchParams.get("team_id");
      if (teamId === "1") {
        return HttpResponse.json([
          {
            id: 10,
            team_id: 1,
            team_name: "Monkey Stats",
            name: "Spring Cup",
            description: null,
            start_date: "2026-05-01",
            end_date: "2026-05-31",
            status: "ongoing",
            created_at: "2026-05-01T00:00:00Z",
          },
        ]);
      }

      return HttpResponse.json([]);
    }),
    http.get(`${BASE_URL}/games`, () =>
      HttpResponse.json([
        {
          id: 1,
          competition_id: 10,
          opponent_name: "Blue Tigers",
          date: "2026-05-22T10:00:00Z",
          comments: null,
          status: "ended",
          start_datetime: "2026-05-22T10:00:00Z",
          end_datetime: "2026-05-22T11:30:00Z",
          created_at: "2026-05-01T00:00:00Z",
          our_score: 13,
          opponent_score: 9,
          team_name: "Monkey Stats",
          competition_name: "Spring Cup",
        },
      ])
    ),
    http.get(`${BASE_URL}/statistics/teams/1/team`, () =>
      HttpResponse.json(teamStats)
    ),
    http.get(`${BASE_URL}/statistics/teams/2/team`, () =>
      HttpResponse.json({ ...teamStats, team_id: 2 })
    ),
    http.get(`${BASE_URL}/statistics/teams/1/evolution`, () =>
      HttpResponse.json(teamEvolution)
    ),
    http.get(`${BASE_URL}/statistics/teams/2/evolution`, () =>
      HttpResponse.json({
        ...teamEvolution,
        team_id: 2,
        games: [],
      })
    ),
    http.get(`${BASE_URL}/statistics/teams/1/strategies`, () =>
      HttpResponse.json(teamStrategyStats)
    ),
    http.get(`${BASE_URL}/statistics/teams/2/strategies`, () =>
      HttpResponse.json({ ...teamStrategyStats, team_id: 2 })
    ),
    http.get(`${BASE_URL}/statistics/teams/1/players`, () =>
      HttpResponse.json(teamPlayerStats)
    ),
    http.get(`${BASE_URL}/statistics/teams/2/players`, () =>
      HttpResponse.json(teamPlayerStats)
    )
  );
}

function renderPage(
  role: "team_member" | "team_analyst" = "team_analyst",
  route = "/statistics"
) {
  return render(
    <NewUiTeamProvider canLoadTeamDetails>
      <NewStatisticsPage />
    </NewUiTeamProvider>,
    {
      route,
      auth: {
        role,
        isAuthenticated: true,
        hasAppAccess: true,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewStatisticsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    setupHandlers();
  });

  it("syncs the selected app team and renders the coach overview", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Statistics" })
    ).toBeInTheDocument();
    expect(screen.getByText("Monkey Stats coach overview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
    expect(screen.getAllByText("Monkey Stats").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("Hold rate")).toBeInTheDocument();
    expect(screen.getByText("Break rate")).toBeInTheDocument();
    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("50%").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("navigation", { name: "Statistics sections" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Current stats" })).toBeInTheDocument();
    expect(screen.getByText("Evolution chart")).toBeInTheDocument();
    expect(screen.getByText("Player comparison")).toBeInTheDocument();

    await waitFor(() => {
      expect(window.location.search).toContain("teamId=1");
    });
  });

  it("uses an explicit statistics team link before the persisted app team", async () => {
    renderPage("team_analyst", "/statistics?teamId=2");

    expect(
      await screen.findByText("Flying Foxes coach overview")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
      expect(window.location.search).toContain("teamId=2");
      expect(window.location.search).not.toContain("teamId=1");
    });
  });

  it("keeps member permissions for filters and exports", async () => {
    renderPage("team_member");

    expect(await screen.findByText("Monkey Stats coach overview")).toBeInTheDocument();
    expect(screen.queryByLabelText("4. Player filter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export csv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Players" })).not.toBeInTheDocument();
    expect(await screen.findByText("Strategy details")).toBeInTheDocument();
  });

  it("updates the app selected team from the statistics team selector", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Monkey Stats coach overview")
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("1. Team"));
    await user.click(await screen.findByRole("option", { name: "Flying Foxes" }));

    await waitFor(() => {
      expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
      expect(window.location.search).toContain("teamId=2");
    });
  });

  it("sorts the player table from column headers", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Player comparison")).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "Player statistics" });
    let rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice");
    expect(rows[2]).toHaveTextContent("Boris");

    await user.click(within(table).getByRole("button", { name: "O Points" }));

    rows = within(table).getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Boris");
    expect(rows[2]).toHaveTextContent("Alice");
  });
});
