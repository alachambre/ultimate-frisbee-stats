import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import {
  RequireMinimumRole,
  shouldEnforcePermissions,
  useAuth,
} from "../auth";
import LoadingState from "../components/shared/LoadingState";
import NewAppShell from "./shell/NewAppShell";
import { NewUiTeamProvider } from "./team/NewUiTeamProvider";

const NewAllGamesPage = lazy(() => import("./pages/NewAllGamesPage"));
const NewRecordGamePage = lazy(() => import("./pages/NewRecordGamePage"));
const NewLiveGamePage = lazy(() => import("./pages/NewLiveGamePage"));
const NewStatisticsPage = lazy(() => import("./pages/NewStatisticsPage"));
const NewTeamSetupPage = lazy(() => import("./pages/NewTeamSetupPage"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage"));
const GameDetailPage = lazy(() => import("../pages/GameDetailPage"));

function renderLazyRoute(content: ReactNode) {
  return (
    <Suspense fallback={<LoadingState showColdStartHint={false} />}>
      {content}
    </Suspense>
  );
}

export default function NewUiRoutes() {
  const auth = useAuth();
  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const canLoadTeams =
    !shouldProtectUi ||
    auth.capabilities.canEditData ||
    auth.capabilities.canViewStatistics ||
    auth.capabilities.canManageUsers;

  return (
    <NewUiTeamProvider canLoadTeams={canLoadTeams}>
      <Routes>
        <Route path="/" element={<NewAppShell />}>
          <Route index element={<Navigate replace to="/games" />} />
          <Route path="games" element={renderLazyRoute(<NewAllGamesPage />)} />
          <Route
            path="games/:gameId"
            element={renderLazyRoute(<GameDetailPage />)}
          />
          <Route path="live" element={renderLazyRoute(<NewLiveGamePage />)} />
          <Route
            path="live/:gameId"
            element={renderLazyRoute(<NewLiveGamePage />)}
          />
          <Route
            path="record"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewRecordGamePage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="statistics"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewStatisticsPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="team-setup"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewTeamSetupPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="admin/users"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="admin" alwaysEnforce>
                <AdminUsersPage />
              </RequireMinimumRole>
            )}
          />
          <Route path="*" element={<Navigate replace to="/games" />} />
        </Route>
      </Routes>
    </NewUiTeamProvider>
  );
}
