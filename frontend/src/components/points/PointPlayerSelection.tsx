import { useMemo } from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getLines } from "../../services/lines";
import { getLiveGameStatistics } from "../../services/statistics";
import PlayerSelector from "./PlayerSelector";
import type { Player, Line } from "../../types";
import {
  countSelectedPlayersByGender,
  hasValidPointSelection,
} from "../../utils/playerComposition";
import {
  estimateCompletedPointCountFromPlayerStats,
  getGenderScopedPlayerHighlight,
} from "../../utils/playerHighlighting";
import { queryKeys } from "../../utils/queryKeys";

interface PointPlayerSelectionProps {
  gameId?: number;
  teamId: number;
  players: Player[];
  selectedPlayerIds: number[];
  onSelectedPlayerIdsChange: (ids: number[]) => void;
  startingOnOffense: boolean;
  onStartingOnOffenseChange: (value: boolean) => void;
  selectedLineId: number | "";
  onSelectedLineIdChange: (id: number | "") => void;
  open: boolean;
  clearPlayersOnLineChange?: boolean;
  showGenderValidation?: boolean;
  requiredGenderRatio?: { men: number; women: number } | null;
  hideStartingPosition?: boolean;
}

export default function PointPlayerSelection({
  gameId,
  teamId,
  players,
  selectedPlayerIds,
  onSelectedPlayerIdsChange,
  startingOnOffense,
  onStartingOnOffenseChange,
  selectedLineId,
  onSelectedLineIdChange,
  open,
  clearPlayersOnLineChange = false,
  showGenderValidation = false,
  requiredGenderRatio = null,
  hideStartingPosition = false,
}: PointPlayerSelectionProps) {
  const { t } = useTranslation(['points', 'common']);

  // Fetch lines for the team
  const { data: lines } = useQuery({
    queryKey: queryKeys.teamLines(teamId),
    queryFn: () => getLines(teamId),
    enabled: open,
  });

  const { data: liveStats } = useQuery({
    queryKey: queryKeys.liveStats(gameId ?? 0),
    queryFn: () => getLiveGameStatistics(gameId as number),
    enabled: open && typeof gameId === "number",
  });

  const liveStatsByPlayerId = useMemo(
    () => new Map((liveStats ?? []).map((stats) => [stats.player_id, stats])),
    [liveStats]
  );

  const completedPointCount = useMemo(
    () => estimateCompletedPointCountFromPlayerStats(liveStats ?? []),
    [liveStats]
  );

  const getPlayerUsageHighlight = useMemo(() => {
    if (!liveStats || liveStats.length === 0) {
      return undefined;
    }

    return (playerId: number): "high" | "low" | null =>
      getGenderScopedPlayerHighlight(playerId, players, liveStatsByPlayerId, {
        completedPointsPlayed: completedPointCount,
      });
  }, [completedPointCount, liveStats, liveStatsByPlayerId, players]);

  // Filter players based on selected line
  const filteredPlayers = useMemo(() => {
    if (typeof selectedLineId !== "number") {
      return players;
    }

    const selectedLine = lines?.find((line) => line.id === selectedLineId);
    if (!selectedLine || !selectedLine.players) {
      return players;
    }

    const linePlayerIds = selectedLine.players.map((p) => p.id);
    return players.filter((p) => linePlayerIds.includes(p.id));
  }, [players, selectedLineId, lines]);

  // Count selected by gender
  const selectedCounts = useMemo(
    () => countSelectedPlayersByGender(selectedPlayerIds, players),
    [selectedPlayerIds, players]
  );
  const selectedMen = selectedCounts.men;
  const selectedWomen = selectedCounts.women;

  // Check if current selection meets gender requirement
  const meetsGenderRequirement = useMemo(() => {
    if (!showGenderValidation) {
      return true;
    }
    return hasValidPointSelection(selectedPlayerIds, players, requiredGenderRatio);
  }, [
    showGenderValidation,
    requiredGenderRatio,
    selectedPlayerIds,
    players,
  ]);

  const handleLineChange = (lineId: number | "") => {
    onSelectedLineIdChange(lineId);
    if (clearPlayersOnLineChange) {
      onSelectedPlayerIdsChange([]);
    }
  };

  const isValid = showGenderValidation ? meetsGenderRequirement : selectedPlayerIds.length === 7;

  return (
    <>
      {/* Starting Position */}
      {!hideStartingPosition && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('points:dialog.start.pull')}
          </Typography>
          <ToggleButtonGroup
            value={startingOnOffense ? "offense" : "defense"}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                onStartingOnOffenseChange(newValue === "offense");
              }
            }}
            fullWidth
            aria-label="starting on offense or defense"
            sx={(theme) => ({
              "& .MuiToggleButton-root": {
                py: 1.5,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  fontWeight: "bold",
                  color: theme.palette.common.white,
                  "&:hover": {
                    opacity: 0.9,
                  },
                },
                "&.Mui-selected[value='offense']": {
                  backgroundColor: theme.colors.offense.main,
                  "&:hover": {
                    backgroundColor: theme.colors.offense.dark,
                  },
                },
                "&.Mui-selected[value='defense']": {
                  backgroundColor: theme.colors.defense.main,
                  "&:hover": {
                    backgroundColor: theme.colors.defense.dark,
                  },
                },
              },
            })}
          >
            <ToggleButton value="offense" aria-label="on offense">
              <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
              {t('points:tracker.offense')}
            </ToggleButton>
            <ToggleButton value="defense" aria-label="on defense">
              <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
              {t('points:tracker.defense')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Line filter */}
      {lines && lines.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('points:dialog.start.line')}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={t('common:allPlayers')}
              onClick={() => handleLineChange("")}
              color={selectedLineId === "" ? "primary" : "default"}
              variant={selectedLineId === "" ? "filled" : "outlined"}
            />
            {lines.map((line: Line) => (
              <Chip
                key={line.id}
                label={line.name}
                onClick={() => handleLineChange(line.id)}
                color={selectedLineId === line.id ? "primary" : "default"}
                variant={selectedLineId === line.id ? "filled" : "outlined"}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Player selection with count header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t('points:dialog.start.selectPlayers')}{" "}
          <Typography
            component="span"
            variant="body2"
            color={
              selectedPlayerIds.length === 7
                ? showGenderValidation && !meetsGenderRequirement
                  ? "error.main"
                  : "success.main"
                : selectedPlayerIds.length > 0
                ? "warning.main"
                : "text.secondary"
            }
            fontWeight={selectedPlayerIds.length > 0 ? 500 : 400}
          >
            ({selectedPlayerIds.length}/7
            {selectedPlayerIds.length > 0 && `: ${selectedMen}M, ${selectedWomen}W`}
            {selectedPlayerIds.length === 7 &&
              (!showGenderValidation || meetsGenderRequirement) &&
              " ✓"}
            )
          </Typography>
        </Typography>
      </Box>

      <PlayerSelector
        players={[...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name))}
        selectedIds={selectedPlayerIds}
        onChange={onSelectedPlayerIdsChange}
        required
        error={!isValid && selectedPlayerIds.length > 0}
        getHighlight={getPlayerUsageHighlight}
      />
    </>
  );
}
