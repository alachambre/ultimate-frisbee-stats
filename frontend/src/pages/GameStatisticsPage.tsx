import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DownloadIcon from "@mui/icons-material/Download";
import { useTranslation } from "react-i18next";
import { getGame } from "../services/games";
import { getLiveGameStatistics, getGameTeamStatistics, getGameStrategyStatistics } from "../services/statistics";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";
import { exportGameStatisticsToCSV } from "../utils/csvExport";
import TeamStatistics from "../components/statistics/TeamStatistics";
import StrategyStatistics from "../components/statistics/StrategyStatistics";
import PlayerStatistics from "../components/statistics/PlayerStatistics";
import { queryKeys } from "../utils/queryKeys";

export default function GameStatisticsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [isExporting, setIsExporting] = useState(false);
  const gameIdNumber = Number(gameId);
  const gameIdValid = Number.isFinite(gameIdNumber);

  // Fetch game details
  const {
    data: game,
    isLoading: isLoadingGame,
    error: gameError,
  } = useQuery({
    queryKey: queryKeys.game(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGame(gameIdNumber),
    enabled: gameIdValid,
  });

  // Fetch team statistics
  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.gameTeamStatistics(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGameTeamStatistics(gameIdNumber),
    enabled: gameIdValid,
  });

  // Fetch player statistics
  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError,
  } = useQuery({
    queryKey: queryKeys.liveStats(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getLiveGameStatistics(gameIdNumber),
    enabled: gameIdValid,
  });

  // Fetch strategy statistics
  const {
    data: strategyStats,
    isLoading: isLoadingStrategyStats,
  } = useQuery({
    queryKey: queryKeys.gameStrategyStatistics(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGameStrategyStatistics(gameIdNumber),
    enabled: gameIdValid,
  });

  if (isLoadingGame || isLoadingTeamStats || isLoadingPlayerStats || isLoadingStrategyStats) {
    return <LoadingState message={t("common:loading")} />;
  }

  if (gameError || teamStatsError || playerStatsError || !game) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t("common:error")}: {gameError?.message || teamStatsError?.message || playerStatsError?.message}
        </Alert>
      </Container>
    );
  }

  const handleBack = () => {
    navigate(`/games/${gameId}`);
  };

  const handleExportCSV = async () => {
    if (!game || !teamStats || !playerStats) return;

    setIsExporting(true);
    try {
      await exportGameStatisticsToCSV(game, teamStats, playerStats, strategyStats);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      // Could add error notification here
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title={`${game.team_name} vs ${game.opponent_name} - ${t("statistics:page.title")}`}
      />

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          {t("statistics:page.backToGame")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={!game || !playerStats || isExporting}
        >
          {isExporting ? t("common:action.loading") : t("statistics:page.exportCSV")}
        </Button>
      </Box>

      {/* Game Overview Section */}
      <Paper sx={{ mb: 3 }}>
        <Box p={4} textAlign="center">
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <EmojiEventsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {game.competition_name}
            </Typography>
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {game.status === "ended" ? t("games:detail.finalScore") : t("games:detail.score")}
          </Typography>
          <Typography variant="h2" fontWeight="bold">
            {game.our_score} - {game.opponent_score}
          </Typography>

          {/* Game Timer */}
          {game.start_datetime && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("games:detail.gameDuration")}
              </Typography>
              <GameTimer
                startDatetime={game.start_datetime}
                endDatetime={game.end_datetime}
              />
            </Box>
          )}

          <Box mt={2} display="flex" justifyContent="center" gap={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {game.team_name}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {game.our_score}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="body2" color="text.secondary">
                {game.opponent_name}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {game.opponent_score}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Team Statistics Section */}
      {teamStats && <TeamStatistics teamStats={teamStats} />}

      {/* Strategy Statistics Section */}
      {strategyStats && <StrategyStatistics strategyStats={strategyStats} />}

      {/* Player Statistics Section */}
      {playerStats && <PlayerStatistics playerStats={playerStats} />}
    </Container>
  );
}
