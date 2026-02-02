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
  Tabs,
  Tab,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DownloadIcon from "@mui/icons-material/Download";
import { useTranslation } from "react-i18next";
import { getGame } from "../services/games";
import { getLiveGameStatistics, getGameTeamStatistics } from "../services/statistics";
import { getCallsByPoint } from "../services/calls";
import { getTurnoversByPoint } from "../services/turnovers";
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

// Helper function to export data as CSV
function exportToCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  color: string | ((theme: Theme) => string);
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

type SortColumn = "name" | "points" | "time" | "winRate" | "cleanPoints" | "forcedTurnovers";
type SortDirection = "asc" | "desc";
type TabValue = "offense" | "defense";

export default function GameStatisticsPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["statistics", "games", "common"]);
  const [activeTab, setActiveTab] = useState<TabValue>("offense");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isExporting, setIsExporting] = useState(false);

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
          if (activeTab === "offense") {
            comparison = a.offense.points_played - b.offense.points_played;
          } else {
            comparison = a.defense.points_played - b.defense.points_played;
          }
          break;
        case "time":
          comparison = a.effective_time_seconds - b.effective_time_seconds;
          break;
        case "winRate":
          if (activeTab === "offense") {
            comparison = a.offense.hold_rate - b.offense.hold_rate;
          } else {
            comparison = a.defense.break_rate - b.defense.break_rate;
          }
          break;
        case "cleanPoints":
          if (activeTab === "offense") {
            comparison = a.offense.clean_hold_rate - b.offense.clean_hold_rate;
          } else {
            comparison = a.defense.clean_break_rate - b.defense.clean_break_rate;
          }
          break;
        case "forcedTurnovers":
          comparison = a.defense.turnover_rate - b.defense.turnover_rate;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [playerStats, sortColumn, sortDirection, activeTab]);

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

  const handleExportCSV = async () => {
    if (!game || !teamStats || !playerStats) return;

    setIsExporting(true);
    try {
      const csvLines: string[] = [];

      // Game Information Section
      csvLines.push("GAME INFORMATION");
      csvLines.push(`Competition,${game.competition_name}`);
      csvLines.push(`Teams,"${game.team_name} vs ${game.opponent_name}"`);
      csvLines.push(`Score,${game.our_score} - ${game.opponent_score}`);
      csvLines.push(`Status,${game.status}`);
      if (game.start_datetime) {
        csvLines.push(`Start Time,${new Date(game.start_datetime).toLocaleString()}`);
      }
      if (game.end_datetime) {
        csvLines.push(`End Time,${new Date(game.end_datetime).toLocaleString()}`);
      }
      csvLines.push("");

      // Team Statistics Section
      if (teamStats.total_completed_points > 0) {
        csvLines.push("TEAM STATISTICS");
        csvLines.push("");

        // Offense Stats
        csvLines.push("Offense");
        csvLines.push("Metric,Count,Total,Percentage");
        csvLines.push(
          `Hold Rate,${teamStats.offense.points_won},${teamStats.offense.points_started},${formatPercent(teamStats.offense.hold_rate)}`
        );
        csvLines.push(
          `Clean Hold Rate,${teamStats.offense.points_won_no_turnover},${teamStats.offense.points_won},${formatPercent(teamStats.offense.clean_hold_rate)}`
        );
        csvLines.push("");

        // Defense Stats
        csvLines.push("Defense");
        csvLines.push("Metric,Count,Total,Percentage");
        csvLines.push(
          `Turnover Rate,${teamStats.defense.points_with_turnover},${teamStats.defense.points_started},${formatPercent(teamStats.defense.turnover_rate)}`
        );
        csvLines.push(
          `Break Rate,${teamStats.defense.points_won},${teamStats.defense.points_started},${formatPercent(teamStats.defense.break_rate)}`
        );
        csvLines.push(
          `Clean Break Rate,${teamStats.defense.points_won_no_turnover},${teamStats.defense.points_won},${formatPercent(teamStats.defense.clean_break_rate)}`
        );
        csvLines.push("");
      }

      // Player Statistics Section
      if (playerStats.length > 0) {
        csvLines.push("PLAYER STATISTICS");
        csvLines.push("");

        // Header row
        csvLines.push(
          [
            "Player Number",
            "Player Name",
            "Game Time",
            // Offense columns
            "Offense Points",
            "Offense Won",
            "Offense Hold Rate",
            "Offense Clean Points",
            "Offense Clean Hold Rate",
            // Defense columns
            "Defense Points",
            "Defense With Turnover",
            "Defense Turnover Rate",
            "Defense Won",
            "Defense Break Rate",
            "Defense Clean Breaks",
            "Defense Clean Break Rate",
          ].join(",")
        );

        // Player rows
        playerStats.forEach((stat) => {
          csvLines.push(
            [
              stat.player_number || "",
              `"${stat.player_name}"`,
              formatTime(stat.effective_time_seconds),
              // Offense
              stat.offense.points_played,
              stat.offense.points_won,
              formatPercent(stat.offense.hold_rate),
              stat.offense.points_won_no_turnover,
              formatPercent(stat.offense.clean_hold_rate),
              // Defense
              stat.defense.points_played,
              stat.defense.points_with_turnover,
              formatPercent(stat.defense.turnover_rate),
              stat.defense.points_won,
              formatPercent(stat.defense.break_rate),
              stat.defense.points_won_no_turnover,
              formatPercent(stat.defense.clean_break_rate),
            ].join(",")
          );
        });
      }

      // Points Detail Section
      if (game.points && game.points.length > 0) {
        csvLines.push("");
        csvLines.push("POINTS DETAIL");
        csvLines.push("");

        // Fetch calls and turnovers for all points
        const pointsWithEvents = await Promise.all(
          game.points.map(async (point) => {
            const [calls, turnovers] = await Promise.all([
              getCallsByPoint(point.id).catch(() => []),
              getTurnoversByPoint(point.id).catch(() => []),
            ]);
            return { point, calls, turnovers };
          })
        );

        // Calculate score after each point
        let ourScore = 0;
        let opponentScore = 0;

        // Export each point with its details
        for (const { point, calls, turnovers } of pointsWithEvents) {
          // Update score based on point result
          if (point.won !== null && point.status === "completed") {
            if (point.won) {
              ourScore++;
            } else {
              opponentScore++;
            }
          }

          csvLines.push(`Point ${point.point_number}`);
          csvLines.push("Field,Value");
          csvLines.push(`Type,${point.starting_on_offense ? "Offense" : "Defense"}`);
          csvLines.push(`Status,${point.status}`);
          csvLines.push(
            `Result,${point.won === null ? "In Progress" : point.won ? "Won" : "Lost"}`
          );
          csvLines.push(
            `Score After,${point.status === "completed" ? `"${ourScore} - ${opponentScore}"` : "N/A"}`
          );
          csvLines.push(`Field Side,${point.field_side || "N/A"}`);
          csvLines.push(`Pull,${point.pull === null ? "N/A" : point.pull ? "In" : "Out"}`);
          csvLines.push(
            `Strategy,${point.strategy ? `"${point.strategy.name}"` : "None"}`
          );
          csvLines.push(
            `Start Time,${point.start_datetime ? new Date(point.start_datetime).toLocaleString() : "Not started"}`
          );
          csvLines.push(
            `End Time,${point.end_datetime ? new Date(point.end_datetime).toLocaleString() : "Not ended"}`
          );
          csvLines.push(
            `Duration,${point.duration_seconds !== null && point.duration_seconds !== undefined ? formatTime(point.duration_seconds) : "N/A"}`
          );
          csvLines.push(`Comments,"${point.comments || ""}"`);
          csvLines.push("");

          // Players on this point
          if (point.players && point.players.length > 0) {
            csvLines.push("Players on Point");
            csvLines.push("Number,Name,Gender");
            point.players.forEach((player) => {
              csvLines.push(
                `${player.number || ""},"${player.name}",${player.gender}`
              );
            });
            csvLines.push("");
          }

          // Calls during this point
          if (calls.length > 0) {
            csvLines.push("Calls");
            csvLines.push("Call Time,Resume Time,Duration,Comments");
            calls.forEach((call) => {
              const callTime = new Date(call.call_timestamp).toLocaleString();
              const resumeTime = call.resume_timestamp
                ? new Date(call.resume_timestamp).toLocaleString()
                : "Pending";
              const duration = call.resume_timestamp
                ? `${Math.round(
                    (new Date(call.resume_timestamp).getTime() -
                      new Date(call.call_timestamp).getTime()) /
                      1000
                  )}s`
                : "Ongoing";
              csvLines.push(
                `${callTime},${resumeTime},${duration},"${call.comments || ""}"`
              );
            });
            csvLines.push("");
          }

          // Turnovers during this point
          if (turnovers.length > 0) {
            csvLines.push("Turnovers");
            csvLines.push("Time,Player,Comments");
            turnovers.forEach((turnover) => {
              const time = new Date(turnover.timestamp).toLocaleString();
              const playerName = turnover.player ? turnover.player.name : "Team";
              csvLines.push(`${time},"${playerName}","${turnover.comments || ""}"`);
            });
            csvLines.push("");
          }

          csvLines.push("---");
          csvLines.push("");
        }
      }

      const csvContent = csvLines.join("\n");
      const filename = `${game.team_name}_vs_${game.opponent_name}_statistics.csv`.replace(
        /[^a-z0-9_\-.]/gi,
        "_"
      );
      exportToCSV(csvContent, filename);
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
          {t("statistics:backToGame")}
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

            {/* Tabs for Offense/Defense */}
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                mb: 2,
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FlashOnIcon fontSize="small" />
                    {t("statistics:teamStats.offense")}
                  </Box>
                }
                value="offense"
                sx={{
                  textTransform: "none",
                  "&.Mui-selected": {
                    backgroundColor: (theme) => theme.colors.offense.main,
                    color: "white",
                  },
                }}
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ShieldIcon fontSize="small" />
                    {t("statistics:teamStats.defense")}
                  </Box>
                }
                value="defense"
                sx={{
                  textTransform: "none",
                  "&.Mui-selected": {
                    backgroundColor: (theme) => theme.colors.defense.main,
                    color: "white",
                  },
                }}
              />
            </Tabs>

            {/* Offense Table */}
            {activeTab === "offense" && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === "name"}
                          direction={sortColumn === "name" ? sortDirection : "asc"}
                          onClick={() => handleSort("name")}
                          hideSortIcon={sortColumn !== "name"}
                        >
                          {t("statistics:playerStats.playerName")}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "time"}
                          direction={sortColumn === "time" ? sortDirection : "asc"}
                          onClick={() => handleSort("time")}
                          hideSortIcon={sortColumn !== "time"}
                        >
                          Game time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "points"}
                          direction={sortColumn === "points" ? sortDirection : "asc"}
                          onClick={() => handleSort("points")}
                          hideSortIcon={sortColumn !== "points"}
                        >
                          Offense points
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "winRate"}
                          direction={sortColumn === "winRate" ? sortDirection : "asc"}
                          onClick={() => handleSort("winRate")}
                          hideSortIcon={sortColumn !== "winRate"}
                        >
                          <Tooltip title={t("statistics:tooltips.holdRate")} arrow>
                            <span>
                              {t("statistics:playerStats.offenseWinRate")}
                            </span>
                          </Tooltip>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "cleanPoints"}
                          direction={sortColumn === "cleanPoints" ? sortDirection : "asc"}
                          onClick={() => handleSort("cleanPoints")}
                          hideSortIcon={sortColumn !== "cleanPoints"}
                        >
                          <Tooltip title={t("statistics:tooltips.cleanPointRate")} arrow>
                            <span>
                              {t("statistics:playerStats.cleanPoints")}
                            </span>
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
                        <TableCell align="center">{formatTime(stat.effective_time_seconds)}</TableCell>
                        <TableCell align="center">{stat.offense.points_played}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Defense Table */}
            {activeTab === "defense" && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={sortColumn === "name"}
                          direction={sortColumn === "name" ? sortDirection : "asc"}
                          onClick={() => handleSort("name")}
                          hideSortIcon={sortColumn !== "name"}
                        >
                          {t("statistics:playerStats.playerName")}
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "time"}
                          direction={sortColumn === "time" ? sortDirection : "asc"}
                          onClick={() => handleSort("time")}
                          hideSortIcon={sortColumn !== "time"}
                        >
                          Game time
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "points"}
                          direction={sortColumn === "points" ? sortDirection : "asc"}
                          onClick={() => handleSort("points")}
                          hideSortIcon={sortColumn !== "points"}
                        >
                          Defense points
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "forcedTurnovers"}
                          direction={sortColumn === "forcedTurnovers" ? sortDirection : "asc"}
                          onClick={() => handleSort("forcedTurnovers")}
                          hideSortIcon={sortColumn !== "forcedTurnovers"}
                        >
                          <Tooltip title={t("statistics:tooltips.turnoverRate")} arrow>
                            <span>
                              {t("statistics:playerStats.forcedTurnovers")}
                            </span>
                          </Tooltip>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "winRate"}
                          direction={sortColumn === "winRate" ? sortDirection : "asc"}
                          onClick={() => handleSort("winRate")}
                          hideSortIcon={sortColumn !== "winRate"}
                        >
                          <Tooltip title={t("statistics:tooltips.breakRate")} arrow>
                            <span>
                              {t("statistics:playerStats.defenseWinRate")}
                            </span>
                          </Tooltip>
                        </TableSortLabel>
                      </TableCell>
                      <TableCell align="center">
                        <TableSortLabel
                          active={sortColumn === "cleanPoints"}
                          direction={sortColumn === "cleanPoints" ? sortDirection : "asc"}
                          onClick={() => handleSort("cleanPoints")}
                          hideSortIcon={sortColumn !== "cleanPoints"}
                        >
                          <Tooltip title={t("statistics:tooltips.cleanBreakRate")} arrow>
                            <span>
                              {t("statistics:playerStats.cleanBreak")}
                            </span>
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
                        <TableCell align="center">{formatTime(stat.effective_time_seconds)}</TableCell>
                        <TableCell align="center">{stat.defense.points_played}</TableCell>
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
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
