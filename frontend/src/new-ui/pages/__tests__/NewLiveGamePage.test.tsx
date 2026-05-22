import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, vi } from "vitest";

import { act, render, screen } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import type { GameLiveState, GameWithScore, PointWithPlayers } from "../../../types";
import NewLiveGamePage from "../NewLiveGamePage";

const BASE_URL = "http://localhost:8000";

function buildGame(overrides: Partial<GameWithScore> = {}): GameWithScore {
  return {
    id: 1,
    competition_id: 10,
    opponent_name: "Blue Tigers",
    date: "2026-05-22T10:00:00Z",
    comments: null,
    status: "started",
    start_datetime: "2026-05-22T10:00:00Z",
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: 3,
    opponent_score: 2,
    team_name: "Monkey Stats",
    competition_name: "Spring Cup",
    ...overrides,
  };
}

function buildPoint(
  overrides: Partial<PointWithPlayers> = {}
): PointWithPlayers {
  return {
    id: 20,
    game_id: 1,
    point_number: 8,
    starting_on_offense: false,
    field_side: null,
    pull: null,
    comments: null,
    won: null,
    status: "running",
    strategy_id: null,
    start_datetime: "2026-05-22T10:12:00Z",
    end_datetime: null,
    created_at: "2026-05-22T10:12:00Z",
    players: [],
    strategy: null,
    our_turnovers: 0,
    opponent_turnovers: 1,
    duration_seconds: null,
    ...overrides,
  };
}

function buildLiveState(
  overrides: Partial<GameLiveState> = {}
): GameLiveState {
  return {
    game_id: 1,
    status: "started",
    our_score: 8,
    opponent_score: 7,
    active_point: buildPoint(),
    active_point_turnovers: [],
    active_point_stoppages: [],
    ...overrides,
  };
}

function renderPage(route = "/live") {
  render(
    <Routes>
      <Route path="/live" element={<NewLiveGamePage />} />
      <Route path="/live/:gameId" element={<NewLiveGamePage />} />
    </Routes>,
    {
      route,
      auth: {
        role: "public",
        isAuthenticated: false,
        hasAppAccess: false,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("NewLiveGamePage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the first live game on the public spectator page", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          buildGame({
            id: 2,
            opponent_name: "Later Live",
            date: "2026-05-22T12:00:00Z",
          }),
          buildGame({
            id: 1,
            opponent_name: "Blue Tigers",
            date: "2026-05-22T09:00:00Z",
          }),
          buildGame({ id: 3, opponent_name: "Finished", status: "ended" }),
        ])
      ),
      http.get(`${BASE_URL}/games/1/live-state`, () =>
        HttpResponse.json(buildLiveState())
      )
    );

    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Live game" })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Blue Tigers" })).toBeInTheDocument();
    expect(screen.getByText("8 - 7")).toBeInTheDocument();
    expect(screen.getByText("Point 8")).toBeInTheDocument();
    expect(screen.getByText("Later Live")).toBeInTheDocument();
    expect(screen.queryByText("Finished")).not.toBeInTheDocument();
  });

  it("opens the requested live game from the route parameter", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([
          buildGame({ id: 1, opponent_name: "Blue Tigers" }),
          buildGame({ id: 2, opponent_name: "Red Hawks" }),
        ])
      ),
      http.get(`${BASE_URL}/games/2/live-state`, () =>
        HttpResponse.json(
          buildLiveState({
            game_id: 2,
            our_score: 11,
            opponent_score: 10,
            active_point: buildPoint({ game_id: 2, point_number: 22 }),
          })
        )
      )
    );

    renderPage("/live/2");

    expect(
      await screen.findByRole("heading", { name: "Red Hawks" })
    ).toBeInTheDocument();
    expect(screen.getByText("11 - 10")).toBeInTheDocument();
    expect(screen.getByText("Point 22")).toBeInTheDocument();
  });

  it("shows an empty state when there are no live games", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([buildGame({ status: "ended" })])
      )
    );

    renderPage();

    expect(
      await screen.findByText("Started games will appear here automatically.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("No games are live right now.")).toHaveLength(2);
  });

  it("polls the live games list while the spectator page is open", async () => {
    vi.useFakeTimers();
    const gamesRequest = vi.fn();

    server.use(
      http.get(`${BASE_URL}/games`, () => {
        gamesRequest();
        return HttpResponse.json([buildGame()]);
      }),
      http.get(`${BASE_URL}/games/1/live-state`, () =>
        HttpResponse.json(buildLiveState())
      )
    );

    renderPage();

    await act(async () => {
      await vi.waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Blue Tigers" })
        ).toBeInTheDocument();
      });
    });
    expect(gamesRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
      await vi.waitFor(() => {
        expect(gamesRequest).toHaveBeenCalledTimes(2);
      });
    });
  });

  it("does not render the live board when the selected game has ended", async () => {
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([buildGame({ id: 1, opponent_name: "Blue Tigers" })])
      ),
      http.get(`${BASE_URL}/games/1/live-state`, () =>
        HttpResponse.json(
          buildLiveState({
            status: "ended",
            active_point: null,
            active_point_turnovers: [],
            active_point_stoppages: [],
          })
        )
      )
    );

    renderPage("/live/1");

    expect(
      await screen.findByText("This game is not live right now.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Open the live games list to choose a currently running game.")
    ).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.queryByText("8 - 7")).not.toBeInTheDocument();
  });

  it("does not fall back to a different live game for a stale route link", async () => {
    const liveStateRequest = vi.fn();
    server.use(
      http.get(`${BASE_URL}/games`, () =>
        HttpResponse.json([buildGame({ id: 1, opponent_name: "Blue Tigers" })])
      ),
      http.get(`${BASE_URL}/games/1/live-state`, () => {
        liveStateRequest();
        return HttpResponse.json(buildLiveState());
      })
    );

    renderPage("/live/99");

    expect(
      await screen.findByText("This game is not live right now.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Open the live games list to choose a currently running game.")
    ).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.queryByText("8 - 7")).not.toBeInTheDocument();
    expect(liveStateRequest).not.toHaveBeenCalled();
  });
});
