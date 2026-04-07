import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";

import { render, screen } from "../../test/test-utils";
import Layout from "../Layout";

describe("Layout", () => {
  function renderLayout(auth: {
    role: "public" | "team_member" | "team_analyst" | "admin";
    enforcementMode: "off" | "shadow" | "enforced";
    isAuthenticated: boolean;
    hasAppAccess: boolean;
  }) {
    render(
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div>Home content</div>} />
        </Route>
      </Routes>,
      {
        route: "/",
        auth: {
          ...auth,
          isConfigured: true,
        },
      }
    );
  }

  it("keeps the legacy full navigation visible while rollout mode is off", () => {
    renderLayout({
      role: "public",
      enforcementMode: "off",
      isAuthenticated: false,
      hasAppAccess: false,
    });

    expect(screen.getByRole("link", { name: /^teams$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^strategies$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^competitions$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^statistics$/i })).toBeInTheDocument();
  });

  it("shows spectator navigation only for public users when permissions are enforced", () => {
    renderLayout({
      role: "public",
      enforcementMode: "enforced",
      isAuthenticated: false,
      hasAppAccess: false,
    });

    expect(screen.queryByRole("link", { name: /^teams$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^strategies$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^competitions$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^statistics$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("keeps statistics hidden for team members when permissions are enforced", () => {
    renderLayout({
      role: "team_member",
      enforcementMode: "enforced",
      isAuthenticated: true,
      hasAppAccess: true,
    });

    expect(screen.getByRole("link", { name: /^teams$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^strategies$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^competitions$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^statistics$/i })).not.toBeInTheDocument();
  });

  it("shows statistics for analysts when permissions are enforced", () => {
    renderLayout({
      role: "team_analyst",
      enforcementMode: "enforced",
      isAuthenticated: true,
      hasAppAccess: true,
    });

    expect(screen.getByRole("link", { name: /^statistics$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
