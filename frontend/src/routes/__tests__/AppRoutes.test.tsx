import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "../../test/test-utils";
import { server } from "../../test/setup";
import { UiModeProvider } from "../../uiMode/UiModeProvider";
import AppRoutes from "../AppRoutes";

vi.mock("../../pages/GameDetailPage", () => ({
  default: () => <div>New UI game detail route</div>,
}));

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
    renderAppRoutes("new", "/games/1");

    expect(await screen.findByText("New UI game detail route")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/games/1");
  });

  it("keeps new UI live spectator routes routable", async () => {
    renderAppRoutes("new", "/live/1");

    expect(
      await screen.findByRole("heading", { name: /^Live game$/i })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/live/1");
  });

  it("keeps new UI record routes routable", async () => {
    renderAppRoutes("new", "/record/1");

    expect(await screen.findByText("New UI game detail route")).toBeInTheDocument();
    expect(window.location.pathname).toBe("/record/1");
  });

  it("switches from old mode into the new UI route tree", async () => {
    const user = userEvent.setup();
    renderAppRoutes("old");

    await user.click(
      await screen.findByRole("button", { name: /^Switch to new UI$/i })
    );

    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("new");
    await waitFor(() => {
      expect(window.location.pathname).toBe("/games");
    });
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
