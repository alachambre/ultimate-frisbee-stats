import { HttpResponse, http } from "msw";
import { vi } from "vitest";

import { render, screen, waitFor } from "../../test/test-utils";
import { server } from "../../test/setup";
import type { CompetitionWithPlayers, GameDetail, GameLiveState, Player } from "../../types";
import RecordGameDetailPage from "../RecordGameDetailPage";

const BASE_URL = "http://localhost:8000";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ gameId: "1" }),
  };
});

const players: Player[] = [
  {
    id: 1,
    name: "Alex",
    number: 7,
    gender: "M",
    team_id: 1,
    created_at: "2026-05-01T00:00:00Z",
  },
  {
    id: 2,
    name: "Camille",
    number: 11,
    gender: "W",
    team_id: 1,
    created_at: "2026-05-01T00:00:00Z",
  },
];

const competition: CompetitionWithPlayers = {
  id: 10,
  team_id: 1,
  name: "Spring Cup",
  description: null,
  start_date: "2026-05-01",
  end_date: "2026-05-31",
  status: "ongoing",
  created_at: "2026-05-01T00:00:00Z",
  players,
};

function createGame(status: GameDetail["status"]): GameDetail {
  return {
    id: 1,
    competition_id: competition.id,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status,
    start_datetime: status === "started" ? "2026-05-22T10:05:00Z" : null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: status === "started" ? 5 : 0,
    opponent_score: status === "started" ? 4 : 0,
    team_name: "Monkey Stats",
    competition_name: competition.name,
    points: [],
    players,
    halftime: null,
  };
}

function setupHandlers(game: GameDetail) {
  const liveState: GameLiveState = {
    game_id: game.id,
    status: game.status,
    our_score: game.our_score,
    opponent_score: game.opponent_score,
    active_point: null,
    active_point_turnovers: [],
    active_point_stoppages: [],
  };

  server.use(
    http.get(`${BASE_URL}/games/1`, () => HttpResponse.json(game)),
    http.get(`${BASE_URL}/games/1/live-state`, () =>
      HttpResponse.json(liveState)
    ),
    http.get(`${BASE_URL}/games/1/turnovers`, () => HttpResponse.json([])),
    http.get(`${BASE_URL}/competitions/10`, () =>
      HttpResponse.json(competition)
    ),
    http.get(`${BASE_URL}/statistics/games/1/live`, () =>
      HttpResponse.json([])
    )
  );
}

function renderPage() {
  return render(<RecordGameDetailPage />, {
    auth: {
      role: "team_member",
      isAuthenticated: true,
      hasAppAccess: true,
      enforcementMode: "enforced",
    },
  });
}

describe("RecordGameDetailPage", () => {
  it("shows field recording context and a start action for ready games", async () => {
    setupHandlers(createGame("ready"));

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Monkey Stats vs Blue Tigers",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Field recording")).toBeInTheDocument();
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByRole("button", { name: /start game/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/live point tracking/i)).not.toBeInTheDocument();
  });

  it("renders the live tracker and field actions for started games", async () => {
    setupHandlers(createGame("started"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/live point tracking/i)).toBeInTheDocument();
    });
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(
      screen.getByText("No points yet. Start tracking points above.")
    ).toBeInTheDocument();
    const startPointButton = screen.getByRole("button", {
      name: /start point/i,
    });
    const rosterButton = screen.getByRole("button", { name: /game roster/i });
    expect(
      startPointButton.compareDocumentPosition(rosterButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /end game/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Game history")).toBeInTheDocument();
  });
});
