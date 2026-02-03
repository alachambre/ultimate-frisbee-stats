import { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Chip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
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
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = Men, 1 = Women

  // Fetch lines for filtering
  const { data: lines = [] } = useQuery({
    queryKey: ["lines", teamId],
    queryFn: () => getLines(teamId),
    enabled: open,
  });

  // Fetch game data to get existing points for ABBA pattern
  const { data: game } = useQuery({
    queryKey: ["game", String(point.game_id)],
    queryFn: () => getGame(point.game_id),
    enabled: open,
  });

  // Fetch live statistics for player highlighting
  const { data: liveStats = [] } = useQuery({
    queryKey: ["liveStats", point.game_id],
    queryFn: () => getLiveGameStatistics(point.game_id),
    enabled: open && game?.status === "started",
  });

  // Calculate required gender ratio based on ABBA pattern
  const requiredGenderRatio = useMemo(() => {
    if (!game?.points || game.points.length === 0) {
      return null;
    }

    // Get completed points sorted by point_number
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => a.point_number - b.point_number);

    if (completedPoints.length === 0) {
      return null;
    }

    // ABBA pattern: A-B-B-A-A-B-B-A...
    const position = point.point_number - 1; // Convert to 0-indexed
    const positionInCycle = position % 4;
    const isPatternA = positionInCycle === 0 || positionInCycle === 3;

    // Determine what "A" ratio is based on the first completed point
    const firstPoint = completedPoints[0];
    const firstPointMen = firstPoint.players.filter((p: Player) => p.gender === "M").length;
    const patternAIsFourMen = firstPointMen === 4;

    // Determine required ratio for this point
    if (isPatternA) {
      return patternAIsFourMen ? { men: 4, women: 3 } : { men: 3, women: 4 };
    } else {
      return patternAIsFourMen ? { men: 3, women: 4 } : { men: 4, women: 3 };
    }
  }, [game, point.point_number]);

  // Count selected by gender
  const selectedMen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "W")
  ).length;

  // Check if current selection is valid
  const isValidSelection = useMemo(() => {
    // Must have exactly 7 players
    if (selectedPlayerIds.length !== 7) {
      return false;
    }

    if (!requiredGenderRatio) {
      // No requirement yet, but still need valid mixity (4M+3W or 3M+4W)
      return (
        (selectedMen === 4 && selectedWomen === 3) ||
        (selectedMen === 3 && selectedWomen === 4)
      );
    }

    return (
      selectedMen === requiredGenderRatio.men &&
      selectedWomen === requiredGenderRatio.women
    );
  }, [requiredGenderRatio, selectedMen, selectedWomen, selectedPlayerIds.length]);

  // Helper function to determine highlight based on playing time
  const getHighlight = (playerId: number): "high" | "low" | null => {
    if (!liveStats || liveStats.length < 5) return null;

    const playerStats = liveStats.find((s) => s.player_id === playerId);
    if (!playerStats) return null;

    // Sort ALL players by time (descending)
    const sortedByTime = [...liveStats].sort((a, b) => b.effective_time_seconds - a.effective_time_seconds);

    // Calculate top/bottom 20% (quintiles)
    const quintileSize = Math.max(1, Math.floor(sortedByTime.length / 5));

    const topThreshold = sortedByTime[quintileSize - 1]?.effective_time_seconds || 0;
    const bottomThreshold = sortedByTime[sortedByTime.length - quintileSize]?.effective_time_seconds || 0;

    // Highlight top 20% players (most playing time)
    if (playerStats.effective_time_seconds > 0 &&
        playerStats.effective_time_seconds >= topThreshold &&
        playerStats.effective_time_seconds > bottomThreshold) {
      return "high";
    }

    // Highlight bottom 20% players (least playing time, including 0)
    if (playerStats.effective_time_seconds <= bottomThreshold) {
      return "low";
    }

    return null;
  };

  // Helper function to get player's playing time formatted as MM:SS
  const getPlayerTime = (playerId: number): string | null => {
    if (!liveStats) return null;
    const playerStats = liveStats.find((s) => s.player_id === playerId);
    if (!playerStats) return null;

    const minutes = Math.floor(playerStats.effective_time_seconds / 60);
    const seconds = playerStats.effective_time_seconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updatePoint(point.id, {
        player_ids: selectedPlayerIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(point.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["activePoint", point.game_id] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    // Reset to point's current players for next time dialog opens
    setSelectedPlayerIds(point.players?.map((p) => p.id) || []);
    setFilterLineId("");
    setActiveTab(0);
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

  // Group filtered players by gender and sort by name
  const menPlayers = filteredPlayers
    .filter((p) => p.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = filteredPlayers
    .filter((p) => p.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));

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
        <Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1 }}>
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
                      color: "white",
                      "& .MuiChip-icon": { color: "white" },
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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="line-filter-label">
            {t("points:dialog.managePlayers.filterByLine")}
          </InputLabel>
          <Select
            labelId="line-filter-label"
            value={filterLineId}
            label={t("points:dialog.managePlayers.filterByLine")}
            onChange={(e) => setFilterLineId(e.target.value as number | "")}
          >
            <MenuItem value="">
              <em>{t("points:dialog.managePlayers.allPlayers")}</em>
            </MenuItem>
            {lines.map((line: LineWithPlayers) => (
              <MenuItem key={line.id} value={line.id}>
                {line.name} ({t("points:dialog.managePlayers.playersCount", { count: line.players.length })})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Validation error */}
        {selectedPlayerIds.length === 7 && !isValidSelection && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("points:dialog.managePlayers.genderError")}
          </Alert>
        )}

        {/* Gender Tabs */}
        <Box sx={{ borderBottom: 2, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{
              sx: {
                height: 3,
                backgroundColor: activeTab === 0 ? theme.colors.men.main : theme.colors.women.main,
              },
            }}
          >
            <Tab
              icon={<MaleIcon />}
              label={t("points:dialog.start.men")}
              iconPosition="start"
              sx={{
                color: theme.colors.men.main,
                fontWeight: "medium",
                "&.Mui-selected": {
                  color: theme.colors.men.main,
                  fontWeight: "bold",
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                },
              }}
            />
            <Tab
              icon={<FemaleIcon />}
              label={t("points:dialog.start.women")}
              iconPosition="start"
              sx={{
                color: theme.colors.women.main,
                fontWeight: "medium",
                "&.Mui-selected": {
                  color: theme.colors.women.main,
                  fontWeight: "bold",
                  backgroundColor: "rgba(56, 189, 248, 0.08)",
                },
              }}
            />
          </Tabs>
        </Box>

        {/* Men Tab Panel */}
        {activeTab === 0 && (
          <List dense sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, mt: 2 }}>
            {menPlayers.map((player) => {
              const highlight = getHighlight(player.id);
              const playTime = getPlayerTime(player.id);
              return (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    onClick={() => togglePlayer(player.id)}
                    dense
                    sx={{
                      borderLeft: highlight
                        ? `3px solid ${highlight === "high" ? theme.palette.success.main : theme.palette.warning.main}`
                        : "3px solid transparent",
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedPlayerIds.includes(player.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          {player.name}
                          {playTime && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                fontStyle: "italic",
                                color: highlight === "high"
                                  ? theme.palette.success.main
                                  : highlight === "low"
                                  ? theme.palette.warning.main
                                  : "text.secondary",
                                fontWeight: highlight ? 500 : 400,
                              }}
                            >
                              ({playTime})
                            </Box>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            {menPlayers.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={t("points:dialog.managePlayers.noMen")}
                  secondary={null}
                />
              </ListItem>
            )}
          </List>
        )}

        {/* Women Tab Panel */}
        {activeTab === 1 && (
          <List dense sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, mt: 2 }}>
            {womenPlayers.map((player) => {
              const highlight = getHighlight(player.id);
              const playTime = getPlayerTime(player.id);
              return (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    onClick={() => togglePlayer(player.id)}
                    dense
                    sx={{
                      borderLeft: highlight
                        ? `3px solid ${highlight === "high" ? theme.palette.success.main : theme.palette.warning.main}`
                        : "3px solid transparent",
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedPlayerIds.includes(player.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <>
                          {player.name}
                          {playTime && (
                            <Box
                              component="span"
                              sx={{
                                ml: 1,
                                fontStyle: "italic",
                                color: highlight === "high"
                                  ? theme.palette.success.main
                                  : highlight === "low"
                                  ? theme.palette.warning.main
                                  : "text.secondary",
                                fontWeight: highlight ? 500 : 400,
                              }}
                            >
                              ({playTime})
                            </Box>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
            {womenPlayers.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={t("points:dialog.managePlayers.noWomen")}
                  secondary={null}
                />
              </ListItem>
            )}
          </List>
        )}
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
