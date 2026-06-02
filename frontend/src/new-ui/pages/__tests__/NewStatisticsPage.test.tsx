import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import type { TeamTeamStats } from "../../../types";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewStatisticsPage from "../NewStatisticsPage";

const BASE_URL = "http://localhost:8000";

const teamStats: TeamTeamStats = {
  team_id: 1,
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
    http.get(`${BASE_URL}/statistics/teams/2/evolution`, () =>
      HttpResponse.json({
        team_id: 2,
        filters: {
          competition_ids: [],
          game_ids: [],
          player_ids: [],
        },
        default_preset_id: "turnover_battle",
        omitted_games_count: 0,
        games: [],
        metrics: [],
        presets: [],
      })
    )
  );
}

function renderPage(
  role: "team_member" | "team_analyst" = "team_analyst",
  route = "/statistics"
) {
  return render(
    <NewUiTeamProvider canLoadTeams>
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
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
    expect(screen.getAllByText("Monkey Stats").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByText("Hold rate")).toBeInTheDocument();
    expect(screen.getByText("Break rate")).toBeInTheDocument();
    expect(screen.getAllByText("75%").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("50%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Statistics summary")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();

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

    expect(await screen.findByText("Coach overview")).toBeInTheDocument();
    expect(screen.queryByLabelText("4. Player filter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export csv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Players" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
  });

  it("updates the app selected team from the statistics team selector", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText("Monkey Stats coach overview")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.click(screen.getByLabelText("1. Team"));
    await user.click(await screen.findByRole("option", { name: "Flying Foxes" }));

    await waitFor(() => {
      expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
      expect(window.location.search).toContain("teamId=2");
    });
  });
});
