import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewAllGamesPage from "../NewAllGamesPage";

const BASE_URL = "http://localhost:8000";

function renderPage({
  role = "team_member",
  canLoadTeams = true,
}: {
  role?: "public" | "team_member";
  canLoadTeams?: boolean;
} = {}) {
  return render(
    <NewUiTeamProvider canLoadTeams={canLoadTeams}>
      <NewAllGamesPage />
    </NewUiTeamProvider>,
    {
      auth: {
        role,
        isAuthenticated: role !== "public",
        hasAppAccess: role !== "public",
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewAllGamesPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a selected-team dashboard with scoped games", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
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
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 5,
            opponent_score: 4,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
          {
            id: 2,
            competition_id: 99,
            opponent_name: "Other Team Game",
            date: "2026-05-22T11:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 0,
            opponent_score: 0,
            team_name: "Other Team",
            competition_name: "Other Cup",
          },
        ])
      )
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "All games" })
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Monkey Stats dashboard")).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.queryByText("Other Team Game")).not.toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
  });

  it("shows public fallback games when teams cannot be loaded", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          {
            id: 1,
            competition_id: 10,
            opponent_name: "Public Opponent",
            date: "2026-05-22T10:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 3,
            opponent_score: 2,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
        ])
      )
    );

    renderPage({ role: "public", canLoadTeams: false });

    expect(await screen.findByText("Public Opponent")).toBeInTheDocument();
    expect(screen.getByText("Public spectator view")).toBeInTheDocument();
  });

  it("shows an empty state when the selected team has no games", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      ),
      http.get(`${BASE_URL}/competitions`, () => HttpResponse.json([])),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage();

    expect(
      await screen.findByText("No games for this team yet.")
    ).toBeInTheDocument();
  });
});
