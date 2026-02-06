import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { I18nextProvider } from "react-i18next";
import i18n from "./locales";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import GamesPage from "./pages/GamesPage";
import GameDetailPage from "./pages/GameDetailPage";
import LineDetailPage from "./pages/LineDetailPage";
import StrategiesPage from "./pages/StrategiesPage";
import StatisticsPage from "./pages/StatisticsPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e3a8a",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    secondary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0284c7",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  gradients: {
    primary: "linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)",
    primaryReverse: "linear-gradient(180deg, #1e3a8a 0%, #38bdf8 100%)",
    light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
    middle: "#2b7cc1",
  },
  colors: {
    offense: {
      main: "#1e3a8a",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    defense: {
      main: "#1e3a8a",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    men: {
      main: "#1e3a8a",
    },
    women: {
      main: "#38bdf8",
    },
    pull: {
      main: "#2d7a3e",
    },
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="teams/:teamId" element={<TeamDetailPage />} />
                <Route path="competitions" element={<CompetitionsPage />} />
                <Route path="competitions/:competitionId" element={<CompetitionDetailPage />} />
                <Route path="lines/:lineId" element={<LineDetailPage />} />
                <Route path="strategies" element={<StrategiesPage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="games/:gameId" element={<GameDetailPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
