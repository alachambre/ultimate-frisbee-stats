import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { RequireMinimumRole } from "../auth";
import Layout from "../components/Layout";
import LoadingState from "../components/shared/LoadingState";
import HomePage from "../pages/HomePage";

const TeamsPage = lazy(() => import("../pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("../pages/TeamDetailPage"));
const CompetitionsPage = lazy(() => import("../pages/CompetitionsPage"));
const CompetitionDetailPage = lazy(
  () => import("../pages/CompetitionDetailPage")
);
const GameDetailPage = lazy(() => import("../pages/GameDetailPage"));
const LineDetailPage = lazy(() => import("../pages/LineDetailPage"));
const StrategiesPage = lazy(() => import("../pages/StrategiesPage"));
const StatisticsPage = lazy(() => import("../pages/StatisticsPage"));
const AdminUsersPage = lazy(() => import("../pages/AdminUsersPage"));

function renderLazyRoute(content: ReactNode) {
  return (
    <Suspense fallback={<LoadingState showColdStartHint={false} />}>
      {content}
    </Suspense>
  );
}

export default function OldUiRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
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
        <Route path="record" element={<Navigate replace to="/teams" />} />
        <Route path="team-setup" element={<Navigate replace to="/teams" />} />
        <Route path="live" element={<Navigate replace to="/competitions" />} />
        <Route path="games" element={<Navigate replace to="/competitions" />} />
        <Route
          path="games/:gameId"
          element={renderLazyRoute(<GameDetailPage />)}
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
          path="admin/users"
          element={renderLazyRoute(
            <RequireMinimumRole minimumRole="admin" alwaysEnforce>
              <AdminUsersPage />
            </RequireMinimumRole>
          )}
        />
      </Route>
    </Routes>
  );
}
