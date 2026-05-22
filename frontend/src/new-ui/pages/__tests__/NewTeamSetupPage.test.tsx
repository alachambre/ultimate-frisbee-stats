import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewTeamSetupPage from "../NewTeamSetupPage";

const BASE_URL = "http://localhost:8000";

function renderPage() {
  return render(
    <NewUiTeamProvider canLoadTeams>
      <NewTeamSetupPage />
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

describe("NewTeamSetupPage", () => {
  it("shows selected-team setup links", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [
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
            ],
          },
        ])
      )
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Team setup" })
    ).toBeInTheDocument();
    expect(screen.getByText("Monkey Stats configuration")).toBeInTheDocument();
    expect(screen.getByText("2 players")).toBeInTheDocument();
    const rosterLinks = screen.getAllByRole("link", {
      name: "Open roster and lines",
    });
    expect(rosterLinks).toHaveLength(2);
    rosterLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/teams/1");
    });
    expect(screen.getByRole("link", { name: "Open competitions" }))
      .toHaveAttribute("href", "/competitions");
    expect(screen.getByRole("link", { name: "Open strategies" }))
      .toHaveAttribute("href", "/strategies");
  });

  it("offers the teams page when no team is selected", async () => {
    server.use(http.get(`${BASE_URL}/teams`, () => HttpResponse.json([])));

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "No team selected" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open teams" })).toHaveAttribute(
      "href",
      "/teams"
    );
  });
});
