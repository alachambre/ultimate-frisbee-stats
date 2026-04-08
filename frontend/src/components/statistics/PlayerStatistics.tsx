import { useState, useMemo } from "react";
import {
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
  ButtonBase,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import AppsIcon from "@mui/icons-material/Apps";
import { useTranslation } from "react-i18next";
import type { PlayerGameStats } from "../../types";
import PlayerStatsCard from "./PlayerStatsCard";

type SortColumn =
  | "name"
  | "time"
  | "offensePoints"
  | "holdRate"
  | "cleanHoldRate"
  | "defensePoints"
  | "turnoverRate"
  | "breakRate"
  | "cleanBreakRate";
type SortDirection = "asc" | "desc";
type TabValue = "offense" | "defense" | "all";

interface PlayerStatisticsProps {
  playerStats: PlayerGameStats[];
  onPlayerClick?: (playerId: number) => void;
}

interface SortOption {
  column: SortColumn;
  direction: SortDirection;
  label: string;
}

interface TableColumn {
  key: SortColumn;
  label: string;
  tooltip?: string;
  align?: "left" | "center";
  render: (stat: PlayerGameStats) => string | number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function formatRateStat(count: number, rate: number, enabled: boolean): string {
  return enabled ? `${count} (${formatPercent(rate)})` : "-";
}

function getValueForSort(stat: PlayerGameStats, column: SortColumn): number | string {
  switch (column) {
    case "name":
      return stat.player_name;
    case "time":
      return stat.effective_time_seconds;
    case "offensePoints":
      return stat.offense.points_played;
    case "holdRate":
      return stat.offense.hold_rate;
    case "cleanHoldRate":
      return stat.offense.clean_hold_rate;
    case "defensePoints":
      return stat.defense.points_played;
    case "turnoverRate":
      return stat.defense.turnover_rate;
    case "breakRate":
      return stat.defense.break_rate;
    case "cleanBreakRate":
      return stat.defense.clean_break_rate;
  }
}

export default function PlayerStatistics({ playerStats, onPlayerClick }: PlayerStatisticsProps) {
  const { t } = useTranslation("statistics");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState<TabValue>("offense");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortOptionsByTab = useMemo<Record<TabValue, SortOption[]>>(
    () => ({
      offense: [
        { column: "name", direction: "asc", label: t("playerStats.sortByName") },
        { column: "time", direction: "desc", label: t("playerStats.sortByTime") },
        {
          column: "offensePoints",
          direction: "desc",
          label: t("playerStats.sortByOffensePoints"),
        },
        { column: "holdRate", direction: "desc", label: t("playerStats.sortByHold") },
        {
          column: "cleanHoldRate",
          direction: "desc",
          label: t("playerStats.sortByCleanHold"),
        },
      ],
      defense: [
        { column: "name", direction: "asc", label: t("playerStats.sortByName") },
        { column: "time", direction: "desc", label: t("playerStats.sortByTime") },
        {
          column: "defensePoints",
          direction: "desc",
          label: t("playerStats.sortByDefensePoints"),
        },
        {
          column: "turnoverRate",
          direction: "desc",
          label: t("playerStats.sortByTurnover"),
        },
        { column: "breakRate", direction: "desc", label: t("playerStats.sortByBreak") },
        {
          column: "cleanBreakRate",
          direction: "desc",
          label: t("playerStats.sortByCleanBreak"),
        },
      ],
      all: [
        { column: "name", direction: "asc", label: t("playerStats.sortByName") },
        { column: "time", direction: "desc", label: t("playerStats.sortByTime") },
        {
          column: "offensePoints",
          direction: "desc",
          label: t("playerStats.sortByOffensePoints"),
        },
        { column: "holdRate", direction: "desc", label: t("playerStats.sortByHold") },
        {
          column: "cleanHoldRate",
          direction: "desc",
          label: t("playerStats.sortByCleanHold"),
        },
        {
          column: "defensePoints",
          direction: "desc",
          label: t("playerStats.sortByDefensePoints"),
        },
        {
          column: "turnoverRate",
          direction: "desc",
          label: t("playerStats.sortByTurnover"),
        },
        { column: "breakRate", direction: "desc", label: t("playerStats.sortByBreak") },
        {
          column: "cleanBreakRate",
          direction: "desc",
          label: t("playerStats.sortByCleanBreak"),
        },
      ],
    }),
    [t]
  );

  const sortOptions = sortOptionsByTab[activeTab];

  const tableColumnsByTab = useMemo<Record<TabValue, TableColumn[]>>(
    () => ({
      offense: [
        {
          key: "time",
          label: t("playerStats.playingTime"),
          align: "center",
          render: (stat) => formatTime(stat.effective_time_seconds),
        },
        {
          key: "offensePoints",
          label: t("playerStats.offensePoints"),
          align: "center",
          render: (stat) => stat.offense.points_played,
        },
        {
          key: "holdRate",
          label: t("playerStats.offenseWinRate"),
          tooltip: t("tooltips.holdRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.offense.points_won,
              stat.offense.hold_rate,
              stat.offense.points_played > 0
            ),
        },
        {
          key: "cleanHoldRate",
          label: t("playerStats.cleanPoints"),
          tooltip: t("tooltips.cleanPointRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.offense.points_won_no_turnover,
              stat.offense.clean_hold_rate,
              stat.offense.points_won > 0
            ),
        },
      ],
      defense: [
        {
          key: "time",
          label: t("playerStats.playingTime"),
          align: "center",
          render: (stat) => formatTime(stat.effective_time_seconds),
        },
        {
          key: "defensePoints",
          label: t("playerStats.defensePoints"),
          align: "center",
          render: (stat) => stat.defense.points_played,
        },
        {
          key: "turnoverRate",
          label: t("playerStats.forcedTurnovers"),
          tooltip: t("tooltips.turnoverRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_with_turnover,
              stat.defense.turnover_rate,
              stat.defense.points_played > 0
            ),
        },
        {
          key: "breakRate",
          label: t("playerStats.defenseWinRate"),
          tooltip: t("tooltips.breakRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_won,
              stat.defense.break_rate,
              stat.defense.points_played > 0
            ),
        },
        {
          key: "cleanBreakRate",
          label: t("playerStats.cleanBreak"),
          tooltip: t("tooltips.cleanBreakRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_won_no_turnover,
              stat.defense.clean_break_rate,
              stat.defense.points_won > 0
            ),
        },
      ],
      all: [
        {
          key: "time",
          label: t("playerStats.playingTime"),
          align: "center",
          render: (stat) => formatTime(stat.effective_time_seconds),
        },
        {
          key: "offensePoints",
          label: t("playerStats.offensePoints"),
          tooltip: t("tooltips.offensePoints"),
          align: "center",
          render: (stat) => stat.offense.points_played,
        },
        {
          key: "holdRate",
          label: t("playerStats.offenseWinRate"),
          tooltip: t("tooltips.holdRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.offense.points_won,
              stat.offense.hold_rate,
              stat.offense.points_played > 0
            ),
        },
        {
          key: "cleanHoldRate",
          label: t("playerStats.cleanPoints"),
          tooltip: t("tooltips.cleanPointRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.offense.points_won_no_turnover,
              stat.offense.clean_hold_rate,
              stat.offense.points_won > 0
            ),
        },
        {
          key: "defensePoints",
          label: t("playerStats.defensePoints"),
          tooltip: t("tooltips.defensePoints"),
          align: "center",
          render: (stat) => stat.defense.points_played,
        },
        {
          key: "turnoverRate",
          label: t("playerStats.forcedTurnovers"),
          tooltip: t("tooltips.turnoverRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_with_turnover,
              stat.defense.turnover_rate,
              stat.defense.points_played > 0
            ),
        },
        {
          key: "breakRate",
          label: t("playerStats.defenseWinRate"),
          tooltip: t("tooltips.breakRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_won,
              stat.defense.break_rate,
              stat.defense.points_played > 0
            ),
        },
        {
          key: "cleanBreakRate",
          label: t("playerStats.cleanBreak"),
          tooltip: t("tooltips.cleanBreakRate"),
          align: "center",
          render: (stat) =>
            formatRateStat(
              stat.defense.points_won_no_turnover,
              stat.defense.clean_break_rate,
              stat.defense.points_won > 0
            ),
        },
      ],
    }),
    [t]
  );

  const tableColumns = tableColumnsByTab[activeTab];

  const sortedPlayerStats = useMemo(() => {
    if (!playerStats) return [];

    const sorted = [...playerStats];
    sorted.sort((a, b) => {
      const aValue = getValueForSort(a, sortColumn);
      const bValue = getValueForSort(b, sortColumn);

      const comparison =
        typeof aValue === "string" && typeof bValue === "string"
          ? aValue.localeCompare(bValue)
          : Number(aValue) - Number(bValue);

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [playerStats, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    const matchingOption = sortOptions.find((option) => option.column === column);
    setSortColumn(column);
    setSortDirection(matchingOption?.direction ?? "asc");
  };

  const renderColumnLabel = (column: TableColumn) => {
    if (!column.tooltip) {
      return <span>{column.label}</span>;
    }

    return (
      <Tooltip title={column.tooltip} arrow>
        <span>{column.label}</span>
      </Tooltip>
    );
  };

  const renderPlayerIdentity = (stat: PlayerGameStats) => {
    const numberLabel = stat.player_number != null ? `#${stat.player_number}` : "-";
    const content = (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Chip label={numberLabel} size="small" sx={{ width: 45 }} />
        <Typography variant="body2">{stat.player_name}</Typography>
      </Box>
    );

    if (!onPlayerClick) {
      return content;
    }

    return (
      <ButtonBase
        onClick={() => onPlayerClick(stat.player_id)}
        sx={{ borderRadius: 1, px: 0.5, py: 0.25 }}
        aria-label={t("page.viewPlayerStatsAria", { playerName: stat.player_name })}
      >
        {content}
      </ButtonBase>
    );
  };

  if (!playerStats || playerStats.length === 0) {
    return (
      <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            mb: 3,
            pb: 1,
            borderBottom: 1,
            borderColor: "divider",
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              left: 0,
              bottom: -1,
              width: 64,
              height: 3,
              borderRadius: 999,
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.75),
            },
          }}
        >
          {t("playerStats.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("playerStats.noData")}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 0.5, sm: 1 }, py: 1 }}>
      <Typography
        variant="h5"
        fontWeight="bold"
        sx={{
          mb: 3,
          pb: 1,
          borderBottom: 1,
          borderColor: "divider",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            left: 0,
            bottom: -1,
            width: 64,
            height: 3,
            borderRadius: 999,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.75),
          },
        }}
      >
        {t("playerStats.title")}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {playerStats.length} {t("playerStats.playersCount")}
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue: TabValue) => {
          setActiveTab(newValue);

          const nextSortOptions = sortOptionsByTab[newValue];
          const sortStillAvailable = nextSortOptions.some((option) => option.column === sortColumn);
          if (!sortStillAvailable) {
            setSortColumn(nextSortOptions[0].column);
            setSortDirection(nextSortOptions[0].direction);
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
              color: (theme) => theme.palette.common.white,
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
              color: (theme) => theme.palette.common.white,
            },
          }}
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AppsIcon fontSize="small" />
              {t("view.all")}
            </Box>
          }
          value="all"
          sx={{
            textTransform: "none",
            "&.Mui-selected": {
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.common.white,
            },
          }}
        />
      </Tabs>

      {isMobile ? (
        <>
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
                {sortOptions.map((option) => (
                  <MenuItem
                    key={`${option.column}-${option.direction}`}
                    value={`${option.column}-${option.direction}`}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={2}>
            {sortedPlayerStats.map((stat) => (
              <Grid key={stat.player_id} size={{ xs: 12 }}>
                <PlayerStatsCard
                  stats={stat}
                  view={activeTab}
                  onClick={onPlayerClick ? () => onPlayerClick(stat.player_id) : undefined}
                />
              </Grid>
            ))}
          </Grid>
        </>
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
                {tableColumns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? "center"}>
                    <TableSortLabel
                      active={sortColumn === column.key}
                      direction={sortColumn === column.key ? sortDirection : "asc"}
                      onClick={() => handleSort(column.key)}
                      hideSortIcon={sortColumn !== column.key}
                    >
                      {renderColumnLabel(column)}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPlayerStats.map((stat) => (
                <TableRow key={stat.player_id} hover>
                  <TableCell>{renderPlayerIdentity(stat)}</TableCell>
                  {tableColumns.map((column) => (
                    <TableCell key={column.key} align={column.align ?? "center"}>
                      {column.render(stat)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
