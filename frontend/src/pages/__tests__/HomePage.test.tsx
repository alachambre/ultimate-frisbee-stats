import { describe, expect, it } from "vitest";

import { render, screen } from "../../test/test-utils";
import HomePage from "../HomePage";

describe("HomePage", () => {
  it("centers the single public card when only competitions are available", () => {
    render(<HomePage />, {
      auth: {
        role: "public",
        enforcementMode: "enforced",
        isAuthenticated: false,
        hasAppAccess: false,
        isConfigured: true,
      },
    });

    expect(screen.getByTestId("home-cards-grid")).toHaveStyle({
      justifyContent: "center",
    });
    expect(
      screen.getByRole("link", { name: /competitions/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /manage teams/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /statistics/i })
    ).not.toBeInTheDocument();
  });

  it("keeps the full dashboard cards for admins", () => {
    render(<HomePage />, {
      auth: {
        role: "admin",
        enforcementMode: "enforced",
        isAuthenticated: true,
        hasAppAccess: true,
        isConfigured: true,
      },
    });

    expect(
      screen.getByRole("link", { name: /manage teams/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /competitions/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /statistics/i })
    ).toBeInTheDocument();
  });
});
