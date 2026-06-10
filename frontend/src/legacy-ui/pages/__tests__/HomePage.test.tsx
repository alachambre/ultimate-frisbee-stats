import { describe, expect, it } from "vitest";
import { delay, http, HttpResponse } from "msw";

import { render, screen } from "../../../test/test-utils";
import { server } from "../../../test/setup";
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

  it("shows a wake-up notice while the backend health check is still loading", async () => {
    server.use(
      http.get("http://localhost:8000/health", async () => {
        await delay(1500);
        return HttpResponse.json({
          status: "ok",
          service: "ultimate-frisbee-stats-api",
          version: "1.0.0",
        });
      })
    );

    render(<HomePage />);

    expect(
      await screen.findByTestId("home-server-wakeup-alert", {}, { timeout: 2500 })
    ).toBeInTheDocument();
    expect(screen.getByText(/waking up the server/i)).toBeInTheDocument();
  });

  it("shows an unavailable notice when the backend health check fails", async () => {
    server.use(
      http.get("http://localhost:8000/health", () =>
        HttpResponse.json({ detail: "Service unavailable" }, { status: 503 })
      )
    );

    render(<HomePage />);

    expect(await screen.findByTestId("home-server-unavailable-alert")).toBeInTheDocument();
    expect(screen.getByText(/server unavailable/i)).toBeInTheDocument();
  });
});
