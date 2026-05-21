import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { render, screen, waitFor } from "../../test/test-utils";
import { server } from "../../test/setup";
import { UiModeProvider } from "../../uiMode/UiModeProvider";
import AppRoutes from "../AppRoutes";

function renderAppRoutes(uiMode: "old" | "new") {
  localStorage.setItem("monkey-statistics-ui-mode", uiMode);

  render(
    <UiModeProvider>
      <AppRoutes />
    </UiModeProvider>,
    {
      route: "/",
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
});
