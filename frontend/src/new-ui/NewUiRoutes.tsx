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
const NewRecordGameDetailPage = lazy(
  () => import("./pages/NewRecordGameDetailPage")
);
const NewGameTrackerPage = lazy(() => import("./pages/NewGameTrackerPage"));
const NewGameHistoryPage = lazy(() => import("./pages/NewGameHistoryPage"));
const NewStatisticsPage = lazy(() => import("./pages/NewStatisticsPage"));
const NewTeamSetupPage = lazy(() => import("./pages/NewTeamSetupPage"));
const NewStrategiesPage = lazy(() => import("./pages/NewStrategiesPage"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage"));
const CompetitionsPage = lazy(() => import("../pages/CompetitionsPage"));
const CompetitionDetailPage = lazy(
  () => import("../pages/CompetitionDetailPage")
);
const LineDetailPage = lazy(() => import("../pages/LineDetailPage"));
const TeamsPage = lazy(() => import("../pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("../pages/TeamDetailPage"));

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
  const canLoadTeamDetails =
    !shouldProtectUi ||
    auth.capabilities.canEditData ||
    auth.capabilities.canViewStatistics ||
    auth.capabilities.canManageUsers;

  return (
    <NewUiTeamProvider canLoadTeamDetails={canLoadTeamDetails}>
      <Routes>
        <Route path="/" element={<NewAppShell />}>
          <Route index element={<Navigate replace to="/games" />} />
          <Route path="games" element={renderLazyRoute(<NewAllGamesPage />)} />
          <Route
            path="games/:gameId"
            element={renderLazyRoute(<NewGameHistoryPage />)}
          />
          <Route
            path="live/:gameId"
            element={renderLazyRoute(<NewGameTrackerPage />)}
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
            path="record/:gameId"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewRecordGameDetailPage />
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
            path="teams"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <TeamsPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="teams/:teamId"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <TeamDetailPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="competitions"
            element={renderLazyRoute(<CompetitionsPage />)}
          />
          <Route
            path="competitions/:competitionId"
            element={renderLazyRoute(<CompetitionDetailPage />)}
          />
          <Route
            path="lines/:lineId"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <LineDetailPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="strategies"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <NewStrategiesPage />
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
