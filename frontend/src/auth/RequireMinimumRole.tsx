import { Navigate, Outlet, useLocation } from "react-router-dom";

import LoadingState from "../components/shared/LoadingState";
import { hasMinimumRole, shouldEnforcePermissions } from "./capabilities";
import { useAuth } from "./AuthProvider";
import type { AppRole } from "./types";

interface RequireMinimumRoleProps {
  minimumRole: AppRole;
  redirectTo?: string;
  children?: React.ReactNode;
}

export function RequireMinimumRole({
  minimumRole,
  redirectTo = "/competitions",
  children,
}: RequireMinimumRoleProps) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <LoadingState showColdStartHint={false} />;
  }

  if (!shouldEnforcePermissions(auth.enforcementMode)) {
    return children ?? <Outlet />;
  }

  if (hasMinimumRole(auth.role, minimumRole) && auth.hasAppAccess) {
    return children ?? <Outlet />;
  }

  return (
    <Navigate
      to={redirectTo}
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}
