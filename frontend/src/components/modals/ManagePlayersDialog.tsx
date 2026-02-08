import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonBase,
  Alert,
  Box,
  Chip,
  Collapse,
  Divider,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import { getGame } from "../../services/games";
import { getLines } from "../../services/lines";
import { getLiveGameStatistics } from "../../services/statistics";
import type { Player, PointWithPlayers, LineWithPlayers } from "../../types";
import { getPlayerHighlight } from "../../utils/playerHighlighting";
import {
  countSelectedPlayersByGender,
  getRequiredGenderRatioForPoint,
  hasValidPointSelection,
} from "../../utils/playerComposition";
import { queryKeys } from "../../utils/queryKeys";
import PlayerSelectionList from "../shared/PlayerSelectionList";

interface ManagePlayersDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  teamId: number;
  players: Player[];
  onSuccess?: () => void;
}

export default function ManagePlayersDialog({
  open,
  onClose,
  point,
  teamId,
  players,
  onSuccess,
}: ManagePlayersDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Lazy state initialization from point.players
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(() =>
    point.players?.map((p) => p.id) || []
  );
  const [filterLineId, setFilterLineId] = useState<number | "">("");
  const [isLineFilterExpanded, setIsLineFilterExpanded] = useState(false);

  // Fetch lines for filtering
  const { data: lines = [] } = useQuery({
    queryKey: queryKeys.teamLines(teamId),
    queryFn: () => getLines(teamId),
    enabled: open,
  });

  // Fetch game data to get existing points for ABBA pattern
  const { data: game } = useQuery({
    queryKey: queryKeys.game(point.game_id),
    queryFn: () => getGame(point.game_id),
    enabled: open,
  });

  // Fetch live statistics for player highlighting
  const { data: liveStats = [] } = useQuery({
    queryKey: queryKeys.liveStats(point.game_id),
    queryFn: () => getLiveGameStatistics(point.game_id),
    enabled: open && game?.status === "started",
  });

  // Calculate required gender ratio based on ABBA pattern
  const requiredGenderRatio = useMemo(
    () => getRequiredGenderRatioForPoint(point.point_number, game?.points || []),
    [point.point_number, game?.points]
  );

  // Count selected by gender
  const selectedCounts = useMemo(
    () => countSelectedPlayersByGender(selectedPlayerIds, players),
    [selectedPlayerIds, players]
  );
  const selectedMen = selectedCounts.men;
  const selectedWomen = selectedCounts.women;

  // Check if current selection is valid
  const isValidSelection = useMemo(
    () => hasValidPointSelection(selectedPlayerIds, players, requiredGenderRatio),
    [selectedPlayerIds, players, requiredGenderRatio]
  );

  // Helper function to determine highlight based on playing time
  const getHighlight = (playerId: number): "high" | "low" | null => {
    if (!liveStats || liveStats.length < 5) return null;

    const playerStats = liveStats.find((s) => s.player_id === playerId);
    if (!playerStats) return null;

    return getPlayerHighlight(playerStats, liveStats);
  };

  const getPlayerPoints = (playerId: number): number | null => {
    if (!liveStats) return null;
    const playerStats = liveStats.find((s) => s.player_id === playerId);
    if (!playerStats) return null;
    return playerStats.points_played;
  };

  // Helper function to get compact player time formatted as "X min"
  const getPlayerTime = (playerId: number): string | null => {
    if (!liveStats) return null;
    const playerStats = liveStats.find((s) => s.player_id === playerId);
    if (!playerStats) return null;

    const minutes = Math.floor(playerStats.effective_time_seconds / 60);

    return `${minutes} min`;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updatePoint(point.id, {
        player_ids: selectedPlayerIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(point.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(point.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.liveStats(point.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameTeamStatistics(point.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameStrategyStatistics(point.game_id) });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    // Reset to point's current players for next time dialog opens
    setSelectedPlayerIds(point.players?.map((p) => p.id) || []);
    setFilterLineId("");
    setIsLineFilterExpanded(false);
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  // Filter players by line if selected
  const filteredPlayers = useMemo(() => {
    if (filterLineId === "") {
      return players;
    }
    const line = lines.find((l: LineWithPlayers) => l.id === filterLineId);
    if (!line) {
      return players;
    }
    const linePlayerIds = new Set(line.players.map((p: Player) => p.id));
    return players.filter((p) => linePlayerIds.has(p.id));
  }, [players, lines, filterLineId]);

  const lineFilterOptions = useMemo(
    () => [
      {
        id: "" as const,
        name: t("points:dialog.managePlayers.allPlayers"),
        playerCount: players.length,
      },
      ...lines.map((line: LineWithPlayers) => ({
        id: line.id,
        name: line.name,
        playerCount: line.players.length,
      })),
    ],
    [lines, players.length, t]
  );

  const selectedLineFilterOption = useMemo(
    () =>
      lineFilterOptions.find((option) => option.id === filterLineId) ??
      lineFilterOptions[0],
    [lineFilterOptions, filterLineId]
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("points:dialog.managePlayers.title")}</DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {/* Expected composition - simplified */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {t("points:dialog.managePlayers.expected")}:
              </Typography>
              {requiredGenderRatio ? (
                <>
                  <Chip
                    icon={requiredGenderRatio.men === 4 ? <MaleIcon /> : <FemaleIcon />}
                    label={
                      requiredGenderRatio.men === 4
                        ? t("points:dialog.start.men")
                        : t("points:dialog.start.women")
                    }
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: requiredGenderRatio.men === 4 ? theme.colors.men.main : theme.colors.women.main,
                      color: theme.palette.common.white,
                      "& .MuiChip-icon": { color: theme.palette.common.white },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {requiredGenderRatio.men} {t("common:labels.men").toLowerCase()}, {requiredGenderRatio.women} {t("common:labels.women").toLowerCase()}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  4M+3W or 3M+4W
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" color="text.secondary">
                {t("points:dialog.managePlayers.selected")}:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: isValidSelection ? theme.palette.success.main : theme.palette.text.primary
                  }}
                >
                  <Box component="span" sx={{ color: theme.colors.men.main }}>
                    {selectedMen}M
                  </Box>
                  {" + "}
                  <Box component="span" sx={{ color: theme.colors.women.main }}>
                    {selectedWomen}W
                  </Box>
                </Typography>
                {isValidSelection && <CheckCircleIcon color="success" />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                ({selectedPlayerIds.length}/7)
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Line filter */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "action.hover",
          }}
        >
          <ButtonBase
            onClick={() => setIsLineFilterExpanded((prev) => !prev)}
            sx={{ width: "100%", borderRadius: 1, textAlign: "left" }}
            aria-label={t("points:dialog.managePlayers.filterByLine")}
            aria-expanded={isLineFilterExpanded}
            aria-controls="line-filter-content"
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t("points:dialog.managePlayers.filterByLine")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedLineFilterOption.name} •{" "}
                  {t("points:dialog.managePlayers.playersCount", {
                    count: selectedLineFilterOption.playerCount,
                  })}
                </Typography>
              </Box>
              <ExpandMoreIcon
                sx={{
                  color: "text.secondary",
                  transform: isLineFilterExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: theme.transitions.create("transform", {
                    duration: theme.transitions.duration.shorter,
                  }),
                }}
              />
            </Box>
          </ButtonBase>

          <Collapse in={isLineFilterExpanded} timeout="auto" unmountOnExit id="line-filter-content">
            <Box
              sx={{
                mt: 1.5,
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {lineFilterOptions.map((option) => {
                const isSelected = filterLineId === option.id;

                return (
                  <ButtonBase
                    key={option.id === "" ? "all-players" : option.id}
                    onClick={() => setFilterLineId(option.id)}
                    sx={{
                      width: "100%",
                      borderRadius: 1.5,
                      textAlign: "left",
                    }}
                    aria-pressed={isSelected}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        px: 1.25,
                        py: 1,
                        border: 1,
                        borderRadius: 1.5,
                        borderColor: isSelected ? "primary.main" : "divider",
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.08)
                          : "background.paper",
                        transition: theme.transitions.create(["border-color", "background-color"], {
                          duration: theme.transitions.duration.shorter,
                        }),
                        "&:hover": {
                          borderColor: isSelected ? "primary.main" : "text.primary",
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.14)
                            : "action.hover",
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight={isSelected ? 600 : 500} noWrap>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("points:dialog.managePlayers.playersCount", { count: option.playerCount })}
                      </Typography>
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>
          </Collapse>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Validation error */}
        {selectedPlayerIds.length === 7 && !isValidSelection && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("points:dialog.managePlayers.genderError")}
          </Alert>
        )}

        <Box
          sx={{
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("points:dialog.managePlayers.selectedPlayers")}
          </Typography>
          <PlayerSelectionList
            players={filteredPlayers}
            selectedIds={selectedPlayerIds}
            onToggle={togglePlayer}
            menLabel={t("points:dialog.start.men")}
            womenLabel={t("points:dialog.start.women")}
            emptyMenLabel={t("points:dialog.managePlayers.noMen")}
            emptyWomenLabel={t("points:dialog.managePlayers.noWomen")}
            getHighlight={getHighlight}
            highlightSecondary={false}
            renderPrimary={(player) => (
              <>
                <Box component="span">{player.name}</Box>
                {getPlayerPoints(player.id) !== null && (
                  <Box component="span"> - {getPlayerPoints(player.id)} pts</Box>
                )}
              </>
            )}
            renderSecondary={(player) => getPlayerTime(player.id)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending || !isValidSelection}
        >
          {updateMutation.isPending
            ? t("common:action.saving")
            : t("common:action.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
