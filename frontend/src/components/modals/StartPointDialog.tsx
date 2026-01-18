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
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { startPoint } from "../../services/points";
import PlayerSelector from "../points/PlayerSelector";
import type { Player } from "../../types";

interface StartPointDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  players: Player[];
  onSuccess?: () => void;
}

export default function StartPointDialog({
  open,
  onClose,
  gameId,
  players,
  onSuccess,
}: StartPointDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingOnOffense, setStartingOnOffense] = useState<boolean>(true);
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: () =>
      startPoint({
        game_id: gameId,
        starting_on_offense: startingOnOffense,
        player_ids: selectedPlayerIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["activePoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setStartingOnOffense(true);
    startMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (selectedPlayerIds.length === 7) {
      startMutation.mutate();
    }
  };

  const isValid = selectedPlayerIds.length === 7;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Start Point</DialogTitle>
      <DialogContent>
        {startMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(startMutation.error as any)?.response?.data?.detail ||
              "Failed to start point. Please try again."}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Starting</FormLabel>
          <RadioGroup
            value={startingOnOffense ? "offense" : "defense"}
            onChange={(e) => setStartingOnOffense(e.target.value === "offense")}
          >
            <FormControlLabel
              value="offense"
              control={<Radio />}
              label="On Offense (we have the disc)"
            />
            <FormControlLabel
              value="defense"
              control={<Radio />}
              label="On Defense (they have the disc)"
            />
          </RadioGroup>
        </FormControl>

        <PlayerSelector
          players={players}
          selectedIds={selectedPlayerIds}
          onChange={setSelectedPlayerIds}
          required
          error={!isValid && selectedPlayerIds.length > 0}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={startMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || startMutation.isPending}
        >
          {startMutation.isPending ? "Starting..." : "Start Point"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
