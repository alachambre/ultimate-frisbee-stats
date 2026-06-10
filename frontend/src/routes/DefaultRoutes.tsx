import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import {
  RequireMinimumRole,
  shouldEnforcePermissions,
  useAuth,
} from "../auth";
import AppShell from "../components/shell/AppShell";
import LoadingState from "../components/shared/LoadingState";
import { SelectedTeamProvider } from "../components/team/SelectedTeamProvider";

const AllGamesPage = lazy(() => import("../pages/AllGamesPage"));
const RecordGamePage = lazy(() => import("../pages/RecordGamePage"));
const RecordGameDetailPage = lazy(
  () => import("../pages/RecordGameDetailPage")
);
const GameTrackerPage = lazy(() => import("../pages/GameTrackerPage"));
const GameHistoryPage = lazy(() => import("../pages/GameHistoryPage"));
const StatisticsPage = lazy(() => import("../pages/StatisticsPage"));
const TeamSetupPage = lazy(() => import("../pages/TeamSetupPage"));
const StrategiesPage = lazy(() => import("../pages/StrategiesPage"));
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

export default function DefaultRoutes() {
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
    <SelectedTeamProvider canLoadTeamDetails={canLoadTeamDetails}>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate replace to="/games" />} />
          <Route path="games" element={renderLazyRoute(<AllGamesPage />)} />
          <Route
            path="games/:gameId"
            element={renderLazyRoute(<GameHistoryPage />)}
          />
          <Route
            path="live/:gameId"
            element={renderLazyRoute(<GameTrackerPage />)}
          />
          <Route
            path="record"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <RecordGamePage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="record/:gameId"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <RecordGameDetailPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="statistics"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <StatisticsPage />
              </RequireMinimumRole>
            )}
          />
          <Route
            path="team-setup"
            element={renderLazyRoute(
              <RequireMinimumRole minimumRole="team_member">
                <TeamSetupPage />
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
                <StrategiesPage />
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
    </SelectedTeamProvider>
  );
}
