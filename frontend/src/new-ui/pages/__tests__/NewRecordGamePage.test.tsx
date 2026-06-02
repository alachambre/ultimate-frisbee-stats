import { HttpResponse, http } from "msw";
import { afterEach, vi } from "vitest";

import { render, screen, waitFor } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewRecordGamePage from "../NewRecordGamePage";

const BASE_URL = "http://localhost:8000";

function renderPage() {
  return render(
    <NewUiTeamProvider canLoadTeamDetails>
      <NewRecordGamePage />
    </NewUiTeamProvider>,
    {
      auth: {
        role: "team_member",
        isAuthenticated: true,
        hasAppAccess: true,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewRecordGamePage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows selected-team started and ready games only", async () => {
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
            competition_id: 10,
            opponent_name: "Red Hawks",
            date: "2026-05-22T12:00:00Z",
            comments: null,
            status: "ready",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 0,
            opponent_score: 0,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
          {
            id: 3,
            competition_id: 99,
            opponent_name: "Other Team",
            date: "2026-05-22T12:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 0,
            opponent_score: 0,
            team_name: "Other",
            competition_name: "Other Cup",
          },
        ])
      )
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Record game" })
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.getByText("Red Hawks")).toBeInTheDocument();
    expect(screen.queryByText("Other Team")).not.toBeInTheDocument();
    expect(screen.getByText("Continue recording")).toBeInTheDocument();
    expect(screen.getByText("Prepare game")).toBeInTheDocument();
  });

  it("shows an empty state when no games can be recorded", async () => {
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
      await screen.findByText("No games are ready to record.")
    ).toBeInTheDocument();
  });

  it("shows the page error when the selected team context cannot load", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json({ detail: "Teams unavailable" }, { status: 500 })
      ),
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          {
            id: 3,
            competition_id: 99,
            opponent_name: "Other Team",
            date: "2026-05-22T12:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 0,
            opponent_score: 0,
            team_name: "Other",
            competition_name: "Other Cup",
          },
        ])
      )
    );

    renderPage();

    expect(
      await screen.findByText("Unable to load games to record.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Other Team")).not.toBeInTheDocument();
  });
});
