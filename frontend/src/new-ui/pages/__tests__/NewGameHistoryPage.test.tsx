import { Route, Routes } from "react-router-dom";
import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test/test-utils";
import { server } from "../../../test/setup";
import type { CompetitionWithPlayers, GameDetail, Player } from "../../../types";
import NewGameHistoryPage from "../NewGameHistoryPage";

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

const game: GameDetail = {
  id: 1,
  competition_id: competition.id,
  opponent_name: "Blue Tigers",
  date: "2026-05-22T10:00:00Z",
  comments: null,
  status: "ended",
  start_datetime: "2026-05-22T10:05:00Z",
  end_datetime: "2026-05-22T11:10:00Z",
  created_at: "2026-05-01T00:00:00Z",
  our_score: 3,
  opponent_score: 2,
  team_name: "Monkey",
  competition_name: competition.name,
  halftime: {
    id: 1,
    game_id: 1,
    halftime_timestamp: "2026-05-22T10:35:00Z",
    comments: "Short break",
    created_at: "2026-05-22T10:35:00Z",
  },
  players,
  points: [
    {
      id: 1,
      game_id: 1,
      point_number: 1,
      status: "completed",
      starting_on_offense: false,
      field_side: null,
      pull: true,
      won: true,
      strategy_id: 1,
      strategy: {
        id: 1,
        name: "Zone defense",
        category: "defense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: null,
      start_datetime: "2026-05-22T10:05:00Z",
      end_datetime: "2026-05-22T10:08:00Z",
      duration_seconds: 180,
      created_at: "2026-05-22T10:05:00Z",
      players,
      our_turnovers: 0,
      opponent_turnovers: 1,
    },
    {
      id: 2,
      game_id: 1,
      point_number: 2,
      status: "completed",
      starting_on_offense: true,
      field_side: null,
      pull: null,
      won: false,
      strategy_id: 2,
      strategy: {
        id: 2,
        name: "Vertical stack",
        category: "offense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: "Force middle if they swing.",
      start_datetime: "2026-05-22T10:10:00Z",
      end_datetime: "2026-05-22T10:12:30Z",
      duration_seconds: 150,
      created_at: "2026-05-22T10:10:00Z",
      players,
      our_turnovers: 5,
      opponent_turnovers: 0,
    },
    {
      id: 3,
      game_id: 1,
      point_number: 3,
      status: "running",
      starting_on_offense: false,
      field_side: null,
      pull: true,
      won: null,
      strategy_id: 1,
      strategy: {
        id: 1,
        name: "Zone defense",
        category: "defense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: null,
      start_datetime: "2026-05-22T10:09:00Z",
      end_datetime: null,
      duration_seconds: 45,
      created_at: "2026-05-22T10:09:00Z",
      players,
      our_turnovers: 3,
      opponent_turnovers: 0,
    },
    {
      id: 4,
      game_id: 1,
      point_number: 4,
      status: "completed",
      starting_on_offense: true,
      field_side: null,
      pull: null,
      won: true,
      strategy_id: 2,
      strategy: {
        id: 2,
        name: "Vertical stack",
        category: "offense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: null,
      start_datetime: "2026-05-22T10:13:00Z",
      end_datetime: "2026-05-22T10:14:00Z",
      duration_seconds: 60,
      created_at: "2026-05-22T10:13:00Z",
      players,
      our_turnovers: 1,
      opponent_turnovers: 0,
    },
    {
      id: 5,
      game_id: 1,
      point_number: 5,
      status: "completed",
      starting_on_offense: true,
      field_side: null,
      pull: null,
      won: true,
      strategy_id: 2,
      strategy: {
        id: 2,
        name: "Vertical stack",
        category: "offense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: null,
      start_datetime: "2026-05-22T10:15:00Z",
      end_datetime: "2026-05-22T10:15:45Z",
      duration_seconds: 45,
      created_at: "2026-05-22T10:15:00Z",
      players,
      our_turnovers: 0,
      opponent_turnovers: 0,
    },
    {
      id: 6,
      game_id: 1,
      point_number: 6,
      status: "completed",
      starting_on_offense: false,
      field_side: null,
      pull: true,
      won: false,
      strategy_id: 1,
      strategy: {
        id: 1,
        name: "Zone defense",
        category: "defense",
        description: null,
        created_at: "2026-05-01T00:00:00Z",
      },
      comments: null,
      start_datetime: "2026-05-22T10:16:00Z",
      end_datetime: "2026-05-22T10:16:50Z",
      duration_seconds: 50,
      created_at: "2026-05-22T10:16:00Z",
      players,
      our_turnovers: 1,
      opponent_turnovers: 0,
    },
  ],
};

function setupHandlers(gameResponse: GameDetail = game) {
  server.use(
    http.get(`${BASE_URL}/games/1`, () => HttpResponse.json(gameResponse)),
    http.get(`${BASE_URL}/games/1/turnovers`, () =>
      HttpResponse.json([
        {
          id: 20,
          point_id: 2,
          player_id: null,
          turnover_type: "drop",
          timestamp: "2026-05-22T10:11:00Z",
          comments: "Team turnover",
          created_at: "2026-05-22T10:11:00Z",
          player: null,
        },
        {
          id: 21,
          point_id: 6,
          player_id: null,
          turnover_type: "drop",
          timestamp: "2026-05-22T10:16:20Z",
          comments: "Opponent mistake",
          created_at: "2026-05-22T10:16:20Z",
          player: null,
        },
        {
          id: 22,
          point_id: 6,
          player_id: null,
          turnover_type: "throwaway",
          timestamp: "2026-05-22T10:16:25Z",
          comments: "Late turnover",
          created_at: "2026-05-22T10:16:25Z",
          player: null,
        },
      ]),
    ),
    http.get(`${BASE_URL}/competitions/10`, () =>
      HttpResponse.json(competition),
    ),
    http.get(`${BASE_URL}/stoppages/points/2/stoppages`, () =>
      HttpResponse.json([
        {
          id: 30,
          point_id: 2,
          stoppage_type: "call",
          call_timestamp: "2026-05-22T10:11:30Z",
          resume_timestamp: "2026-05-22T10:11:45Z",
          comments: "Foul",
          created_at: "2026-05-22T10:11:30Z",
        },
      ]),
    ),
    http.get(`${BASE_URL}/stoppages/points/6/stoppages`, () =>
      HttpResponse.json([
        {
          id: 31,
          point_id: 6,
          stoppage_type: "call",
          call_timestamp: "2026-05-22T10:16:30Z",
          resume_timestamp: "2026-05-22T10:16:45Z",
          comments: "Foul",
          created_at: "2026-05-22T10:16:30Z",
        },
      ]),
    ),
  );
}

function renderPage(route = "/games/1") {
  return render(
    <Routes>
      <Route path="/games/:gameId" element={<NewGameHistoryPage />} />
    </Routes>,
    {
      route,
      auth: {
        role: "public",
        isAuthenticated: false,
        hasAppAccess: false,
        enforcementMode: "enforced",
      },
    },
  );
}

describe("NewGameHistoryPage", () => {
  it("renders a read-only game history with point details and chronology", async () => {
    setupHandlers();

    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Game history" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^All games$/i })).toHaveAttribute(
      "href",
      "/games",
    );
    expect(screen.queryByText("Game review")).not.toBeInTheDocument();
    expect(screen.getByText("Monkey")).toBeInTheDocument();
    expect(screen.getByText("Blue Tigers")).toBeInTheDocument();
    expect(screen.getByText("Monkey won")).toBeInTheDocument();
    expect(screen.getByText("Spring Cup")).toBeInTheDocument();
    expect(screen.getAllByText("1 - 1").length).toBeGreaterThan(0);
    expect(screen.queryByText("Score after point")).not.toBeInTheDocument();
    expect(screen.getByText("6 points")).toBeInTheDocument();
    expect(screen.getByText("1 break")).toBeInTheDocument();
    expect(screen.getByText("1 broken")).toBeInTheDocument();
    expect(await screen.findByText("Game trends")).toBeInTheDocument();
    expect(screen.getByText("Score progression")).toBeInTheDocument();
    expect(screen.getByText("Break point")).toBeInTheDocument();
    expect(screen.getByText("Broken point")).toBeInTheDocument();
    expect(screen.getByTestId("chartjs-line")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Point 2" })).toBeInTheDocument();
    expect(screen.getAllByText("2:30").length).toBeGreaterThan(0);
    expect(screen.getByText("5 turns")).toBeInTheDocument();
    expect(screen.getByText("3 turns")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Hold")).toBeInTheDocument();
    expect(screen.getByText("Clean hold")).toBeInTheDocument();
    expect(screen.getByText("Lost")).toBeInTheDocument();
    expect(screen.getByText("Broken")).toBeInTheDocument();
    expect(screen.getByText("Break")).toBeInTheDocument();
    expect(screen.queryByText("Won")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
    expect(screen.queryByText("Our turns")).not.toBeInTheDocument();
    expect(screen.queryByText("Opponent turns")).not.toBeInTheDocument();
    expect(screen.queryByText("Stoppages")).not.toBeInTheDocument();
    expect(screen.getByText("Force middle if they swing.")).toBeInTheDocument();
    expect(screen.getAllByText("Players on field").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Men").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("Started on offense").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Point start - in offense - Vertical stack").length,
    ).toBeGreaterThan(0);
    expect(await screen.findByText("Call")).toBeInTheDocument();
    expect((await screen.findAllByText("Turnover")).length).toBeGreaterThan(0);
    expect(screen.queryByText("Our turnover")).not.toBeInTheDocument();
    expect(screen.getByText("Short break")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
  });

  it("returns to live tracking when opened from the live page", async () => {
    setupHandlers();

    renderPage("/games/1?from=live");

    expect(
      await screen.findByRole("link", { name: /^Live game$/i }),
    ).toHaveAttribute("href", "/live/1");
  });

  it("summarizes a running game for spectator history", async () => {
    setupHandlers({
      ...game,
      our_score: 3,
      opponent_score: 3,
      status: "started",
    });

    renderPage();

    expect(await screen.findByText("Point 3 running")).toBeInTheDocument();
    expect(screen.getByText("Game tied")).toBeInTheDocument();
    expect(screen.getByText("Current: defense")).toBeInTheDocument();
  });

  it("closes the previously expanded point when another point is opened", async () => {
    setupHandlers();
    const user = userEvent.setup();

    renderPage();

    const point6Summary = await screen.findByRole("button", {
      name: /Point 6/i,
    });
    const point5Summary = screen.getByRole("button", { name: /Point 5/i });

    expect(point6Summary).toHaveAttribute("aria-expanded", "true");
    expect(point5Summary).toHaveAttribute("aria-expanded", "false");

    await user.click(point5Summary);

    expect(point6Summary).toHaveAttribute("aria-expanded", "false");
    expect(point5Summary).toHaveAttribute("aria-expanded", "true");
  });
});
