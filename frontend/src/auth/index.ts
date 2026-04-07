export { AuthProvider, useAuth } from "./AuthProvider";
export { RequireMinimumRole } from "./RequireMinimumRole";
export {
  getCapabilitiesForRole,
  hasMinimumRole,
  ROLE_HIERARCHY,
  shouldEnforcePermissions,
} from "./capabilities";
export { getAuthConfig, isAuthConfigured } from "./config";
export type {
  AppCapabilities,
  AppRole,
  AuthConfig,
  AuthEnforcementMode,
  AuthState,
} from "./types";
