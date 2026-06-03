import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor, within } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewTeamSetupPage from "../NewTeamSetupPage";

const BASE_URL = "http://localhost:8000";
const STORAGE_KEY = "monkey-statistics-new-ui-team-id";

const selectedTeam = {
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
    {
      id: 3,
      name: "Sam",
      number: null,
      gender: "M",
      team_id: 1,
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
};

const selectedTeamLines = [
  {
    id: 10,
    team_id: 1,
    name: "A line",
    description: "Default offense",
    created_at: "2026-01-01T00:00:00Z",
    players: [selectedTeam.players[0], selectedTeam.players[1]],
  },
  {
    id: 11,
    team_id: 1,
    name: "Zone D",
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    players: [selectedTeam.players[2]],
  },
];

function renderPage() {
  return render(
    <NewUiTeamProvider canLoadTeamDetails>
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

function useSelectedTeamWorkspaceHandlers() {
  localStorage.setItem(STORAGE_KEY, "1");
  server.use(
    http.get(`${BASE_URL}/teams`, () => HttpResponse.json([selectedTeam])),
    http.get(`${BASE_URL}/teams/1`, () => HttpResponse.json(selectedTeam)),
    http.get(`${BASE_URL}/lines`, () => HttpResponse.json(selectedTeamLines))
  );
}

describe("NewTeamSetupPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the selected-team workspace summary and tabs", async () => {
    useSelectedTeamWorkspaceHandlers();

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Team setup" })
    ).toBeInTheDocument();
    expect(screen.getByText("Monkey Stats")).toBeInTheDocument();
    expect(
      screen.getByText("All setup changes below apply to this team.")
    ).toBeInTheDocument();

    const summary = screen.getByLabelText("Team summary");
    expect(within(summary).getByText("Players")).toBeInTheDocument();
    expect(within(summary).getByText("3")).toBeInTheDocument();
    expect(within(summary).getByText("Men")).toBeInTheDocument();
    expect(within(summary).getAllByText("2")).toHaveLength(2);
    expect(within(summary).getByText("Women")).toBeInTheDocument();
    expect(within(summary).getByText("Lines")).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: /Roster/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Lines/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Strategies/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Competitions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Strategies/i)).not.toBeInTheDocument();
  });

  it("filters roster players and opens edit from the row affordance", async () => {
    const user = userEvent.setup();
    useSelectedTeamWorkspaceHandlers();

    renderPage();

    expect(await screen.findAllByText("Alex")).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Women" }));

    expect(screen.queryByText("Alex")).not.toBeInTheDocument();
    expect(screen.getAllByText("Camille")).not.toHaveLength(0);

    await user.click(
      screen.getAllByRole("button", { name: "Edit Camille" })[0]
    );

    expect(
      await screen.findByRole("heading", { name: "Edit Player" })
    ).toBeInTheDocument();
  });

  it("shows line rows without usage or game-count concepts", async () => {
    const user = userEvent.setup();
    useSelectedTeamWorkspaceHandlers();

    renderPage();

    await user.click(await screen.findByRole("tab", { name: /Lines/ }));

    expect(
      screen.getByRole("table", { name: "Team lines" })
    ).toBeInTheDocument();
    expect(screen.getAllByText("A line")).not.toHaveLength(0);
    expect(screen.getAllByText("1M / 1W")).not.toHaveLength(0);
    expect(screen.getAllByText("Alex, Camille")).not.toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "Manage A line roster" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/usage/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/game count/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/games/i)).not.toBeInTheDocument();
  });

  it("does not show false empty line membership while lines are loading", async () => {
    localStorage.setItem(STORAGE_KEY, "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () => HttpResponse.json([selectedTeam])),
      http.get(`${BASE_URL}/teams/1`, () => HttpResponse.json(selectedTeam)),
      http.get(`${BASE_URL}/lines`, async () => {
        await delay(200);
        return HttpResponse.json(selectedTeamLines);
      })
    );

    renderPage();

    expect(await screen.findAllByText("Alex")).not.toHaveLength(0);
    expect(screen.getAllByText("Loading lines...")).not.toHaveLength(0);
    expect(screen.queryAllByText("No lines")).toHaveLength(0);
  });

  it("creates a line for the currently selected team after switching teams", async () => {
    const user = userEvent.setup();
    let createdLineTeamId: number | undefined;
    const firstTeam = selectedTeam;
    const secondTeam = {
      id: 2,
      name: "Skyline",
      created_at: "2026-01-01T00:00:00Z",
      players: [],
    };
    localStorage.setItem(STORAGE_KEY, "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () =>
        HttpResponse.json([firstTeam, secondTeam])
      ),
      http.get(`${BASE_URL}/teams/1`, () => HttpResponse.json(firstTeam)),
      http.get(`${BASE_URL}/teams/2`, () => HttpResponse.json(secondTeam)),
      http.get(`${BASE_URL}/lines`, ({ request }) => {
        const url = new URL(request.url);
        const teamId = Number(url.searchParams.get("team_id"));
        return HttpResponse.json(teamId === 1 ? selectedTeamLines : []);
      }),
      http.post(`${BASE_URL}/lines`, async ({ request }) => {
        const body = (await request.json()) as { team_id: number; name: string };
        createdLineTeamId = body.team_id;
        return HttpResponse.json({
          id: 20,
          team_id: body.team_id,
          name: body.name,
          description: null,
          created_at: "2026-01-01T00:00:00Z",
        });
      })
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Team setup" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Selected team" }));
    await user.click(await screen.findByRole("option", { name: "Skyline" }));
    expect(
      await screen.findByText("Skyline configuration")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Lines/ }));
    await user.click(screen.getByRole("button", { name: "New line" }));
    const lineDialog = await screen.findByRole("dialog", {
      name: "Create New Line",
    });
    await user.type(within(lineDialog).getAllByRole("textbox")[0], "Skyline line");
    await user.click(within(lineDialog).getByRole("button", { name: "Create Line" }));

    await waitFor(() => {
      expect(createdLineTeamId).toBe(2);
    });
  });

  it("offers selecting or creating a team when no team is selected", async () => {
    const user = userEvent.setup();
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
            name: "Skyline",
            created_at: "2026-01-01T00:00:00Z",
            players: [],
          },
        ])
      )
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "No team selected" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Selected team" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open teams" })).toHaveAttribute(
      "href",
      "/teams"
    );

    await user.click(screen.getByRole("button", { name: "New team" }));

    expect(
      await screen.findByRole("heading", { name: "Create New Team" })
    ).toBeInTheDocument();
  });

  it("selects a newly created team in the workspace", async () => {
    const user = userEvent.setup();
    let teams = [
      {
        id: 1,
        name: "Monkey Stats",
        created_at: "2026-01-01T00:00:00Z",
        players: [],
      },
    ];
    localStorage.setItem(STORAGE_KEY, "1");
    server.use(
      http.get(`${BASE_URL}/teams`, () => HttpResponse.json(teams)),
      http.get(`${BASE_URL}/teams/1`, () => HttpResponse.json(teams[0])),
      http.get(`${BASE_URL}/teams/3`, () =>
        HttpResponse.json({
          id: 3,
          name: "Falcons",
          created_at: "2026-01-01T00:00:00Z",
          players: [],
        })
      ),
      http.get(`${BASE_URL}/lines`, () => HttpResponse.json([])),
      http.post(`${BASE_URL}/teams`, async ({ request }) => {
        const body = (await request.json()) as { name: string };
        const newTeam = {
          id: 3,
          name: body.name,
          created_at: "2026-01-01T00:00:00Z",
          players: [],
        };
        teams = [...teams, newTeam];
        return HttpResponse.json(newTeam, { status: 201 });
      })
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Team setup" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New team" }));
    expect(
      await screen.findByRole("heading", { name: "Create New Team" })
    ).toBeInTheDocument();
    const teamDialog = await screen.findByRole("dialog", {
      name: "Create New Team",
    });
    await user.type(within(teamDialog).getByRole("textbox"), "Falcons");
    await user.click(within(teamDialog).getByRole("button", { name: "Create Team" }));

    expect(
      await screen.findByText("Falcons configuration")
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("3");
  });
});
