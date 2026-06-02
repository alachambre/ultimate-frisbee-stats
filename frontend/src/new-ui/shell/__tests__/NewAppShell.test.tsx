import { render, screen, waitFor } from "../../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "../../../test/setup";
import { UiModeProvider } from "../../../uiMode/UiModeProvider";
import { NewUiTeamProvider } from "../../team/NewUiTeamProvider";
import NewAppShell from "../NewAppShell";
import { isMobileFullscreenRoute } from "../mobileFullscreenRoutes";

function renderShell(
  role: "public" | "team_member" | "team_analyst" | "admin",
  route = "/",
) {
  localStorage.setItem("monkey-statistics-ui-mode", "new");

  render(
    <UiModeProvider>
      <NewUiTeamProvider canLoadTeams={role !== "public"}>
        <Routes>
          <Route path="*" element={<NewAppShell />}>
            <Route path="*" element={<div>New UI content</div>} />
          </Route>
        </Routes>
      </NewUiTeamProvider>
    </UiModeProvider>,
    {
      route,
      auth: {
        role,
        isAuthenticated: role !== "public",
        hasAppAccess: role !== "public",
        isConfigured: true,
        enforcementMode: "enforced",
      },
    }
  );
}

async function openDrawer() {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /^Open navigation$/i })
  );
  return user;
}

describe("NewAppShell", () => {
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

  it("shows team member navigation and the auto-selected team", async () => {
    renderShell("team_member");
    await openDrawer();

    expect(
      screen.getByRole("link", { name: /^All games$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Statistics$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Team setup$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Record game$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Live game$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Admin$/i })
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("Monkey Stats").length).toBeGreaterThan(0);
    });
  });

  it("shows admin navigation for admins", async () => {
    renderShell("admin");
    await openDrawer();

    expect(screen.getByRole("link", { name: /^Admin$/i })).toBeInTheDocument();
  });

  it("shows public navigation only for spectator-safe areas", async () => {
    renderShell("public");
    await openDrawer();

    expect(
      screen.getByRole("link", { name: /^All games$/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Record game$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Live game$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Team setup$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /^Statistics$/i })
    ).not.toBeInTheDocument();
  });

  it("highlights All games while viewing a live game", async () => {
    renderShell("team_member", "/live/1");

    await waitFor(() => {
      expect(
        screen.getAllByRole("link", {
          hidden: true,
          name: /^All games$/i,
        })[0],
      ).toHaveClass("MuiButton-contained");
    });
  });

  it("switches back to old UI from the mode toggle", async () => {
    renderShell("team_member");
    const user = await openDrawer();

    await user.click(
      screen.getByRole("button", { name: /^Switch to old UI$/i })
    );

    expect(localStorage.getItem("monkey-statistics-ui-mode")).toBe("old");
  });

  it("shows drawer navigation, language toggle, mode toggle, and auth action", async () => {
    renderShell("public");
    const user = await openDrawer();

    expect(
      screen.getByRole("link", { name: /^All games$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Switch to old UI$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Select Language$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(
      screen.getByRole("heading", { name: /^Sign in$/i })
    ).toBeInTheDocument();
  });

  it("lets users switch language from the new UI shell", async () => {
    renderShell("public");
    await openDrawer();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /^Select Language$/i }));
    await user.click(screen.getByRole("menuitem", { name: /Français/i }));

    expect(localStorage.getItem("i18nextLng")).toBe("fr");
  });

  it("uses the mobile fullscreen shell for live tracking and game history", () => {
    expect(isMobileFullscreenRoute("/live/1")).toBe(true);
    expect(isMobileFullscreenRoute("/games/1")).toBe(true);
    expect(isMobileFullscreenRoute("/games")).toBe(false);
    expect(isMobileFullscreenRoute("/games/1/details")).toBe(false);
    expect(isMobileFullscreenRoute("/statistics")).toBe(false);
  });
});
