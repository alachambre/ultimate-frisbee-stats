import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";

import PermissionNotice from "../components/shared/PermissionNotice";
import LoadingState from "../components/shared/LoadingState";
import { hasMinimumRole, shouldEnforcePermissions } from "./capabilities";
import { useAuth } from "./AuthProvider";
import type { AppRole } from "./types";

interface RequireMinimumRoleProps {
  minimumRole: AppRole;
  redirectTo?: string;
  children?: React.ReactNode;
  alwaysEnforce?: boolean;
}

export function RequireMinimumRole({
  minimumRole,
  redirectTo = "/competitions",
  children,
  alwaysEnforce = false,
}: RequireMinimumRoleProps) {
  const auth = useAuth();
  const { t } = useTranslation("common");

  if (auth.isLoading) {
    return <LoadingState showColdStartHint={false} />;
  }

  if (!alwaysEnforce && !shouldEnforcePermissions(auth.enforcementMode)) {
    return children ?? <Outlet />;
  }

  if (hasMinimumRole(auth.role, minimumRole) && auth.hasAppAccess) {
    return children ?? <Outlet />;
  }

  let title = t("access.insufficientPermissionsTitle");
  let description = t("access.insufficientPermissionsDescription", {
    role: t(`access.roles.${minimumRole}`),
  });

  if (!auth.isAuthenticated) {
    title = t("access.signInRequiredTitle");
    description = auth.isConfigured
      ? t("access.signInRequiredDescription")
      : t("access.signInUnavailableDescription");
  } else if (!auth.hasAppAccess) {
    title = t("access.noAppAccessTitle");
    description = t("access.noAppAccessDescription");
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      <PermissionNotice
        title={title}
        description={description}
        actionLabel={t("access.backToCompetitions")}
        actionTo={redirectTo}
      />
    </Box>
  );
}
