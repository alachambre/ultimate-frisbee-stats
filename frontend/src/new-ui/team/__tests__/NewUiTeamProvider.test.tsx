import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { NewUiTeamProvider, useNewUiTeam } from "../NewUiTeamProvider";
import { server } from "../../../test/setup";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProvider(children: React.ReactNode) {
  render(
    <QueryClientProvider client={createQueryClient()}>
      <NewUiTeamProvider canLoadTeams>{children}</NewUiTeamProvider>
    </QueryClientProvider>
  );
}

function Probe() {
  const { selectedTeam, teams, setSelectedTeamId, isLoadingTeams } =
    useNewUiTeam();

  return (
    <div>
      <p>{isLoadingTeams ? "Loading teams" : "Teams loaded"}</p>
      <p>Selected team: {selectedTeam?.name ?? "none"}</p>
      <p>Teams count: {teams.length}</p>
      <button type="button" onClick={() => setSelectedTeamId(2)}>
        Select second team
      </button>
    </div>
  );
}

describe("NewUiTeamProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("auto-selects the only available team", async () => {
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(
        screen.getByText("Selected team: Monkey Stats")
      ).toBeInTheDocument();
    });
    expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("1");
  });

  it("restores a saved team when multiple teams are available", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(
        screen.getByText("Selected team: Banana Cutters")
      ).toBeInTheDocument();
    });
  });

  it("persists manual team selection", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Teams count: 2")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Select second team" }));

    expect(
      screen.getByText("Selected team: Banana Cutters")
    ).toBeInTheDocument();
    expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
  });
});
