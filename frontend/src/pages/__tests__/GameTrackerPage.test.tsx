import { Route, Routes } from "react-router-dom";
import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../test/test-utils";
import { server } from "../../test/setup";
import type {
  CompetitionWithPlayers,
  GameDetail,
  GameLiveState,
  Player,
} from "../../types";
import GameTrackerPage from "../GameTrackerPage";

const BASE_URL = "http://localhost:8000";

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

function createGame(status: GameDetail["status"] = "started"): GameDetail {
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
    team_name: "Monkey",
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
      HttpResponse.json(liveState),
    ),
    http.get(`${BASE_URL}/games/1/turnovers`, () => HttpResponse.json([])),
    http.get(`${BASE_URL}/competitions/10`, () =>
      HttpResponse.json(competition),
    ),
    http.get(`${BASE_URL}/statistics/games/1/live`, () =>
      HttpResponse.json([]),
    ),
  );
}

function renderPage({ role }: { role: "public" | "team_member" }) {
  return render(
    <Routes>
      <Route path="/live/:gameId" element={<GameTrackerPage />} />
      <Route path="/games" element={<h1>All games</h1>} />
    </Routes>,
    {
      route: "/live/1",
      auth: {
        role,
        isAuthenticated: role !== "public",
        hasAppAccess: role !== "public",
        enforcementMode: "enforced",
      },
    },
  );
}

describe("GameTrackerPage", () => {
  it("shows public live score without recording controls", async () => {
    setupHandlers(createGame("started"));

    renderPage({ role: "public" });

    expect(
      await screen.findByRole("heading", { name: "Monkey vs Blue Tigers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 - 4")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^No active point$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Start Point$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^New point$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Complete$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete game against Blue Tigers" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^History$/i })).toHaveAttribute(
      "href",
      "/games/1?from=live",
    );
  });

  it("shows team game actions and the shared tracker", async () => {
    setupHandlers(createGame("started"));

    renderPage({ role: "team_member" });

    expect(
      await screen.findByRole("heading", { name: "Monkey vs Blue Tigers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Roster$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^History$/i })).toHaveAttribute(
      "href",
      "/games/1?from=live",
    );
    expect(screen.getByRole("link", { name: /^Stats$/i })).toHaveAttribute(
      "href",
      "/statistics?teamId=1&gameIds=1",
    );
    expect(screen.getByRole("button", { name: /^Edit$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Complete$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^No active point$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^New point$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Game history/i)).not.toBeInTheDocument();
  });

  it("deletes an editable live game from the tracker header", async () => {
    const user = userEvent.setup();
    setupHandlers(createGame("started"));
    server.use(
      http.delete(`${BASE_URL}/games/1`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );

    renderPage({ role: "team_member" });

    await user.click(
      await screen.findByRole("button", {
        name: "Delete game against Blue Tigers",
      }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete game?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Delete$/i }));

    expect(
      await screen.findByRole("heading", { name: "All games" }),
    ).toBeInTheDocument();
  });

  it("lets team members enter a ready game before it starts", async () => {
    setupHandlers(createGame("ready"));

    renderPage({ role: "team_member" });

    expect(
      await screen.findByRole("heading", { name: "Monkey vs Blue Tigers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Start Game$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^No active point$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^New point$/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps game trends out of the field tracking screen", async () => {
    setupHandlers(createGame("started"));

    renderPage({ role: "public" });

    expect(
      await screen.findByRole("heading", { name: /^No active point$/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Game trends")).not.toBeInTheDocument();
    expect(screen.queryByText("Score progression")).not.toBeInTheDocument();
  });
});
