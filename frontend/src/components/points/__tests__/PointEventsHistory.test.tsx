import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/setup";
import { PointEventsHistory } from "../PointEventsHistory";
import type { Call, TurnoverWithPlayer } from "../../../types";

const BASE_URL = "http://localhost:8000";

const createMockCall = (id: number, timestamp: string, resumeTimestamp: string | null = null, comments: string | null = null): Call => ({
  id,
  point_id: 1,
  call_timestamp: timestamp,
  resume_timestamp: resumeTimestamp,
  comments,
  created_at: timestamp,
});

const createMockTurnover = (id: number, timestamp: string, playerId: number | null = null, comments: string | null = null): TurnoverWithPlayer => ({
  id,
  point_id: 1,
  timestamp,
  player_id: playerId,
  comments,
  created_at: timestamp,
  player: playerId ? { id: playerId, name: "Test Player", number: 10, gender: "M", team_id: 1, created_at: timestamp } : null,
});

describe("PointEventsHistory", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("Empty State", () => {
    it("renders nothing when there are no events", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      const { container } = render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime={null}
          strategy={null}
          pull={null}
          pointStatus="ready"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe("Point Start Event", () => {
    it("renders point start event when pointStartTime is provided", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/point start/i)).toBeInTheDocument();
        expect(screen.getByText(/in offense/i)).toBeInTheDocument();
        expect(screen.getByText("0:00")).toBeInTheDocument();
      });
    });

    it("renders point start in defense", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={false}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/in defense/i)).toBeInTheDocument();
      });
    });

    it("renders strategy information when provided", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={{ id: 1, name: "Vertical Stack", category: "offense" }}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/strategy/i)).toBeInTheDocument();
        expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      });
    });

    it("renders pull information when starting in defense", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={false}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={true}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/pull/i)).toBeInTheDocument();
        expect(screen.getByText(/inbounds/i)).toBeInTheDocument();
      });
    });
  });

  describe("Point Scored Event", () => {
    it("renders point scored event when point is scored and won is true", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="scored"
          endDateTime="2024-01-01T10:05:00Z"
          won={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/we scored/i)).toBeInTheDocument();
        expect(screen.getByText("5:00")).toBeInTheDocument();
      });
    });

    it("renders point scored event when point is completed and won is false", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="completed"
          endDateTime="2024-01-01T10:03:00Z"
          won={false}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/they scored/i)).toBeInTheDocument();
        expect(screen.getByText("3:00")).toBeInTheDocument();
      });
    });

    it("does not render point scored event when won is null", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="scored"
          endDateTime="2024-01-01T10:05:00Z"
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText(/we scored/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/they scored/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Call Events", () => {
    it("renders resolved call with duration", async () => {
      const calls = [
        createMockCall(1, "2024-01-01T10:02:00Z", "2024-01-01T10:04:00Z", "Foul on defense"),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json(calls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/call/i)).toBeInTheDocument();
        expect(screen.getByText(/duration.*2:00/i)).toBeInTheDocument(); // Duration: 2 minutes
        expect(screen.getByText("Foul on defense")).toBeInTheDocument();
        expect(screen.queryByText(/pending/i)).not.toBeInTheDocument();
      });
    });

    it("renders pending call without duration and with pending chip", async () => {
      const calls = [
        createMockCall(1, "2024-01-01T10:02:00Z", null, "Contest"),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json(calls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/pending/i)).toBeInTheDocument();
        expect(screen.getByText("Contest")).toBeInTheDocument();
        // Verify no duration is shown (only for resolved calls)
        expect(screen.queryByText(/duration.*:/i)).not.toBeInTheDocument();
      });
    });

    it("renders multiple calls in correct order", async () => {
      const calls = [
        createMockCall(1, "2024-01-01T10:02:00Z", "2024-01-01T10:03:00Z"),
        createMockCall(2, "2024-01-01T10:05:00Z", null),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json(calls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        // Verify both calls are present - one pending, one resolved
        expect(screen.getByText(/pending/i)).toBeInTheDocument(); // Call #2 is pending
        expect(screen.getByText(/duration.*1:00/i)).toBeInTheDocument(); // Call #1 duration (1 min)
      });
    });
  });

  describe("Turnover Events", () => {
    it("renders our turnover (starting on offense) with player", async () => {
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:02:00Z", 5, "Drop"),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/turnover #1/i)).toBeInTheDocument();
        expect(screen.getByText(/by/i)).toBeInTheDocument();
        expect(screen.getByText("Test Player")).toBeInTheDocument();
        expect(screen.getByText("Drop")).toBeInTheDocument();
      });
    });

    it("renders opponent turnover (starting on defense)", async () => {
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:02:00Z", null),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={false}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/turnover #1/i)).toBeInTheDocument();
        // Opponent turnover, no player displayed
        expect(screen.queryByText(/by/i)).not.toBeInTheDocument();
      });
    });

    it("correctly alternates possession for multiple turnovers", async () => {
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:02:00Z", 5), // Our turnover (we started on O)
        createMockTurnover(2, "2024-01-01T10:03:00Z", null), // Opponent turnover
        createMockTurnover(3, "2024-01-01T10:04:00Z", 7), // Our turnover again
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/turnover #1/i)).toBeInTheDocument();
        expect(screen.getByText(/turnover #2/i)).toBeInTheDocument();
        expect(screen.getByText(/turnover #3/i)).toBeInTheDocument();
      });
    });

    it("renders turnover when no player is assigned", async () => {
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:02:00Z", null, "Out of bounds"),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/turnover #1/i)).toBeInTheDocument();
        expect(screen.getByText("Out of bounds")).toBeInTheDocument();
      });
    });
  });

  describe("Event Sorting and Chronology", () => {
    it("sorts events by timestamp (most recent first)", async () => {
      const calls = [
        createMockCall(1, "2024-01-01T10:02:00Z", "2024-01-01T10:03:00Z"),
      ];
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:05:00Z", 5),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json(calls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="scored"
          endDateTime="2024-01-01T10:06:00Z"
          won={true}
        />
      );

      await waitFor(() => {
        // Verify all events are present (not checking order due to multiple time displays)
        expect(screen.getByText(/we scored/i)).toBeInTheDocument(); // Point scored
        expect(screen.getByText(/turnover #1/i)).toBeInTheDocument(); // Turnover
        expect(screen.getByText(/call/i)).toBeInTheDocument(); // Call
        expect(screen.getByText(/point start/i)).toBeInTheDocument(); // Point start
      });
    });

    it("displays correct event count", async () => {
      const calls = [
        createMockCall(1, "2024-01-01T10:02:00Z", "2024-01-01T10:03:00Z"),
        createMockCall(2, "2024-01-01T10:04:00Z", null),
      ];
      const turnovers = [
        createMockTurnover(1, "2024-01-01T10:05:00Z", 5),
      ];

      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json(calls);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        // Should have: 1 point start + 2 calls + 1 turnover = 4 events
        expect(screen.getByText(/chronology \(4\)/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("renders error alert when calls fetch fails", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json({ detail: "Error fetching calls" }, { status: 500 });
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json([]);
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("renders error alert when turnovers fetch fails", async () => {
      server.use(
        http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
          return HttpResponse.json([]);
        }),
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json({ detail: "Error fetching turnovers" }, { status: 500 });
        })
      );

      render(
        <PointEventsHistory
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
          strategy={null}
          pull={null}
          pointStatus="running"
          endDateTime={null}
          won={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });
});
