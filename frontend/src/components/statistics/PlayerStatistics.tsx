import { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  TableSortLabel,
  Tabs,
  Tab,
  Grid,
  useMediaQuery,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useTranslation } from "react-i18next";
import type { PlayerGameStats } from "../../types";
import PlayerStatsCard from "./PlayerStatsCard";

type SortColumn = "name" | "points" | "time" | "winRate" | "cleanPoints" | "forcedTurnovers";
type SortDirection = "asc" | "desc";
type TabValue = "offense" | "defense";

interface PlayerStatisticsProps {
  playerStats: PlayerGameStats[];
}

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

export default function PlayerStatistics({ playerStats }: PlayerStatisticsProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState<TabValue>("offense");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Sort player stats
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

  if (!playerStats || playerStats.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("playerStats.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("playerStats.noData")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("playerStats.title")}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {playerStats.length} {t("playerStats.playersCount")}
      </Typography>

      {/* Tabs for Offense/Defense */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => {
          setActiveTab(newValue);
          // Reset sort if switching to offense with defense-only sort
          if (newValue === "offense" && sortColumn === "forcedTurnovers") {
            setSortColumn("name");
            setSortDirection("asc");
          }
        }}
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
              {t("teamStats.offense")}
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
              {t("teamStats.defense")}
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

      {/* Mobile Sort Dropdown */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="sort-select-label">{t("playerStats.sortBy")}</InputLabel>
            <Select
              labelId="sort-select-label"
              label={t("playerStats.sortBy")}
              value={`${sortColumn}-${sortDirection}`}
              onChange={(e) => {
                const [column, direction] = e.target.value.split("-") as [
                  SortColumn,
                  SortDirection
                ];
                setSortColumn(column);
                setSortDirection(direction);
              }}
            >
              <MenuItem value="name-asc">{t("playerStats.sortByName")}</MenuItem>
              <MenuItem value="time-desc">{t("playerStats.sortByTime")}</MenuItem>
              <MenuItem value="points-desc">{t("playerStats.sortByPoints")}</MenuItem>
              {activeTab === "offense" && [
                <MenuItem key="hold" value="winRate-desc">{t("playerStats.sortByHold")}</MenuItem>,
                <MenuItem key="cleanHold" value="cleanPoints-desc">{t("playerStats.sortByCleanHold")}</MenuItem>,
              ]}
              {activeTab === "defense" && [
                <MenuItem key="turnover" value="forcedTurnovers-desc">{t("playerStats.sortByTurnover")}</MenuItem>,
                <MenuItem key="break" value="winRate-desc">{t("playerStats.sortByBreak")}</MenuItem>,
                <MenuItem key="cleanBreak" value="cleanPoints-desc">{t("playerStats.sortByCleanBreak")}</MenuItem>,
              ]}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Offense View */}
      {activeTab === "offense" && (
        <>
          {isMobile ? (
            <Grid container spacing={2}>
              {sortedPlayerStats.map((stat) => (
                <Grid key={stat.player_id} size={{ xs: 12 }}>
                  <PlayerStatsCard stats={stat} view="offense" />
                </Grid>
              ))}
            </Grid>
          ) : (
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
                        {t("playerStats.playerName")}
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
                        <Tooltip title={t("tooltips.holdRate")} arrow>
                          <span>{t("playerStats.offenseWinRate")}</span>
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
                        <Tooltip title={t("tooltips.cleanPointRate")} arrow>
                          <span>{t("playerStats.cleanPoints")}</span>
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
                          <Chip label={`#${stat.player_number}`} size="small" sx={{ width: 45 }} />
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
        </>
      )}

      {/* Defense View */}
      {activeTab === "defense" && (
        <>
          {isMobile ? (
            <Grid container spacing={2}>
              {sortedPlayerStats.map((stat) => (
                <Grid key={stat.player_id} size={{ xs: 12 }}>
                  <PlayerStatsCard stats={stat} view="defense" />
                </Grid>
              ))}
            </Grid>
          ) : (
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
                        {t("playerStats.playerName")}
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
                        <Tooltip title={t("tooltips.turnoverRate")} arrow>
                          <span>{t("playerStats.forcedTurnovers")}</span>
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
                        <Tooltip title={t("tooltips.breakRate")} arrow>
                          <span>{t("playerStats.defenseWinRate")}</span>
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
                        <Tooltip title={t("tooltips.cleanBreakRate")} arrow>
                          <span>{t("playerStats.cleanBreak")}</span>
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
                          <Chip label={`#${stat.player_number}`} size="small" sx={{ width: 45 }} />
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
        </>
      )}
    </Paper>
  );
}
