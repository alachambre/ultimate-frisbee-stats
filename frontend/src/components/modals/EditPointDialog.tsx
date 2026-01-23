import { useState, useEffect } from "react";
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
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import PlayerSelector from "../points/PlayerSelector";
import type { PointWithPlayers, Player } from "../../types";

interface EditPointDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  players: Player[];
  onSuccess?: () => void;
}

export default function EditPointDialog({
  open,
  onClose,
  point,
  players,
  onSuccess,
}: EditPointDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingOnOffense, setStartingOnOffense] = useState(true);
  const [won, setWon] = useState<boolean | null>(null);
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const queryClient = useQueryClient();

  // Initialize form values when point changes
  useEffect(() => {
    if (point) {
      setSelectedPlayerIds(point.players.map((p) => p.id));
      setStartingOnOffense(point.starting_on_offense);
      setWon(point.won);
      setStartDatetime(
        point.start_datetime
          ? new Date(point.start_datetime).toISOString().slice(0, 16)
          : ""
      );
      setEndDatetime(
        point.end_datetime
          ? new Date(point.end_datetime).toISOString().slice(0, 16)
          : ""
      );
    }
  }, [point]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const updateData: any = {
        starting_on_offense: startingOnOffense,
        player_ids: selectedPlayerIds,
      };

      if (point.status === "completed" && won !== null) {
        updateData.won = won;
      }

      if (startDatetime) {
        updateData.start_datetime = new Date(startDatetime).toISOString();
      }

      if (endDatetime) {
        updateData.end_datetime = new Date(endDatetime).toISOString();
      }

      return updatePoint(point.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(point.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", point.game_id] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    // Validation
    if (selectedPlayerIds.length !== 7) {
      return;
    }

    // Validate end is at or after start if both are provided
    if (startDatetime && endDatetime) {
      const start = new Date(startDatetime);
      const end = new Date(endDatetime);
      if (end < start) {
        return;
      }
    }

    updateMutation.mutate();
  };

  const isValid =
    selectedPlayerIds.length === 7 &&
    (!startDatetime ||
      !endDatetime ||
      new Date(endDatetime) >= new Date(startDatetime));

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Point #{point.point_number}</DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as any)?.response?.data?.detail ||
              "Failed to update point. Please try again."}
          </Alert>
        )}

        {/* Starting Position */}
        <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
          <FormLabel component="legend">Starting</FormLabel>
          <RadioGroup
            value={startingOnOffense ? "offense" : "defense"}
            onChange={(e) => setStartingOnOffense(e.target.value === "offense")}
          >
            <FormControlLabel
              value="offense"
              control={<Radio />}
              label="On Offense"
            />
            <FormControlLabel
              value="defense"
              control={<Radio />}
              label="On Defense"
            />
          </RadioGroup>
        </FormControl>

        {/* Outcome (only for completed points) */}
        {point.status === "completed" && (
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Outcome</FormLabel>
            <RadioGroup
              value={won === null ? "" : won ? "won" : "lost"}
              onChange={(e) => setWon(e.target.value === "won")}
            >
              <FormControlLabel value="won" control={<Radio />} label="We won" />
              <FormControlLabel
                value="lost"
                control={<Radio />}
                label="They won"
              />
            </RadioGroup>
          </FormControl>
        )}

        {/* Timestamps */}
        <TextField
          fullWidth
          label="Start Time"
          type="datetime-local"
          value={startDatetime}
          onChange={(e) => setStartDatetime(e.target.value)}
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />

        {point.status === "completed" && (
          <TextField
            fullWidth
            label="End Time"
            type="datetime-local"
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
            sx={{ mb: 3 }}
            InputLabelProps={{ shrink: true }}
            error={
              !!(startDatetime &&
              endDatetime &&
              new Date(endDatetime) < new Date(startDatetime))
            }
            helperText={
              startDatetime &&
              endDatetime &&
              new Date(endDatetime) < new Date(startDatetime)
                ? "End time cannot be before start time"
                : ""
            }
          />
        )}

        {/* Players */}
        <PlayerSelector
          players={[...players].sort((a, b) => a.name.localeCompare(b.name))}
          selectedIds={selectedPlayerIds}
          onChange={setSelectedPlayerIds}
          required
          error={selectedPlayerIds.length > 0 && selectedPlayerIds.length !== 7}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
