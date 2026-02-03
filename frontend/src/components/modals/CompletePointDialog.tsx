import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import type { PointWithPlayers } from "../../types";

interface CompletePointDialogProps {
  open: boolean;
  onClose: () => void;
  scoredPoint: PointWithPlayers;
  onSuccess?: () => void;
}

export default function CompletePointDialog({
  open,
  onClose,
  scoredPoint,
  onSuccess,
}: CompletePointDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  const queryClient = useQueryClient();

  // Check if point has exactly 7 players
  const playerCount = scoredPoint.players.length;
  const isValid = playerCount === 7;

  const completeMutation = useMutation({
    mutationFn: () =>
      updatePoint(scoredPoint.id, {
        status: "completed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(scoredPoint.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["activePoint", scoredPoint.game_id] });
      queryClient.invalidateQueries({ queryKey: ["liveStats", scoredPoint.game_id] });
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (isValid) {
      completeMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("points:dialog.complete.title")}</DialogTitle>
      <DialogContent>
        {completeMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(completeMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {!isValid && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t("points:dialog.complete.playerCountError", {
              count: playerCount,
              defaultValue: "Cannot complete point: must have exactly 7 players (currently has {{count}})."
            })}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("points:dialog.complete.confirmMessage", "Mark this point as completed? This will finalize the point after any adjustments.")}
        </Typography>

        {/* Point summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t("points:history.point")} #{scoredPoint.point_number}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={
                scoredPoint.starting_on_offense
                  ? `${t("points:history.startedOn")} ${t("points:tracker.offense")}`
                  : `${t("points:history.startedOn")} ${t("points:tracker.defense")}`
              }
              size="small"
              color={scoredPoint.starting_on_offense ? "primary" : "default"}
            />
            <Chip
              label={scoredPoint.won ? t("points:dialog.finish.won") : t("points:dialog.finish.lost")}
              size="small"
              color={scoredPoint.won ? "success" : "error"}
            />
          </Box>
        </Box>

        {/* Strategy if present */}
        {scoredPoint.strategy && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("points:tracker.strategy")}
            </Typography>
            <Chip
              label={scoredPoint.strategy.name}
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={completeMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || completeMutation.isPending}
        >
          {completeMutation.isPending
            ? t("points:dialog.complete.completing", "Completing...")
            : t("points:tracker.complete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
