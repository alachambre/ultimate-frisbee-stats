import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/setup";
import { CallsList } from "../CallsList";
import type { Call } from "../../../types";

const BASE_URL = "http://localhost:8000";

const mockCalls: Call[] = [
  {
    id: 1,
    point_id: 1,
    call_timestamp: "2024-01-01T10:02:30Z", // 2:30 into point
    resume_timestamp: "2024-01-01T10:03:00Z", // Resolved after 30 seconds
    comments: "Travel call",
    created_at: "2024-01-01T10:02:30Z",
  },
  {
    id: 2,
    point_id: 1,
    call_timestamp: "2024-01-01T10:05:15Z", // 5:15 into point
    resume_timestamp: null, // Pending
    comments: "Pick call",
    created_at: "2024-01-01T10:05:15Z",
  },
];

describe("CallsList", () => {
  it("does not render when there are no calls", async () => {
    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json([]);
      })
    );

    const { container } = render(
      <CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />
    );

    // Should return null and not render anything
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders calls header with count", async () => {
    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(mockCalls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      expect(screen.getByText("Calls (2)")).toBeInTheDocument();
    });
  });

  it("displays call with elapsed time from point start", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:30Z", // 2 minutes 30 seconds after point start
        resume_timestamp: "2024-01-01T10:03:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:30Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show elapsed time in MM:SS format
      expect(screen.getByText("2:30")).toBeInTheDocument();
    });
  });

  it("displays resolved call with duration", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: "2024-01-01T10:03:00Z", // 1 minute duration
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show duration label
      expect(screen.getByText(/duration/i)).toBeInTheDocument();
      // Should show 1:00 duration
      expect(screen.getByText(/1:00/)).toBeInTheDocument();
    });
  });

  it("displays pending call with pending badge", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: null, // Pending
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("displays call comments when present", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: "2024-01-01T10:03:00Z",
        comments: "Travel on player 23",
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      expect(screen.getByText("Travel on player 23")).toBeInTheDocument();
    });
  });

  it("does not display comments when not present", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: "2024-01-01T10:03:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show the calls header
      expect(screen.getByText("Calls (1)")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Comments section should not appear (no extra text in card)
    const commentsSections = screen.queryAllByText(/travel|pick|foul/i);
    expect(commentsSections.length).toBe(0);
  });

  it("shows resume button for pending calls", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: null, // Pending
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
    });
  });

  it("does not show resume button for resolved calls", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: "2024-01-01T10:03:00Z", // Resolved
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /resume/i })).not.toBeInTheDocument();
    });
  });

  it("displays multiple calls in order", async () => {
    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(mockCalls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show both calls
      expect(screen.getByText("2:30")).toBeInTheDocument(); // First call at 2:30
      expect(screen.getByText("5:15")).toBeInTheDocument(); // Second call at 5:15
      expect(screen.getByText("Travel call")).toBeInTheDocument();
      expect(screen.getByText("Pick call")).toBeInTheDocument();
    });
  });

  it("displays elapsed time with seconds padded to 2 digits", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:00:05Z", // 5 seconds into point
        resume_timestamp: null,
        comments: null,
        created_at: "2024-01-01T10:00:05Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show 0:05 (not 0:5)
      expect(screen.getByText("0:05")).toBeInTheDocument();
    });
  });

  it("falls back to absolute time when point start time is null", async () => {
    const calls: Call[] = [
      {
        id: 1,
        point_id: 1,
        call_timestamp: "2024-01-01T10:02:00Z",
        resume_timestamp: null,
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
      },
    ];

    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json(calls);
      })
    );

    render(<CallsList pointId={1} pointStartTime={null} />);

    await waitFor(() => {
      // Should show locale time format (won't be MM:SS)
      const timeText = screen.queryByText(/:/);
      expect(timeText).toBeInTheDocument();
    });
  });

  it("handles error state gracefully", async () => {
    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json({ detail: "Error" }, { status: 500 });
      })
    );

    render(<CallsList pointId={1} pointStartTime="2024-01-01T10:00:00Z" />);

    await waitFor(() => {
      // Should show error message
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
