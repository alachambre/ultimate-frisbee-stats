import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  TextField,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Grid,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Point #{point.point_number}</DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as any)?.response?.data?.detail ||
              "Failed to update point. Please try again."}
          </Alert>
        )}

        {/* Starting Position */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
            Starting
          </Typography>
          <ToggleButtonGroup
            value={startingOnOffense ? "offense" : "defense"}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setStartingOnOffense(newValue === "offense");
              }
            }}
            fullWidth
            aria-label="starting on offense or defense"
            sx={{
              "& .MuiToggleButton-root": {
                py: 1.5,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              },
            }}
          >
            <ToggleButton value="offense" aria-label="on offense">
              <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
              On Offense
            </ToggleButton>
            <ToggleButton value="defense" aria-label="on defense">
              <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
              On Defense
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Outcome (only for completed points) */}
        {point.status === "completed" && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
              Outcome
            </Typography>
            <ToggleButtonGroup
              value={won === null ? "" : won ? "won" : "lost"}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setWon(newValue === "won");
                }
              }}
              fullWidth
              aria-label="point outcome"
              sx={{
                "& .MuiToggleButton-root": {
                  py: 1.5,
                  textTransform: "none",
                  fontWeight: 500,
                  "&.Mui-selected": {
                    fontWeight: "bold",
                    "&:hover": {
                      opacity: 0.9,
                    },
                  },
                  "&.Mui-selected[value='won']": {
                    backgroundColor: "success.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "success.dark",
                    },
                  },
                  "&.Mui-selected[value='lost']": {
                    backgroundColor: "error.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "error.dark",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="won" aria-label="won the point">
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Won
              </ToggleButton>
              <ToggleButton value="lost" aria-label="lost the point">
                <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
                Lost
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Timestamps Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Timing
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: point.status === "completed" ? 6 : 12 }}>
              <TextField
                fullWidth
                label="Start Time"
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {point.status === "completed" && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="End Time"
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
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
              </Grid>
            )}
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Players Section */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Players on the Field
          </Typography>
          <PlayerSelector
            players={[...players].sort((a, b) => a.name.localeCompare(b.name))}
            selectedIds={selectedPlayerIds}
            onChange={setSelectedPlayerIds}
            required
            error={selectedPlayerIds.length > 0 && selectedPlayerIds.length !== 7}
          />
        </Box>
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
