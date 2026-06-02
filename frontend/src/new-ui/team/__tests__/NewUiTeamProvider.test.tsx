import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewUiTeamProvider, useNewUiTeam } from "../NewUiTeamProvider";
import { queryKeys } from "../../../utils/queryKeys";
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

function renderWithProvider(
  children: React.ReactNode,
  {
    canLoadTeamDetails = true,
    queryClient = createQueryClient(),
  }: { canLoadTeamDetails?: boolean; queryClient?: QueryClient } = {}
) {
  render(
    <QueryClientProvider client={queryClient}>
      <NewUiTeamProvider canLoadTeamDetails={canLoadTeamDetails}>
        {children}
      </NewUiTeamProvider>
    </QueryClientProvider>
  );
}

function Probe() {
  const {
    selectedTeam,
    selectedTeamId,
    teams,
    setSelectedTeamId,
    isLoadingTeams,
  } =
    useNewUiTeam();

  return (
    <div>
      <p>{isLoadingTeams ? "Loading teams" : "Teams loaded"}</p>
      <p>Selected team: {selectedTeam?.name ?? "none"}</p>
      <p>Selected team id: {selectedTeamId ?? "none"}</p>
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

  it("keeps a saved team while stale cached teams refetch", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.teams, [
      {
        id: 1,
        name: "Monkey Stats",
        created_at: "2026-01-01T00:00:00Z",
        players: [],
      },
    ]);
    server.use(
      http.get("http://localhost:8000/teams", async () => {
        await delay(25);
        return HttpResponse.json([
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ]);
      })
    );

    renderWithProvider(<Probe />, { queryClient });

    expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
    expect(screen.getByText("Loading teams")).toBeInTheDocument();
    expect(screen.getByText("Selected team: none")).toBeInTheDocument();
    expect(screen.queryByText("Selected team: Monkey Stats")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Selected team: Banana Cutters")
      ).toBeInTheDocument();
      expect(screen.getByText("Selected team id: 2")).toBeInTheDocument();
      expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
    });
  });

  it("clears a saved team when no teams are available", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    server.use(
      http.get("http://localhost:8000/teams", () => HttpResponse.json([]))
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Teams loaded")).toBeInTheDocument();
      expect(screen.getByText("Selected team: none")).toBeInTheDocument();
      expect(
        localStorage.getItem("monkey-statistics-new-ui-team-id")
      ).toBeNull();
    });
  });

  it("keeps a saved team when loading teams fails", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    server.use(
      http.get("http://localhost:8000/teams", () =>
        HttpResponse.json({ detail: "Service unavailable" }, { status: 500 })
      )
    );

    renderWithProvider(<Probe />);

    await waitFor(() => {
      expect(screen.getByText("Teams loaded")).toBeInTheDocument();
      expect(localStorage.getItem("monkey-statistics-new-ui-team-id")).toBe("2");
    });
  });

  it("loads public team options when protected team details are disabled", async () => {
    localStorage.setItem("monkey-statistics-new-ui-team-id", "2");
    const protectedRequestHandler = vi.fn(() => HttpResponse.json([]));
    const publicRequestHandler = vi.fn(() =>
      HttpResponse.json([
        {
          id: 2,
          name: "Banana Cutters",
          created_at: "2026-01-01T00:00:00Z",
        },
      ])
    );
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.teams, [
      {
        id: 2,
        name: "Banana Cutters",
        created_at: "2026-01-01T00:00:00Z",
        players: [],
      },
    ]);
    server.use(
      http.get("http://localhost:8000/teams", protectedRequestHandler),
      http.get("http://localhost:8000/teams/public", publicRequestHandler)
    );

    renderWithProvider(<Probe />, { canLoadTeamDetails: false, queryClient });

    await waitFor(() => {
      expect(screen.getByText("Teams count: 1")).toBeInTheDocument();
      expect(screen.getByText("Selected team: Banana Cutters")).toBeInTheDocument();
      expect(screen.getByText("Selected team id: 2")).toBeInTheDocument();
      expect(publicRequestHandler).toHaveBeenCalled();
      expect(protectedRequestHandler).not.toHaveBeenCalled();
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
