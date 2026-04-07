import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";

import { render, screen } from "../../test/test-utils";
import { RequireMinimumRole } from "../RequireMinimumRole";

describe("RequireMinimumRole", () => {
  function renderProtectedRoute(auth: {
    role: "public" | "team_member" | "team_analyst" | "admin";
    enforcementMode: "off" | "shadow" | "enforced";
    isAuthenticated: boolean;
    hasAppAccess: boolean;
  }) {
    render(
      <Routes>
        <Route path="/competitions" element={<div>Competitions page</div>} />
        <Route
          path="/statistics"
          element={
            <RequireMinimumRole minimumRole="team_analyst">
              <div>Statistics page</div>
            </RequireMinimumRole>
          }
        />
      </Routes>,
      {
        route: "/statistics",
        auth: {
          ...auth,
          isConfigured: true,
        },
      }
    );
  }

  it("redirects anonymous users when permissions are enforced", () => {
    renderProtectedRoute({
      role: "public",
      enforcementMode: "enforced",
      isAuthenticated: false,
      hasAppAccess: false,
    });

    expect(screen.getByText(/sign in required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/use the sign in button in the header to access this area/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Statistics page")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to competitions/i })
    ).toBeInTheDocument();
  });

  it("keeps protected routes accessible while rollout mode is off", () => {
    renderProtectedRoute({
      role: "public",
      enforcementMode: "off",
      isAuthenticated: false,
      hasAppAccess: false,
    });

    expect(screen.getByText("Statistics page")).toBeInTheDocument();
  });

  it("allows analysts through when permissions are enforced", () => {
    renderProtectedRoute({
      role: "team_analyst",
      enforcementMode: "enforced",
      isAuthenticated: true,
      hasAppAccess: true,
    });

    expect(screen.getByText("Statistics page")).toBeInTheDocument();
  });

  it("shows a role-specific notice for team members on analyst-only routes", () => {
    renderProtectedRoute({
      role: "team_member",
      enforcementMode: "enforced",
      isAuthenticated: true,
      hasAppAccess: true,
    });

    expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this page requires team analyst access/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Statistics page")).not.toBeInTheDocument();
  });
});
