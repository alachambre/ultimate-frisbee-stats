import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "../../test/test-utils";
import { server } from "../../test/setup";
import { UiModeProvider } from "../../uiMode/UiModeProvider";
import AppRoutes from "../AppRoutes";

function renderAppRoutes(uiMode: "old" | "new", route = "/") {
  localStorage.setItem("monkey-statistics-ui-mode", uiMode);

  render(
    <UiModeProvider>
      <AppRoutes />
    </UiModeProvider>,
    {
      route,
      auth: {
        role: "team_member",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
        enforcementMode: "enforced",
      },
    }
  );
}

describe("AppRoutes", () => {
  beforeEach(() => {
    localStorage.clear();
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
  });

  it("renders the old UI route tree in old mode", async () => {
    renderAppRoutes("old");

    expect(
      await screen.findByRole("link", { name: /^Teams$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Record game$/i })
    ).not.toBeInTheDocument();
  });

  it("renders the new UI route tree in new mode", async () => {
    const user = userEvent.setup();
    renderAppRoutes("new");

    expect(
      await screen.findByRole("heading", { name: /^All games$/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText("Monkey Stats").length).toBeGreaterThan(0);
    });

    await user.click(
      await screen.findByRole("button", { name: /^Monkey Statistics$/i })
    );

    expect(
      await screen.findByRole("link", { name: /^Record game$/i })
    ).toBeInTheDocument();
  });

  it("keeps new UI game detail routes routable", async () => {
    const gameDetailRequest = vi.fn();
    server.use(
      http.get("http://localhost:8000/games/1", () => {
        gameDetailRequest();
        return HttpResponse.json({
          id: 1,
          competition_id: 1,
          opponent_name: "Rival Team",
          date: "2026-05-22T10:00:00Z",
          comments: null,
          status: "ready",
          start_datetime: null,
          end_datetime: null,
          created_at: "2026-05-01T00:00:00Z",
          our_score: 0,
          opponent_score: 0,
          team_name: "Monkey Stats",
          competition_name: "Spring Cup",
          points: [],
          players: [],
          halftime: null,
        });
      }),
      http.get("http://localhost:8000/competitions/1", () =>
        HttpResponse.json({
          id: 1,
          team_id: 1,
          name: "Spring Cup",
          description: null,
          start_date: "2026-05-01",
          end_date: "2026-05-31",
          status: "ongoing",
          created_at: "2026-05-01T00:00:00Z",
          team_name: "Monkey Stats",
          players: [],
        })
      )
    );

    renderAppRoutes("new", "/games/1");

    await waitFor(
      () => {
        expect(gameDetailRequest).toHaveBeenCalledTimes(1);
      },
      { timeout: 5000 }
    );
    expect(window.location.pathname).toBe("/games/1");
  }, 10000);

  it("switches from old mode into the new UI route tree", async () => {
    const user = userEvent.setup();
    renderAppRoutes("old");

    await user.click(
      await screen.findByRole("button", { name: /^Switch to new UI$/i })
    );

    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("new");
    expect(
      await screen.findByRole("heading", { name: /^All games$/i })
    ).toBeInTheDocument();
  });

  it("switches from a new-only route back to a valid old UI route", async () => {
    const user = userEvent.setup();
    renderAppRoutes("new");

    expect(
      await screen.findByRole("heading", { name: /^All games$/i })
    ).toBeInTheDocument();

    await user.click(
      await screen.findByRole("button", { name: /^Monkey Statistics$/i })
    );
    await user.click(
      screen.getByRole("button", { name: /^Switch to old UI$/i })
    );

    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("old");
    expect(
      await screen.findByRole("link", { name: /^Teams$/i })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/competitions");
  });
});
