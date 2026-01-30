import { useState, useMemo } from "react";
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
  Tooltip,
  IconButton,
  CircularProgress,
  TableSortLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import { getGame } from "../services/games";
import { getLiveGameStatistics, getGameTeamStatistics } from "../services/statistics";
import PageHeader from "../components/shared/PageHeader";
import LoadingState from "../components/shared/LoadingState";
import GameTimer from "../components/games/GameTimer";

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

// Circular progress stat component
function CircularStat({
  label,
  percentage,
  count,
  total,
  color,
  tooltip,
}: {
  label: string;
  percentage: number;
  count?: number;
  total?: number;
  color: string | ((theme: any) => string);
  tooltip?: string;
}) {
  const displayPercentage = Math.round(percentage * 100);

  return (
    <Box sx={{ textAlign: "center" }}>
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          mb: 2,
        }}
      >
        {/* Background circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={4}
          sx={{
            color: "rgba(0, 0, 0, 0.1)",
            position: "absolute",
          }}
        />
        {/* Progress circle */}
        <CircularProgress
          variant="determinate"
          value={displayPercentage}
          size={140}
          thickness={4}
          sx={{
            color: typeof color === 'function' ? color : color,
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
            },
          }}
        />
        {/* Center content */}
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: typeof color === 'function' ? color : color }}
          >
            {displayPercentage}%
          </Typography>
          {count !== undefined && total !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {count}/{total}
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <Typography variant="body1" fontWeight="medium" color="text.primary">
          {label}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <IconButton size="small" sx={{ p: 0, color: "text.secondary" }}>
              <InfoOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

type SortColumn = "name" | "points" | "time" | "offenseWinRate" | "defenseWinRate" | "cleanPoints" | "cleanBreak" | "forcedTurnovers";
type SortDirection = "asc" | "desc";

export default function GameStatisticsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  // Sort player stats - must be before early returns to follow Rules of Hooks
  const sortedPlayerStats = useMemo(() => {
    if (!playerStats) return [];

    const sorted = [...playerStats];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case "name":
          comparison = a.player_name.localeCompare(b.player_name);
          break;
        case "points":
          comparison = a.points_played - b.points_played;
          break;
        case "time":
          comparison = a.effective_time_seconds - b.effective_time_seconds;
          break;
        case "offenseWinRate":
          comparison = a.offense.hold_rate - b.offense.hold_rate;
          break;
        case "defenseWinRate":
          comparison = a.defense.break_rate - b.defense.break_rate;
          break;
        case "cleanPoints":
          comparison = a.offense.clean_hold_rate - b.offense.clean_hold_rate;
          break;
        case "cleanBreak":
          comparison = a.defense.clean_break_rate - b.defense.clean_break_rate;
          break;
        case "forcedTurnovers":
          comparison = a.defense.turnover_rate - b.defense.turnover_rate;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [playerStats, sortColumn, sortDirection]);

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column with default ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader
        title={`${game.team_name} vs ${game.opponent_name} - ${t("statistics:page.title")}`}
      />

      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        {t("statistics:backToGame")}
      </Button>

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
      {teamStats && teamStats.total_completed_points > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("statistics:teamStats.title")}
          </Typography>

          {/* Offense Statistics */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
              <Typography variant="h6">
                {t("statistics:teamStats.offense")}
              </Typography>
            </Box>
            <Grid container spacing={3} justifyContent="center">
              <Grid size={{ xs: 6, sm: 4 }}>
                <CircularStat
                  label={t("statistics:teamStats.hold")}
                  percentage={teamStats.offense.hold_rate}
                  count={teamStats.offense.points_won}
                  total={teamStats.offense.points_started}
                  color={(theme) => theme.colors.offense.main}
                  tooltip={t("statistics:tooltips.holdRate")}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <CircularStat
                  label={t("statistics:teamStats.cleanHold")}
                  percentage={teamStats.offense.clean_hold_rate}
                  count={teamStats.offense.points_won_no_turnover}
                  total={teamStats.offense.points_won}
                  color={(theme) => theme.colors.offense.light}
                  tooltip={t("statistics:tooltips.cleanPointRate")}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Defense Statistics */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
              <Typography variant="h6">
                {t("statistics:teamStats.defense")}
              </Typography>
            </Box>
            <Grid container spacing={3} justifyContent="center">
              <Grid size={{ xs: 6, sm: 4 }}>
                <CircularStat
                  label={t("statistics:teamStats.turnover")}
                  percentage={teamStats.defense.turnover_rate}
                  count={teamStats.defense.points_with_turnover}
                  total={teamStats.defense.points_started}
                  color={(theme) => theme.colors.defense.main}
                  tooltip={t("statistics:tooltips.turnoverRate")}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <CircularStat
                  label={t("statistics:teamStats.break")}
                  percentage={teamStats.defense.break_rate}
                  count={teamStats.defense.points_won}
                  total={teamStats.defense.points_started}
                  color={(theme) => theme.colors.defense.light}
                  tooltip={t("statistics:tooltips.breakRate")}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <CircularStat
                  label={t("statistics:teamStats.cleanBreak")}
                  percentage={teamStats.defense.clean_break_rate}
                  count={teamStats.defense.points_won_no_turnover}
                  total={teamStats.defense.points_won}
                  color={(theme) => theme.colors.defense.dark}
                  tooltip={t("statistics:tooltips.cleanBreakRate")}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

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
                    <TableCell>
                      <TableSortLabel
                        active={sortColumn === "name"}
                        direction={sortColumn === "name" ? sortDirection : "asc"}
                        onClick={() => handleSort("name")}
                      >
                        {t("statistics:playerStats.playerName")}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "points"}
                        direction={sortColumn === "points" ? sortDirection : "asc"}
                        onClick={() => handleSort("points")}
                      >
                        {t("statistics:playerStats.pointsPlayed")}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "time"}
                        direction={sortColumn === "time" ? sortDirection : "asc"}
                        onClick={() => handleSort("time")}
                      >
                        {t("statistics:playerStats.playingTime")}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "offenseWinRate"}
                        direction={sortColumn === "offenseWinRate" ? sortDirection : "asc"}
                        onClick={() => handleSort("offenseWinRate")}
                      >
                        <Tooltip title={t("statistics:tooltips.holdRate")} arrow>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <FlashOnIcon fontSize="small" sx={{ color: (theme) => theme.colors.offense.main }} />
                            {t("statistics:playerStats.offenseWinRate")}
                          </Box>
                        </Tooltip>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "cleanPoints"}
                        direction={sortColumn === "cleanPoints" ? sortDirection : "asc"}
                        onClick={() => handleSort("cleanPoints")}
                      >
                        <Tooltip title={t("statistics:tooltips.cleanPointRate")} arrow>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <FlashOnIcon fontSize="small" sx={{ color: (theme) => theme.colors.offense.main }} />
                            {t("statistics:playerStats.cleanPoints")}
                          </Box>
                        </Tooltip>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "forcedTurnovers"}
                        direction={sortColumn === "forcedTurnovers" ? sortDirection : "asc"}
                        onClick={() => handleSort("forcedTurnovers")}
                      >
                        <Tooltip title={t("statistics:tooltips.turnoverRate")} arrow>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <ShieldIcon fontSize="small" sx={{ color: (theme) => theme.colors.defense.main }} />
                            {t("statistics:playerStats.forcedTurnovers")}
                          </Box>
                        </Tooltip>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "defenseWinRate"}
                        direction={sortColumn === "defenseWinRate" ? sortDirection : "asc"}
                        onClick={() => handleSort("defenseWinRate")}
                      >
                        <Tooltip title={t("statistics:tooltips.breakRate")} arrow>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <ShieldIcon fontSize="small" sx={{ color: (theme) => theme.colors.defense.main }} />
                            {t("statistics:playerStats.defenseWinRate")}
                          </Box>
                        </Tooltip>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={sortColumn === "cleanBreak"}
                        direction={sortColumn === "cleanBreak" ? sortDirection : "asc"}
                        onClick={() => handleSort("cleanBreak")}
                      >
                        <Tooltip title={t("statistics:tooltips.cleanBreakRate")} arrow>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <ShieldIcon fontSize="small" sx={{ color: (theme) => theme.colors.defense.main }} />
                            {t("statistics:playerStats.cleanBreak")}
                          </Box>
                        </Tooltip>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedPlayerStats.map((stat) => (
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
                          ? `${stat.offense.points_won} (${formatPercent(stat.offense.hold_rate)})`
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.offense.points_won > 0
                          ? `${stat.offense.points_won_no_turnover} (${formatPercent(stat.offense.clean_hold_rate)})`
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.defense.points_played > 0
                          ? `${stat.defense.points_with_turnover} (${formatPercent(stat.defense.turnover_rate)})`
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.defense.points_played > 0
                          ? `${stat.defense.points_won} (${formatPercent(stat.defense.break_rate)})`
                          : "-"}
                      </TableCell>
                      <TableCell align="center">
                        {stat.defense.points_won > 0
                          ? `${stat.defense.points_won_no_turnover} (${formatPercent(stat.defense.clean_break_rate)})`
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
