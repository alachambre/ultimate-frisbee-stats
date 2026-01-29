import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslation } from "react-i18next";
import { getGame } from "../services/games";
import { getLiveGameStatistics, getGameTeamStatistics } from "../services/statistics";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Helper function to format percentage
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

// Stat card component for team statistics
function StatCard({
  label,
  value,
  tooltip
}: {
  label: string;
  value: string | number;
  tooltip?: string;
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        p: 2,
        borderRadius: 1,
        bgcolor: "background.default",
      }}
      title={tooltip}
    >
      <Typography variant="h4" color="primary.main" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default function GameStatisticsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "common"]);

  // Fetch game details
  const {
    data: game,
    isLoading: isLoadingGame,
    error: gameError,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGame(Number(gameId)),
    enabled: !!gameId,
  });

  // Fetch team statistics
  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: ["gameTeamStatistics", gameId],
    queryFn: () => getGameTeamStatistics(Number(gameId)),
    enabled: !!gameId,
  });

  // Fetch player statistics
  const {
    data: playerStats,
    isLoading: isLoadingPlayerStats,
    error: playerStatsError,
  } = useQuery({
    queryKey: ["gamePlayerStatistics", gameId],
    queryFn: () => getLiveGameStatistics(Number(gameId)),
    enabled: !!gameId,
  });

  if (isLoadingGame || isLoadingTeamStats || isLoadingPlayerStats) {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title={t("statistics:page.title")}
        subtitle={`${game.opponent} - ${new Date(game.date).toLocaleDateString()}`}
      />

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        {t("common:backToGame")}
      </Button>

      {/* Team Statistics Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("statistics:teamStats.title")}
        </Typography>

        {!teamStats || teamStats.total_completed_points === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("statistics:playerStats.noData")}
          </Typography>
        ) : (
          <Box>
            {/* Overview */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t("statistics:teamStats.overview")}
              </Typography>
              <StatCard
                label={t("statistics:teamStats.totalPoints")}
                value={teamStats.total_completed_points}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Offense Statistics */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <FlashOnIcon color="primary" />
                <Typography variant="h6">
                  {t("statistics:teamStats.offense")}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.offensePoints")}
                    value={teamStats.offense.points_started}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.offenseWon")}
                    value={teamStats.offense.points_won}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.offenseLost")}
                    value={teamStats.offense.points_lost}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.hold")}
                    value={formatPercent(teamStats.offense.win_rate)}
                    tooltip={t("statistics:tooltips.holdRate")}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.cleanHold")}
                    value={formatPercent(teamStats.offense.clean_point_rate)}
                    tooltip={t("statistics:tooltips.cleanPointRate")}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Defense Statistics */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <ShieldIcon color="secondary" />
                <Typography variant="h6">
                  {t("statistics:teamStats.defense")}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.defensePoints")}
                    value={teamStats.defense.points_started}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.defenseWon")}
                    value={teamStats.defense.points_won}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.defenseLost")}
                    value={teamStats.defense.points_lost}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.winRate")}
                    value={formatPercent(teamStats.defense.win_rate)}
                    tooltip={t("statistics:tooltips.winRate")}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.turnoverRate")}
                    value={formatPercent(teamStats.defense.turnover_rate)}
                    tooltip={t("statistics:tooltips.turnoverRate")}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <StatCard
                    label={t("statistics:teamStats.cleanBreakRate")}
                    value={formatPercent(teamStats.defense.clean_break_rate)}
                    tooltip={t("statistics:tooltips.cleanBreakRate")}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Player Statistics Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("statistics:playerStats.title")}
        </Typography>

        {!playerStats || playerStats.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("statistics:playerStats.noData")}
          </Typography>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {playerStats.length} {t("statistics:playerStats.playersCount")}
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("statistics:playerStats.playerName")}</TableCell>
                    <TableCell align="center">{t("statistics:playerStats.pointsPlayed")}</TableCell>
                    <TableCell align="center">{t("statistics:playerStats.playingTime")}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <FlashOnIcon fontSize="small" color="primary" />
                        {t("statistics:playerStats.offenseWinRate")}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                        <ShieldIcon fontSize="small" color="secondary" />
                        {t("statistics:playerStats.defenseWinRate")}
                      </Box>
                    </TableCell>
                    <TableCell align="center">{t("statistics:playerStats.cleanPoints")}</TableCell>
                    <TableCell align="center">{t("statistics:playerStats.forcedTurnovers")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {playerStats.map((stat) => (
                    <TableRow key={stat.player_id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Chip
                            label={`#${stat.player_number}`}
                            size="small"
                            sx={{ width: 45 }}
                          />
                          <Typography variant="body2">{stat.player_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{stat.points_played}</TableCell>
                      <TableCell align="center">{formatTime(stat.effective_time_seconds)}</TableCell>
                      <TableCell align="center">
                        {stat.offense.points_played > 0
                          ? formatPercent(stat.offense.win_rate)
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.defense.points_played > 0
                          ? formatPercent(stat.defense.win_rate)
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.offense.points_won > 0
                          ? `${stat.offense.points_won_no_turnover} (${formatPercent(stat.offense.clean_point_rate)})`
                          : "-"}
                      </TableCell>
                      <TableCell
                        align="center"
                        title={t("statistics:tooltips.forcedTurnovers")}
                      >
                        {stat.defense.points_played > 0
                          ? `${stat.defense.points_with_turnover} (${formatPercent(stat.defense.turnover_rate)})`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
