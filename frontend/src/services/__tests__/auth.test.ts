import { describe, expect, it } from "vitest";

import { mapAuthMeResponse } from "../auth";

describe("auth service", () => {
  it("maps backend auth capability flags into frontend capability names", () => {
    const result = mapAuthMeResponse({
      role: "admin",
      capabilities: {
        can_view_public_content: true,
        can_view_comments: true,
        can_view_strategies: true,
        can_edit_data: true,
        can_view_statistics: true,
        can_export_statistics: true,
        can_manage_users: true,
      },
      is_authenticated: true,
      has_app_access: true,
      enforcement_mode: "enforced",
      email: "admin@example.com",
      auth_user_id: "auth-admin-1",
    });

    expect(result.capabilities.canViewPublicContent).toBe(true);
    expect(result.capabilities.canViewComments).toBe(true);
    expect(result.capabilities.canViewStrategies).toBe(true);
    expect(result.capabilities.canEditData).toBe(true);
    expect(result.capabilities.canViewStatistics).toBe(true);
    expect(result.capabilities.canExportStatistics).toBe(true);
    expect(result.capabilities.canManageUsers).toBe(true);
  });
});
