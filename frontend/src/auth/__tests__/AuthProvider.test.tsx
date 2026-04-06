import { Typography } from "@mui/material";
import { describe, expect, it } from "vitest";

import { render, screen } from "../../test/test-utils";
import { AuthProvider, useAuth } from "../AuthProvider";

function AuthProbe() {
  const auth = useAuth();

  return (
    <>
      <Typography>{auth.role}</Typography>
      <Typography>{auth.isAuthenticated ? "authenticated" : "anonymous"}</Typography>
      <Typography>{auth.capabilities.canViewStatistics ? "stats:on" : "stats:off"}</Typography>
      <Typography>{auth.isConfigured ? "configured" : "not-configured"}</Typography>
    </>
  );
}

describe("AuthProvider", () => {
  it("defaults to public access", () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByText("public")).toBeInTheDocument();
    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(screen.getByText("stats:off")).toBeInTheDocument();
  });

  it("exposes authenticated team analyst state when provided", () => {
    render(
      <AuthProvider role="team_analyst" email="analyst@example.com">
        <AuthProbe />
      </AuthProvider>
    );

    expect(screen.getByText("team_analyst")).toBeInTheDocument();
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("stats:on")).toBeInTheDocument();
  });
});
