import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import TeamsPage from "./pages/TeamsPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import CompetitionsPage from "./pages/CompetitionsPage";
import CompetitionDetailPage from "./pages/CompetitionDetailPage";
import GamesPage from "./pages/GamesPage";
import GameDetailPage from "./pages/GameDetailPage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#667eea",
      light: "#8797f0",
      dark: "#4a5bb8",
    },
    secondary: {
      main: "#764ba2",
      light: "#9168bd",
      dark: "#533571",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
  },
  // Custom theme extensions
  gradients: {
    primary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    primaryReverse: "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
    light: "linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)",
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
              <Route path="games" element={<GamesPage />} />
              <Route path="games/:gameId" element={<GameDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
