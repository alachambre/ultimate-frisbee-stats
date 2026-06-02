import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import type { AppRole } from "../../../auth";
import { render, screen, waitFor } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewAllGamesPage from "../NewAllGamesPage";

const BASE_URL = "http://localhost:8000";

function shiftedLocalDateKey(daysFromToday: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function renderPage({
  role = "team_member",
  canLoadTeams = true,
}: {
  role?: AppRole;
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
          {
            id: 3,
            competition_id: 10,
            opponent_name: "Red Hawks",
            date: "2026-05-21T10:00:00Z",
            comments: null,
            status: "ended",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 13,
            opponent_score: 8,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
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
    expect(
      screen.getByRole("button", { name: /New game/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /New competition/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Results")).toBeInTheDocument();
    expect(screen.queryByText("Record")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Spring Cup" })
    ).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.getByText("Red Hawks")).toBeInTheDocument();
    expect(screen.queryByText("Other Team Game")).not.toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Go$/i })).toHaveAttribute(
      "href",
      "/live/1"
    );
    expect(screen.getByRole("link", { name: /^Review$/i })).toHaveAttribute(
      "href",
      "/games/3"
    );
  });

  it("filters grouped games by opponent search", async () => {
    const user = userEvent.setup();
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
      http.get(`${BASE_URL}/competitions`, () =>
        HttpResponse.json([
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
          {
            id: 20,
            team_id: 1,
            team_name: "Monkey Stats",
            name: "Empty Cup",
            description: null,
            start_date: "2026-06-01",
            end_date: "2026-06-02",
            status: "ongoing",
            created_at: "2026-05-01T00:00:00Z",
          },
        ])
      ),
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
            date: "2026-05-23T10:00:00Z",
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
        ])
      )
    );

    renderPage();

    expect(await screen.findByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.getByText("Red Hawks")).toBeInTheDocument();
    expect(screen.getByText("Empty Cup")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: /Opponent search/i }),
      "Blue"
    );

    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.queryByText("Red Hawks")).not.toBeInTheDocument();
    expect(screen.queryByText("Empty Cup")).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /^Go$/i })).toHaveAttribute(
      "href",
      "/games/1"
    );
  });

  it("hides the public spectator notice for an admin global dashboard", async () => {
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
            name: "Second Team",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      ),
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          {
            id: 1,
            competition_id: 10,
            opponent_name: "Admin Opponent",
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

    renderPage({ role: "admin" });

    expect(await screen.findByText("Admin Opponent")).toBeInTheDocument();
    expect(screen.getByText("All teams dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Public spectator view")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "You are seeing public game information. Sign in with team access to use the team dashboard."
      )
    ).not.toBeInTheDocument();
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

  it("shows selected-team competitions that have no games", async () => {
    const user = userEvent.setup();
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
      http.get(`${BASE_URL}/competitions`, () =>
        HttpResponse.json([
          {
            id: 10,
            team_id: 1,
            team_name: "Monkey Stats",
            name: "Fresh Tournament",
            description: null,
            start_date: "2026-06-01",
            end_date: "2026-06-02",
            status: "ongoing",
            created_at: "2026-05-01T00:00:00Z",
          },
        ])
      ),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage();

    expect(await screen.findByText("Fresh Tournament")).toBeInTheDocument();
    expect(
      screen.queryByText("No games for this team yet.")
    ).not.toBeInTheDocument();

    await user.click(screen.getByText("Fresh Tournament"));

    expect(
      screen.getByText("No games in this competition yet.")
    ).toBeInTheDocument();
  });

  it("shows competition edit and roster actions for users with edit access", async () => {
    const user = userEvent.setup();
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
      http.get(`${BASE_URL}/competitions`, () =>
        HttpResponse.json([
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
        ])
      ),
      http.get(`${BASE_URL}/competitions/10/players`, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Alex",
            number: 7,
            gender: "M",
            team_id: 1,
            created_at: "2026-01-01T00:00:00Z",
          },
        ])
      ),
      http.get(`${BASE_URL}/teams/1/players`, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Alex",
            number: 7,
            gender: "M",
            team_id: 1,
            created_at: "2026-01-01T00:00:00Z",
          },
          {
            id: 2,
            name: "Camille",
            number: 11,
            gender: "W",
            team_id: 1,
            created_at: "2026-01-01T00:00:00Z",
          },
        ])
      ),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage();

    expect(await screen.findByText("Spring Cup")).toBeInTheDocument();
    const editButton = screen.getByRole("button", {
      name: "Edit Spring Cup competition",
    });
    expect(editButton).toBeInTheDocument();
    const rosterButton = screen.getByRole("button", {
      name: "Manage Spring Cup roster",
    });
    expect(rosterButton).toBeInTheDocument();

    await user.click(editButton);

    expect(
      screen.getByRole("heading", { name: "Edit Competition" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Edit Competition" })
      ).not.toBeInTheDocument()
    );
    await user.click(
      screen.getByRole("button", { name: "Manage Spring Cup roster" })
    );

    expect(
      await screen.findByRole("heading", {
        name: "Manage Competition Roster",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("excludes over competitions from the New game competition dropdown", async () => {
    const user = userEvent.setup();
    const activeCompetitionStartDate = shiftedLocalDateKey(-1);
    const activeCompetitionEndDate = shiftedLocalDateKey(1);
    const endedCompetitionStartDate = shiftedLocalDateKey(-3);
    const endedCompetitionEndDate = shiftedLocalDateKey(-2);
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
        if (teamId === "1" || teamId === null) {
          return HttpResponse.json([
            {
              id: 10,
              team_id: 1,
              team_name: "Monkey Stats",
              name: "Active Cup",
              description: null,
              start_date: activeCompetitionStartDate,
              end_date: activeCompetitionEndDate,
              status: "ongoing",
              created_at: "2026-05-01T00:00:00Z",
            },
            {
              id: 20,
              team_id: 1,
              team_name: "Monkey Stats",
              name: "Ended Cup",
              description: null,
              start_date: endedCompetitionStartDate,
              end_date: endedCompetitionEndDate,
              status: "ongoing",
              created_at: "2026-04-01T00:00:00Z",
            },
          ]);
        }

        return HttpResponse.json([]);
      }),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage();

    await user.click(await screen.findByRole("button", { name: /New game/i }));
    expect(
      await screen.findByRole("heading", { name: "Create New Game" })
    ).toBeInTheDocument();
    await user.click(await screen.findByRole("combobox", { name: "Competition" }));

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toHaveTextContent("Active Cup");
    expect(listbox).not.toHaveTextContent("Ended Cup");
  });

  it("does not show privileged competition actions without edit access", async () => {
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
      http.get(`${BASE_URL}/competitions`, () =>
        HttpResponse.json([
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
        ])
      ),
      http.get(`${BASE_URL}/games`, () => HttpResponse.json([]))
    );

    renderPage({ role: "public" });

    expect(await screen.findByText("Spring Cup")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Spring Cup competition" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Manage Spring Cup roster" })
    ).not.toBeInTheDocument();
  });
});
