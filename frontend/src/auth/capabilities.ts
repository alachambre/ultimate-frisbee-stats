import type { AppCapabilities, AppRole, AuthEnforcementMode } from "./types";

export const ROLE_HIERARCHY: readonly AppRole[] = [
  "public",
  "team_member",
  "team_analyst",
  "admin",
];

const CAPABILITY_MATRIX: Record<AppRole, AppCapabilities> = {
  public: {
    canViewPublicContent: true,
    canViewComments: false,
    canViewStrategies: false,
    canEditData: false,
    canViewStatistics: false,
    canExportStatistics: false,
    canManageUsers: false,
  },
  team_member: {
    canViewPublicContent: true,
    canViewComments: true,
    canViewStrategies: true,
    canEditData: true,
    canViewStatistics: false,
    canExportStatistics: false,
    canManageUsers: false,
  },
  team_analyst: {
    canViewPublicContent: true,
    canViewComments: true,
    canViewStrategies: true,
    canEditData: true,
    canViewStatistics: true,
    canExportStatistics: true,
    canManageUsers: false,
  },
  admin: {
    canViewPublicContent: true,
    canViewComments: true,
    canViewStrategies: true,
    canEditData: true,
    canViewStatistics: true,
    canExportStatistics: true,
    canManageUsers: true,
  },
};

export function getCapabilitiesForRole(role: AppRole): AppCapabilities {
  return { ...CAPABILITY_MATRIX[role] };
}

export function hasMinimumRole(role: AppRole, minimumRole: AppRole): boolean {
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(minimumRole);
}

export function shouldEnforcePermissions(
  enforcementMode: AuthEnforcementMode,
  isLoading = false
): boolean {
  return isLoading || enforcementMode === "enforced";
}
