import { useMemo, useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsIcon from "@mui/icons-material/Groups";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import LoadingState from "../../components/shared/LoadingState";
import type { PlayerGameStats } from "../../types";

interface NewStatisticsPlayersSectionProps {
  error: Error | null;
  isLoading: boolean;
  players?: PlayerGameStats[];
}

type PlayerStatsView = "offense" | "defense" | "all";
type SortDirection = "asc" | "desc";
type SortColumn =
  | "name"
  | "time"
  | "points"
  | "offensePoints"
  | "holdRate"
  | "cleanHoldRate"
  | "ourTurnovers"
  | "defensePoints"
  | "turnoverRate"
  | "breakRate"
  | "cleanBreakRate";

interface SortableHeaderProps {
  align?: "left" | "right";
  column: SortColumn;
  label: string;
  onSort: (column: SortColumn) => void;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

function formatPercentage(value?: number, total?: number) {
  if (value === undefined || total === 0) {
    return "-";
  }

  return `${Math.round(value * 100)}%`;
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getSortValue(player: PlayerGameStats, column: SortColumn): number | string {
  switch (column) {
    case "name":
      return player.player_name;
    case "time":
      return player.effective_time_seconds;
    case "points":
      return player.points_played;
    case "offensePoints":
      return player.offense.points_played;
    case "holdRate":
      return player.offense.hold_rate;
    case "cleanHoldRate":
      return player.offense.clean_hold_rate;
    case "ourTurnovers":
      return player.offense.our_turnovers ?? 0;
    case "defensePoints":
      return player.defense.points_played;
    case "turnoverRate":
      return player.defense.turnover_rate;
    case "breakRate":
      return player.defense.break_rate;
    case "cleanBreakRate":
      return player.defense.clean_break_rate;
  }
}

function SortableHeader({
  align = "left",
  column,
  label,
  onSort,
  sortColumn,
  sortDirection,
}: SortableHeaderProps) {
  return (
    <TableCell align={align}>
      <TableSortLabel
        active={sortColumn === column}
        direction={sortColumn === column ? sortDirection : "asc"}
        hideSortIcon={sortColumn !== column}
        onClick={() => onSort(column)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

export default function NewStatisticsPlayersSection({
  error,
  isLoading,
  players,
}: NewStatisticsPlayersSectionProps) {
  const { t } = useTranslation(["statistics", "common"]);
  const [view, setView] = useState<PlayerStatsView>("offense");
  const [sortColumn, setSortColumn] = useState<SortColumn>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const sortedPlayers = useMemo(
    () => {
      const directionMultiplier = sortDirection === "asc" ? 1 : -1;

      return [...(players ?? [])].sort((left, right) => {
        const leftValue = getSortValue(left, sortColumn);
        const rightValue = getSortValue(right, sortColumn);

        if (typeof leftValue === "string" && typeof rightValue === "string") {
          return leftValue.localeCompare(rightValue) * directionMultiplier;
        }

        return (Number(leftValue) - Number(rightValue)) * directionMultiplier;
      });
    },
    [players, sortColumn, sortDirection]
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortColumn(column);
    setSortDirection(column === "name" ? "asc" : "desc");
  };

  if (isLoading) {
    return <LoadingState showColdStartHint={false} />;
  }

  if (error) {
    return (
      <Alert severity="error">
        {t("common:messages.error")}: {error.message}
      </Alert>
    );
  }

  if (sortedPlayers.length === 0) {
    return <Alert severity="info">{t("statistics:playerStats.noData")}</Alert>;
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        p: { xs: 2, md: 2.5 },
      })}
    >
      <Stack spacing={2}>
        <Stack
          alignItems={{ xs: "stretch", md: "center" }}
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack alignItems="center" direction="row" spacing={1.25}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: theme.colors.newUi.primarySoft,
                borderRadius: 1,
                color: theme.colors.newUi.primary,
                display: "inline-flex",
                height: 40,
                justifyContent: "center",
                width: 40,
              })}
            >
              <GroupsIcon fontSize="small" />
            </Box>
            <Box>
              <Typography fontWeight={900} variant="h6">
                {t("statistics:newUi.players.comparisonTitle")}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {t("statistics:newUi.players.comparisonDescription")}
              </Typography>
            </Box>
          </Stack>

          <ToggleButtonGroup
            aria-label={t("statistics:newUi.players.viewAria")}
            exclusive
            onChange={(_event, nextView: PlayerStatsView | null) => {
              if (nextView) {
                setView(nextView);
              }
            }}
            size="small"
            sx={{
              alignSelf: { xs: "stretch", md: "auto" },
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              "& .MuiToggleButtonGroup-grouped": {
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                whiteSpace: "nowrap",
              },
            }}
            value={view}
          >
            <ToggleButton value="offense">
              {t("statistics:view.offense")}
            </ToggleButton>
            <ToggleButton value="defense">
              {t("statistics:view.defense")}
            </ToggleButton>
            <ToggleButton value="all">{t("statistics:view.all")}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={t("statistics:workflow.playersCount", {
              count: sortedPlayers.length,
            })}
            sx={{ fontWeight: 900 }}
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={t("statistics:newUi.players.sortableColumns")}
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        <TableContainer
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            display: { xs: "none", md: "block" },
            overflowX: "auto",
          })}
        >
          <Table
            aria-label={t("statistics:newUi.players.tableAria")}
            size="small"
          >
              <TableHead>
                <TableRow>
                  <SortableHeader
                    column="name"
                    label={t("statistics:playerStats.playerName")}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
                  <SortableHeader
                    column="time"
                    label={t("statistics:playerStats.playingTime")}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                  />
                  {view === "all" && (
                    <>
                      <SortableHeader
                        align="right"
                        column="points"
                        label={t("statistics:playerStats.pointsPlayed")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="offensePoints"
                        label={t("statistics:playerStats.offensePoints")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="holdRate"
                        label={t("statistics:playerStats.offenseWinRate")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="defensePoints"
                        label={t("statistics:playerStats.defensePoints")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="breakRate"
                        label={t("statistics:playerStats.defenseWinRate")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </>
                  )}
                  {view === "offense" && (
                    <>
                      <SortableHeader
                        align="right"
                        column="offensePoints"
                        label={t("statistics:playerStats.offensePoints")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="holdRate"
                        label={t("statistics:playerStats.offenseWinRate")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="cleanHoldRate"
                        label={t("statistics:playerStats.cleanPoints")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="ourTurnovers"
                        label={t("statistics:teamStats.ourTurnovers")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </>
                  )}
                  {view === "defense" && (
                    <>
                      <SortableHeader
                        align="right"
                        column="defensePoints"
                        label={t("statistics:playerStats.defensePoints")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="turnoverRate"
                        label={t("statistics:teamStats.turnover")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="breakRate"
                        label={t("statistics:playerStats.defenseWinRate")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                      <SortableHeader
                        align="right"
                        column="cleanBreakRate"
                        label={t("statistics:playerStats.cleanBreak")}
                        onSort={handleSort}
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </>
                  )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow key={player.player_id}>
                  <TableCell>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Avatar
                        sx={(theme) => ({
                          bgcolor: theme.colors.newUi.primarySoft,
                          color: theme.colors.newUi.primary,
                          fontSize: 13,
                          fontWeight: 900,
                          height: 32,
                          width: 32,
                        })}
                      >
                        {getInitials(player.player_name)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={850} variant="body2">
                          {player.player_name}
                        </Typography>
                        {player.player_number !== null && (
                          <Typography color="text.secondary" variant="caption">
                            #{player.player_number}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{formatTime(player.effective_time_seconds)}</TableCell>
                  {view === "all" && (
                    <>
                      <TableCell align="right">{player.points_played}</TableCell>
                      <TableCell align="right">
                        {player.offense.points_played}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.offense.hold_rate,
                          player.offense.points_played
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {player.defense.points_played}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.defense.break_rate,
                          player.defense.points_played
                        )}
                      </TableCell>
                    </>
                  )}
                  {view === "offense" && (
                    <>
                      <TableCell align="right">
                        {player.offense.points_played}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.offense.hold_rate,
                          player.offense.points_played
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.offense.clean_hold_rate,
                          player.offense.points_played
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {player.offense.our_turnovers ?? 0}
                      </TableCell>
                    </>
                  )}
                  {view === "defense" && (
                    <>
                      <TableCell align="right">
                        {player.defense.points_played}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.defense.turnover_rate,
                          player.defense.points_played
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.defense.break_rate,
                          player.defense.points_played
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          player.defense.clean_break_rate,
                          player.defense.points_played
                        )}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          aria-label={t("statistics:newUi.players.cardsAria")}
          spacing={1.25}
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          {sortedPlayers.map((player) => (
            <Box
              key={player.player_id}
              sx={(theme) => ({
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 1.5,
              })}
            >
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
                spacing={1.5}
              >
                <Stack alignItems="center" direction="row" spacing={1}>
                  <Avatar
                    sx={(theme) => ({
                      bgcolor: theme.colors.newUi.primarySoft,
                      color: theme.colors.newUi.primary,
                      fontSize: 13,
                      fontWeight: 900,
                      height: 34,
                      width: 34,
                    })}
                  >
                    {getInitials(player.player_name)}
                  </Avatar>
                  <Typography fontWeight={900}>{player.player_name}</Typography>
                </Stack>
                <Chip
                  label={formatTime(player.effective_time_seconds)}
                  size="small"
                  sx={(theme) => ({
                    bgcolor: alpha(theme.colors.newUi.primary, 0.08),
                    color: theme.colors.newUi.primary,
                    fontWeight: 900,
                  })}
                />
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  mt: 1.5,
                }}
              >
                <MobileMetric
                  label={
                    view === "all"
                      ? t("statistics:playerStats.pointsPlayed")
                      : t(
                          view === "defense"
                            ? "statistics:playerStats.defensePoints"
                            : "statistics:playerStats.offensePoints"
                        )
                  }
                  value={
                    view === "all"
                      ? player.points_played
                      : view === "defense"
                      ? player.defense.points_played
                      : player.offense.points_played
                  }
                />
                <MobileMetric
                  label={
                    view === "all"
                      ? t("statistics:playerStats.offensePoints")
                      : t(
                          view === "defense"
                            ? "statistics:playerStats.defenseWinRate"
                            : "statistics:playerStats.offenseWinRate"
                        )
                  }
                  value={
                    view === "all"
                      ? player.offense.points_played
                      : view === "defense"
                      ? formatPercentage(
                          player.defense.break_rate,
                          player.defense.points_played
                        )
                      : formatPercentage(
                          player.offense.hold_rate,
                          player.offense.points_played
                        )
                  }
                />
                <MobileMetric
                  label={
                    view === "all"
                      ? t("statistics:playerStats.defensePoints")
                      : t(
                          view === "defense"
                            ? "statistics:playerStats.cleanBreak"
                            : "statistics:playerStats.cleanPoints"
                        )
                  }
                  value={
                    view === "all"
                      ? player.defense.points_played
                      : view === "defense"
                        ? formatPercentage(
                            player.defense.clean_break_rate,
                            player.defense.points_played
                          )
                        : formatPercentage(
                            player.offense.clean_hold_rate,
                            player.offense.points_played
                          )
                  }
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function MobileMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <Box
      sx={(theme) => ({
        bgcolor: theme.palette.background.default,
        borderRadius: 1,
        p: 1,
      })}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={900}>{value}</Typography>
    </Box>
  );
}
