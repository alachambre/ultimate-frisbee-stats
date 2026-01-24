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
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: () =>
      updatePoint(scoredPoint.id, {
        status: "completed",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(scoredPoint.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", scoredPoint.game_id] });
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    completeMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Complete Point</DialogTitle>
      <DialogContent>
        {completeMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(completeMutation.error as any)?.response?.data?.detail ||
              "Failed to complete point. Please try again."}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Mark this point as completed? This will finalize the point after any adjustments.
        </Typography>

        {/* Point summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Point #{scoredPoint.point_number}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={
                scoredPoint.starting_on_offense
                  ? "Started on Offense"
                  : "Started on Defense"
              }
              size="small"
              color={scoredPoint.starting_on_offense ? "primary" : "default"}
            />
            <Chip
              label={scoredPoint.won ? "Won" : "Lost"}
              size="small"
              color={scoredPoint.won ? "success" : "error"}
            />
          </Box>
        </Box>

        {/* Strategy if present */}
        {scoredPoint.strategy && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Strategy
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
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? "Completing..." : "Complete Point"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
