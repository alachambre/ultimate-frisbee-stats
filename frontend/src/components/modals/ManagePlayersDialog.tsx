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
} from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import { getGame } from "../../services/games";
import { getLines } from "../../services/lines";
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

  // Group filtered players by gender
  const menPlayers = filteredPlayers.filter((p) => p.gender === "M");
  const womenPlayers = filteredPlayers.filter((p) => p.gender === "W");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("points:dialog.managePlayers.title", "Select Players")}</DialogTitle>
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
                {t("points:dialog.managePlayers.expected", "Expected")}:
              </Typography>
              <Chip
                icon={requiredGenderRatio?.men === 4 ? <MaleIcon /> : <FemaleIcon />}
                label={
                  requiredGenderRatio?.men === 4
                    ? t("points:dialog.start.men", "Men")
                    : t("points:dialog.start.women", "Women")
                }
                size="small"
                sx={{
                  mt: 0.5,
                  bgcolor: requiredGenderRatio?.men === 4 ? theme.colors.men : theme.colors.women,
                  color: "white",
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {requiredGenderRatio?.men || "?"} men, {requiredGenderRatio?.women || "?"} women
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="body2" color="text.secondary">
                {t("points:dialog.managePlayers.selected", "Selected")}:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{
                    color: isValidSelection ? theme.palette.success.main : theme.palette.text.primary
                  }}
                >
                  <Box component="span" sx={{ color: theme.colors.men }}>
                    {selectedMen}M
                  </Box>
                  {" + "}
                  <Box component="span" sx={{ color: theme.colors.women }}>
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
            {t("points:dialog.managePlayers.filterByLine", "Filter by line")}
          </InputLabel>
          <Select
            labelId="line-filter-label"
            value={filterLineId}
            label={t("points:dialog.managePlayers.filterByLine", "Filter by line")}
            onChange={(e) => setFilterLineId(e.target.value as number | "")}
          >
            <MenuItem value="">
              <em>{t("points:dialog.managePlayers.allPlayers", "All players")}</em>
            </MenuItem>
            {lines.map((line: LineWithPlayers) => (
              <MenuItem key={line.id} value={line.id}>
                {line.name} ({line.players.length} players)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Validation error */}
        {selectedPlayerIds.length === 7 && !isValidSelection && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("points:dialog.managePlayers.genderError", "Selected players don't match the required gender composition.")}
          </Alert>
        )}

        {/* Men list */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <MaleIcon sx={{ color: theme.colors.men }} />
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: theme.colors.men }}>
            {t("points:dialog.start.men", "Men")}
          </Typography>
        </Box>
        <List dense sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1, mb: 2 }}>
          {menPlayers.map((player) => (
            <ListItem key={player.id} disablePadding>
              <ListItemButton onClick={() => togglePlayer(player.id)} dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedPlayerIds.includes(player.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={player.name}
                  secondary={player.number ? `#${player.number}` : null}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {menPlayers.length === 0 && (
            <ListItem>
              <ListItemText
                primary={t("points:dialog.managePlayers.noMen", "No men available")}
                secondary={null}
              />
            </ListItem>
          )}
        </List>

        {/* Women list */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <FemaleIcon sx={{ color: theme.colors.women }} />
          <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: theme.colors.women }}>
            {t("points:dialog.start.women", "Women")}
          </Typography>
        </Box>
        <List dense sx={{ bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 1 }}>
          {womenPlayers.map((player) => (
            <ListItem key={player.id} disablePadding>
              <ListItemButton onClick={() => togglePlayer(player.id)} dense>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedPlayerIds.includes(player.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText
                  primary={player.name}
                  secondary={player.number ? `#${player.number}` : null}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {womenPlayers.length === 0 && (
            <ListItem>
              <ListItemText
                primary={t("points:dialog.managePlayers.noWomen", "No women available")}
                secondary={null}
              />
            </ListItem>
          )}
        </List>
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
            ? t("common:action.saving", "Saving...")
            : t("common:action.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
