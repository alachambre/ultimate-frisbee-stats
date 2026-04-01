import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/setup";
import LivePointTracker from "../LivePointTracker";
import type { GameDetail, Player, PointWithPlayers, Stoppage, Halftime } from "../../../types";

const BASE_URL = "http://localhost:8000";

const mockPlayers: Player[] = [
  { id: 1, name: "Alice", number: 10, gender: "W", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 2, name: "Bob", number: 20, gender: "M", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 3, name: "Charlie", number: 30, gender: "M", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 4, name: "Diana", number: 40, gender: "W", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 5, name: "Eve", number: 50, gender: "W", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 6, name: "Frank", number: 60, gender: "M", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 7, name: "Grace", number: 70, gender: "W", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
];

const createMockGame = (
  status: "ready" | "started" | "ended" = "started",
  halftime: Halftime | null = null,
  points: PointWithPlayers[] = []
): GameDetail => ({
  id: 1,
  competition_id: 1,
  opponent_name: "Test Opponents",
  status,
  date: null,
  comments: null,
  start_datetime: status === "started" ? "2024-01-01T10:00:00Z" : null,
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  our_score: 0,
  opponent_score: 0,
  team_name: "Test Team",
  competition_name: "Test Competition",
  points,
  players: mockPlayers,
  halftime,
});

const createMockPoint = ({
  id,
  pointNumber,
  status = "running",
  players = mockPlayers,
}: {
  id: number;
  pointNumber: number;
  status?: "ready" | "running" | "scored" | "completed";
  players?: Player[];
}): PointWithPlayers => ({
  id,
  game_id: 1,
  point_number: pointNumber,
  starting_on_offense: true,
  won: null,
  field_side: null,
  pull: true,
  strategy_id: null,
  comments: null,
  start_datetime: status === "ready" ? null : "2024-01-01T10:05:00Z",
  end_datetime: status === "scored" || status === "completed" ? "2024-01-01T10:15:00Z" : null,
  status,
  created_at: "2024-01-01T10:05:00Z",
  players,
  strategy: null,
  duration_seconds: null,
});

const createMockRunningPoint = () => createMockPoint({ id: 1, pointNumber: 1, status: "running" });

describe("LivePointTracker - Pending Stoppage Feature", () => {
  beforeEach(() => {
    // Reset any runtime request handlers we add during tests
    server.resetHandlers();
  });

  describe("Finish Point Button - Pending Stoppage Validation", () => {
    it("enables finish button when there are no calls", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      // Mock empty calls array
      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      // Wait for the component to load and queries to complete
      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish point/i });
        expect(finishButton).toBeInTheDocument();
        expect(finishButton).not.toBeDisabled();
      });
    });

    it("enables finish button when all calls are resolved", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      // Mock calls with all having resume_timestamp (resolved)
      const resolvedCalls: Stoppage[] = [
        {
          id: 1,
          point_id: 1,
          call_timestamp: "2024-01-01T10:06:00Z",
          resume_timestamp: "2024-01-01T10:07:00Z", // Resolved
          comments: "Test call 1",
          created_at: "2024-01-01T10:06:00Z",
        },
        {
          id: 2,
          point_id: 1,
          call_timestamp: "2024-01-01T10:08:00Z",
          resume_timestamp: "2024-01-01T10:09:00Z", // Resolved
          comments: "Test call 2",
          created_at: "2024-01-01T10:08:00Z",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json(resolvedCalls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish point/i });
        expect(finishButton).toBeInTheDocument();
        expect(finishButton).not.toBeDisabled();
      });
    });

    it("hides finish button and shows resume button when there is one pending call", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      // Mock calls with one pending (null resume_timestamp)
      const callsWithPending: Stoppage[] = [
        {
          id: 1,
          point_id: 1,
          call_timestamp: "2024-01-01T10:06:00Z",
          resume_timestamp: null, // Pending!
          comments: "Pending call",
          created_at: "2024-01-01T10:06:00Z",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json(callsWithPending);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        // Finish button should not be present when there's a pending call
        expect(screen.queryByRole("button", { name: /finish point/i })).not.toBeInTheDocument();
        // Resume button should be present instead
        expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
      });
    });

    it("hides finish button and shows resume button when there are multiple pending calls", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      // Mock calls with multiple pending
      const callsWithPending: Stoppage[] = [
        {
          id: 1,
          point_id: 1,
          call_timestamp: "2024-01-01T10:06:00Z",
          resume_timestamp: null, // Pending
          comments: "Pending call 1",
          created_at: "2024-01-01T10:06:00Z",
        },
        {
          id: 2,
          point_id: 1,
          call_timestamp: "2024-01-01T10:08:00Z",
          resume_timestamp: null, // Pending
          comments: "Pending call 2",
          created_at: "2024-01-01T10:08:00Z",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json(callsWithPending);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        // Finish button should not be present when there are pending calls
        expect(screen.queryByRole("button", { name: /finish point/i })).not.toBeInTheDocument();
        // Resume button should be present instead
        expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
      });
    });

    it("hides finish button when there is a mix of resolved and pending calls", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      // Mock calls with mix of resolved and pending
      const mixedCalls: Stoppage[] = [
        {
          id: 1,
          point_id: 1,
          call_timestamp: "2024-01-01T10:06:00Z",
          resume_timestamp: "2024-01-01T10:07:00Z", // Resolved
          comments: "Resolved call",
          created_at: "2024-01-01T10:06:00Z",
        },
        {
          id: 2,
          point_id: 1,
          call_timestamp: "2024-01-01T10:08:00Z",
          resume_timestamp: null, // Pending - this should hide the finish button
          comments: "Pending call",
          created_at: "2024-01-01T10:08:00Z",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json(mixedCalls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        // Finish button should not be present even with resolved calls if there's any pending
        expect(screen.queryByRole("button", { name: /finish point/i })).not.toBeInTheDocument();
        // Resume button should be present instead
        expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
      });
    });

    it("shows resume button instead of finish button when there is a pending call", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      const callsWithPending: Stoppage[] = [
        {
          id: 1,
          point_id: 1,
          call_timestamp: "2024-01-01T10:06:00Z",
          resume_timestamp: null, // Pending
          comments: "Pending call",
          created_at: "2024-01-01T10:06:00Z",
        },
      ];

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json(callsWithPending);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        // Finish button should not be present
        expect(screen.queryByRole("button", { name: /finish point/i })).not.toBeInTheDocument();
        // Resume button should be present instead
        const resumeButton = screen.getByRole("button", { name: /resume/i });
        expect(resumeButton).toBeInTheDocument();
      });
    });

    it("shows finish button when there are no pending calls", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        const finishButton = screen.getByRole("button", { name: /finish point/i });
        expect(finishButton).toBeInTheDocument();
        expect(finishButton).not.toBeDisabled();
      });
    });
  });

  describe("LivePointTracker - Basic Rendering", () => {
    it("does not render when game is not started", () => {
      const game = createMockGame("ready");

      const { container } = render(
        <LivePointTracker
          game={game}
          activePoint={null}
          players={mockPlayers}
          teamId={1}
        />
      );

      // Component should return null for non-started games
      expect(container.firstChild).toBeNull();
    });

    it("renders start point button when no active point", async () => {
      const game = createMockGame();

      render(
        <LivePointTracker
          game={game}
          activePoint={null}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /start point/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /half time/i })).toBeInTheDocument();
      });
    });

    it("shows only the mixity badge when it can be inferred before a new point starts", async () => {
      const previousPoint = createMockPoint({
        id: 1,
        pointNumber: 1,
        status: "completed",
      });
      const game = createMockGame("started", null, [previousPoint]);

      render(
        <LivePointTracker
          game={game}
          activePoint={null}
          players={mockPlayers}
          teamId={1}
        />
      );

      expect(await screen.findByText("Men")).toBeInTheDocument();
      expect(screen.queryByText(/mixity/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/4M \+ 3W/i)).not.toBeInTheDocument();
    });

    it("disables half time button when halftime already exists", async () => {
      const game = createMockGame("started", {
        id: 1,
        game_id: 1,
        halftime_timestamp: "2024-01-01T11:00:00Z",
        comments: null,
        created_at: "2024-01-01T11:00:00Z",
      });

      render(
        <LivePointTracker
          game={game}
          activePoint={null}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /half time/i })).toBeDisabled();
      });
    });

    it("opens half time confirmation dialog", async () => {
      const user = userEvent.setup();
      const game = createMockGame();

      render(
        <LivePointTracker
          game={game}
          activePoint={null}
          players={mockPlayers}
          teamId={1}
        />
      );

      const halfTimeButton = await screen.findByRole("button", { name: /half time/i });
      await user.click(halfTimeButton);

      expect(screen.getByText(/record half time\?/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    });

    it("renders finish point button when point is running", async () => {
      const game = createMockGame();
      const activePoint = createMockRunningPoint();

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /finish point/i })).toBeInTheDocument();
      });
    });

    it("shows the mixity badge next to the offense or defense badge for a ready point", async () => {
      const previousPoint = createMockPoint({
        id: 1,
        pointNumber: 1,
        status: "completed",
      });
      const activePoint = createMockPoint({
        id: 2,
        pointNumber: 2,
        status: "ready",
      });
      const game = createMockGame("started", null, [previousPoint, activePoint]);

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      expect(await screen.findByText("Men")).toBeInTheDocument();
      expect(screen.queryByText(/mixity/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/4M \+ 3W/i)).not.toBeInTheDocument();
    });

    it("shows the mixity badge next to the offense or defense badge while a point is ongoing", async () => {
      const previousPoint = createMockPoint({
        id: 1,
        pointNumber: 1,
        status: "scored",
      });
      const activePoint = createMockPoint({
        id: 2,
        pointNumber: 2,
        status: "running",
      });
      const game = createMockGame("started", null, [previousPoint, activePoint]);

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      expect(await screen.findByText("Men")).toBeInTheDocument();
      expect(screen.queryByText(/mixity/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/4M \+ 3W/i)).not.toBeInTheDocument();
    });

    it("displays field side in chronology when field side is set", async () => {
      const game = createMockGame();
      const activePoint = {
        ...createMockRunningPoint(),
        field_side: "table_left" as const,
      };

      server.use(
        http.get(`${BASE_URL}/stoppages/points/:pointId/stoppages`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <LivePointTracker
          game={game}
          activePoint={activePoint}
          players={mockPlayers}
          teamId={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/point start in offense - left side/i)).toBeInTheDocument();
      });
    });

  });
});
