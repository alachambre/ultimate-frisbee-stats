import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import PointTimer from "../points/PointTimer";
import type { PointWithPlayers } from "../../types";

interface FinishPointDialogProps {
  open: boolean;
  onClose: () => void;
  activePoint: PointWithPlayers;
  onSuccess?: () => void;
}

export default function FinishPointDialog({
  open,
  onClose,
  activePoint,
  onSuccess,
}: FinishPointDialogProps) {
  const [won, setWon] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const finishMutation = useMutation({
    mutationFn: () =>
      updatePoint(activePoint.id, {
        won: won!,
        end_datetime: new Date().toISOString(),
        status: "scored",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(activePoint.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", activePoint.game_id] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setWon(null);
    finishMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (won !== null) {
      finishMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Finish Point</DialogTitle>
      <DialogContent>
        {finishMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(finishMutation.error as any)?.response?.data?.detail ||
              "Failed to finish point. Please try again."}
          </Alert>
        )}

        {/* Elapsed Time */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Elapsed Time
          </Typography>
          {activePoint.start_datetime && (
            <PointTimer startDatetime={activePoint.start_datetime} />
          )}
        </Box>

        {/* Starting Position */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Started
          </Typography>
          <Chip
            label={
              activePoint.starting_on_offense
                ? "On Offense (we had the disc)"
                : "On Defense (they had the disc)"
            }
            size="small"
            color={activePoint.starting_on_offense ? "primary" : "default"}
          />
        </Box>

        {/* Players */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Players ({activePoint.players.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {activePoint.players.map((player) => (
              <Chip
                key={player.id}
                label={
                  player.number !== null && player.number !== undefined
                    ? `${player.name} #${player.number}`
                    : player.name
                }
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>

        {/* Outcome */}
        <FormControl component="fieldset" fullWidth required>
          <FormLabel component="legend">Outcome</FormLabel>
          <RadioGroup
            value={won === null ? "" : won ? "won" : "lost"}
            onChange={(e) => setWon(e.target.value === "won")}
          >
            <FormControlLabel
              value="won"
              control={<Radio />}
              label="We won the point"
            />
            <FormControlLabel
              value="lost"
              control={<Radio />}
              label="They won the point"
            />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={finishMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={won === null || finishMutation.isPending}
        >
          {finishMutation.isPending ? "Finishing..." : "Finish Point"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
