import { render, screen, waitFor, within } from "../../../test/test-utils";
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
      <NewUiTeamProvider canLoadTeamDetails={role !== "public"}>
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
      ),
      http.get("http://localhost:8000/games", () =>
        HttpResponse.json([])
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

  it("renders mobile bottom navigation for primary new UI routes", async () => {
    server.use(
      http.get("http://localhost:8000/games", () =>
        HttpResponse.json([
          {
            id: 7,
            competition_id: 10,
            opponent_name: "Live Opponent",
            date: "2026-05-22T10:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 3,
            opponent_score: 2,
            team_name: "Monkey Stats",
            competition_name: "Spring Cup",
          },
        ])
      )
    );
    renderShell("team_member", "/games");

    const mobileNav = screen.getByLabelText(/^Mobile primary navigation$/i);

    expect(
      within(mobileNav).getByRole("link", { hidden: true, name: /^Games$/i })
    ).toHaveAttribute("href", "/games");
    expect(
      within(mobileNav).getByRole("link", { hidden: true, name: /^Games$/i })
    ).toHaveAttribute("aria-current", "page");
    await waitFor(() => {
      expect(
        within(mobileNav).getByRole("link", { hidden: true, name: /^Live$/i })
      ).toHaveAttribute("href", "/games/7");
    });
    expect(
      within(mobileNav).getByRole("link", { hidden: true, name: /^Stats$/i })
    ).toHaveAttribute("href", "/statistics");
    expect(
      within(mobileNav).getByRole("button", { hidden: true, name: /^More$/i })
    ).toBeInTheDocument();
  });

  it("disables the mobile live action when the selected team has no live game", async () => {
    server.use(
      http.get("http://localhost:8000/games", () =>
        HttpResponse.json([
          {
            id: 7,
            competition_id: 10,
            opponent_name: "Other Live Opponent",
            date: "2026-05-22T10:00:00Z",
            comments: null,
            status: "started",
            start_datetime: null,
            end_datetime: null,
            created_at: "2026-05-01T00:00:00Z",
            our_score: 3,
            opponent_score: 2,
            team_name: "Other Team",
            competition_name: "Other Cup",
          },
        ])
      )
    );
    renderShell("team_member", "/games");

    const mobileNav = screen.getByLabelText(/^Mobile primary navigation$/i);

    await waitFor(() => {
      expect(
        within(mobileNav).getByRole("button", {
          hidden: true,
          name: /^Live$/i,
        })
      ).toBeDisabled();
    });
    expect(
      within(mobileNav).queryByRole("link", { hidden: true, name: /^Live$/i })
    ).not.toBeInTheDocument();
  });

  it("opens the drawer from the mobile more navigation action", async () => {
    const user = userEvent.setup();
    renderShell("team_member", "/games");

    const mobileNav = screen.getByLabelText(/^Mobile primary navigation$/i);
    await user.click(
      within(mobileNav).getByRole("button", { hidden: true, name: /^More$/i })
    );

    expect(
      await screen.findByRole("link", { name: /^Team setup$/i })
    ).toBeInTheDocument();
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

    const mobileNav = screen.getByLabelText(/^Mobile primary navigation$/i);
    expect(
      within(mobileNav).getByRole("link", { hidden: true, name: /^Games$/i })
    ).toBeInTheDocument();
    expect(
      within(mobileNav).getByRole("button", { hidden: true, name: /^Live$/i })
    ).toBeDisabled();
    expect(
      within(mobileNav).queryByRole("link", { hidden: true, name: /^Stats$/i })
    ).not.toBeInTheDocument();
  });

  it("lets public users select a team from public-safe team options", async () => {
    server.use(
      http.get("http://localhost:8000/teams/public", () =>
        HttpResponse.json([
          {
            id: 1,
            name: "Monkey Stats",
            created_at: "2026-01-01T00:00:00Z",
          },
          {
            id: 2,
            name: "Banana Cutters",
            created_at: "2026-01-01T00:00:00Z",
          },
        ])
      )
    );

    renderShell("public");
    await openDrawer();

    const selector = await screen.findByRole("combobox", {
      name: /^Selected team$/i,
    });

    expect(selector).toBeEnabled();
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
