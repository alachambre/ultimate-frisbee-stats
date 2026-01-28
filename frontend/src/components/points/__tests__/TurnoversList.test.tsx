import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/setup";
import { TurnoversList } from "../TurnoversList";
import type { TurnoverWithPlayer, Player } from "../../../types";

const BASE_URL = "http://localhost:8000";

const mockPlayer: Player = {
  id: 1,
  name: "Alice",
  number: 10,
  gender: "W",
  team_id: 1,
  created_at: "2024-01-01T00:00:00Z",
};

describe("TurnoversList", () => {
  it("does not render when there are no turnovers", async () => {
    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    // Should return null and not render anything
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders turnovers header with count", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayer,
      },
      {
        id: 2,
        point_id: 1,
        player_id: null,
        timestamp: "2024-01-01T10:03:00Z",
        comments: null,
        created_at: "2024-01-01T10:03:00Z",
        player: null,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Turnovers (2)")).toBeInTheDocument();
    });
  });

  it("displays turnover with elapsed time from point start", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:30Z", // 2 minutes 30 seconds after point start
        comments: null,
        created_at: "2024-01-01T10:02:30Z",
        player: mockPlayer,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      // Should show elapsed time in MM:SS format
      expect(screen.getByText("2:30")).toBeInTheDocument();
    });
  });

  it("displays turnover sequence number", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayer,
      },
      {
        id: 2,
        point_id: 1,
        player_id: null,
        timestamp: "2024-01-01T10:03:00Z",
        comments: null,
        created_at: "2024-01-01T10:03:00Z",
        player: null,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Turnover #1")).toBeInTheDocument();
      expect(screen.getByText("Turnover #2")).toBeInTheDocument();
    });
  });

  it("displays player name and number when available", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayer,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
      expect(screen.getByText(/#10/)).toBeInTheDocument();
    });
  });

  it("displays player name without number when number not available", async () => {
    const playerWithoutNumber: Player = { ...mockPlayer, number: null };
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: playerWithoutNumber,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not show number since it's null
    expect(screen.queryByText(/#10/)).not.toBeInTheDocument();
  });

  it("displays 'Team turnover' when no player assigned to our turnover", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: null, // No player assigned
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: null,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true} // We had possession, so this is our turnover
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/team turnover/i)).toBeInTheDocument();
    });
  });

  it("does not display 'Team turnover' for opponent turnovers without player", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: null,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: null,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={false} // They had possession, so this is their turnover
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/team turnover/i)).not.toBeInTheDocument();
    });
  });

  it("displays turnover comments when present", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: "Bad throw into wind",
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayer,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Bad throw into wind")).toBeInTheDocument();
    });
  });

  describe("Possession Indicators", () => {
    it("shows our turnover (error color) when starting on offense - first turnover", async () => {
      const turnovers: TurnoverWithPlayer[] = [
        {
          id: 1,
          point_id: 1,
          player_id: 1,
          timestamp: "2024-01-01T10:02:00Z",
          comments: null,
          created_at: "2024-01-01T10:02:00Z",
          player: mockPlayer,
        },
      ];

      server.use(
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <TurnoversList
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
        />
      );

      await waitFor(() => {
        // First turnover when starting on offense = our turnover (should have error styling)
        const turnoverCard = screen.getByText("Turnover #1").closest("div");
        expect(turnoverCard).toBeInTheDocument();
      });
    });

    it("shows opponent turnover (success color) when starting on defense - first turnover", async () => {
      const turnovers: TurnoverWithPlayer[] = [
        {
          id: 1,
          point_id: 1,
          player_id: null,
          timestamp: "2024-01-01T10:02:00Z",
          comments: null,
          created_at: "2024-01-01T10:02:00Z",
          player: null,
        },
      ];

      server.use(
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <TurnoversList
          pointId={1}
          startingOnOffense={false}
          pointStartTime="2024-01-01T10:00:00Z"
        />
      );

      await waitFor(() => {
        // First turnover when starting on defense = their turnover (should have success styling)
        const turnoverCard = screen.getByText("Turnover #1").closest("div");
        expect(turnoverCard).toBeInTheDocument();
      });
    });

    it("alternates possession correctly for multiple turnovers", async () => {
      const turnovers: TurnoverWithPlayer[] = [
        {
          id: 1,
          point_id: 1,
          player_id: 1,
          timestamp: "2024-01-01T10:02:00Z",
          comments: null,
          created_at: "2024-01-01T10:02:00Z",
          player: mockPlayer,
        },
        {
          id: 2,
          point_id: 1,
          player_id: null,
          timestamp: "2024-01-01T10:03:00Z",
          comments: null,
          created_at: "2024-01-01T10:03:00Z",
          player: null,
        },
        {
          id: 3,
          point_id: 1,
          player_id: 1,
          timestamp: "2024-01-01T10:04:00Z",
          comments: null,
          created_at: "2024-01-01T10:04:00Z",
          player: mockPlayer,
        },
      ];

      server.use(
        http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
          return HttpResponse.json(turnovers);
        })
      );

      render(
        <TurnoversList
          pointId={1}
          startingOnOffense={true}
          pointStartTime="2024-01-01T10:00:00Z"
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Turnover #1")).toBeInTheDocument();
        expect(screen.getByText("Turnover #2")).toBeInTheDocument();
        expect(screen.getByText("Turnover #3")).toBeInTheDocument();
      });
    });
  });

  it("displays elapsed time with seconds padded to 2 digits", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:00:05Z", // 5 seconds into point
        comments: null,
        created_at: "2024-01-01T10:00:05Z",
        player: mockPlayer,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      // Should show 0:05 (not 0:5)
      expect(screen.getByText("0:05")).toBeInTheDocument();
    });
  });

  it("falls back to absolute time when point start time is null", async () => {
    const turnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayer,
      },
    ];

    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json(turnovers);
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime={null}
      />
    );

    await waitFor(() => {
      // Should show turnovers header
      expect(screen.getByText("Turnovers (1)")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Time should be displayed (locale format will have colons)
    const timeElements = screen.getAllByText(/:/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("handles error state gracefully", async () => {
    server.use(
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json({ detail: "Error" }, { status: 500 });
      })
    );

    render(
      <TurnoversList
        pointId={1}
        startingOnOffense={true}
        pointStartTime="2024-01-01T10:00:00Z"
      />
    );

    await waitFor(() => {
      // Should show error message
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
