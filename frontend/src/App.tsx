import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { I18nextProvider } from "react-i18next";
import { Analytics } from "@vercel/analytics/react";
import i18n from "./locales";
import Layout from "./components/Layout";
import LoadingState from "./components/shared/LoadingState";
import { AuthProvider, RequireMinimumRole } from "./auth";
import HomePage from "./pages/HomePage";
import { appTheme } from "./theme";

const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const TeamDetailPage = lazy(() => import("./pages/TeamDetailPage"));
const CompetitionsPage = lazy(() => import("./pages/CompetitionsPage"));
const CompetitionDetailPage = lazy(() => import("./pages/CompetitionDetailPage"));
const GameDetailPage = lazy(() => import("./pages/GameDetailPage"));
const LineDetailPage = lazy(() => import("./pages/LineDetailPage"));
const StrategiesPage = lazy(() => import("./pages/StrategiesPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function renderLazyRoute(content: ReactNode) {
  return (
    <Suspense fallback={<LoadingState showColdStartHint={false} />}>
      {content}
    </Suspense>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
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
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
        <Analytics />
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
