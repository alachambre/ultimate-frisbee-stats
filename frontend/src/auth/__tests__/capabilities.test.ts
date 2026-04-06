import { describe, expect, it } from "vitest";

import { getCapabilitiesForRole, hasMinimumRole } from "../capabilities";
import { getAuthConfig, isAuthConfigured } from "../config";

describe("auth capabilities", () => {
  it("returns the expected public capabilities", () => {
    expect(getCapabilitiesForRole("public")).toEqual({
      canViewPublicContent: true,
      canViewComments: false,
      canViewStrategies: false,
      canEditData: false,
      canViewStatistics: false,
      canExportStatistics: false,
      canManageUsers: false,
    });
  });

  it("returns the expected team analyst capabilities", () => {
    expect(getCapabilitiesForRole("team_analyst")).toEqual({
      canViewPublicContent: true,
      canViewComments: true,
      canViewStrategies: true,
      canEditData: true,
      canViewStatistics: true,
      canExportStatistics: true,
      canManageUsers: false,
    });
  });

  it("evaluates role thresholds correctly", () => {
    expect(hasMinimumRole("public", "team_member")).toBe(false);
    expect(hasMinimumRole("team_member", "team_member")).toBe(true);
    expect(hasMinimumRole("team_member", "team_analyst")).toBe(false);
    expect(hasMinimumRole("admin", "team_analyst")).toBe(true);
  });
});

describe("auth config", () => {
  it("reads Supabase env values", () => {
    const config = getAuthConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(config).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    });
    expect(isAuthConfigured(config)).toBe(true);
  });

  it("reports auth as not configured when env values are missing", () => {
    expect(
      isAuthConfigured(
        getAuthConfig({
          VITE_SUPABASE_URL: undefined,
          VITE_SUPABASE_ANON_KEY: undefined,
        })
      )
    ).toBe(false);
  });
});
