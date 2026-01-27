import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import PointPlayerSelection from "../points/PointPlayerSelection";
import type { PointWithPlayers, Player } from "../../types";

interface EditPointDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  players: Player[];
  teamId: number;
  onSuccess?: () => void;
}

export default function EditPointDialog({
  open,
  onClose,
  point,
  players,
  teamId,
  onSuccess,
}: EditPointDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingOnOffense, setStartingOnOffense] = useState(true);
  const [won, setWon] = useState<boolean | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const queryClient = useQueryClient();

  // Initialize form values when point changes
  useEffect(() => {
    if (point) {
      setSelectedPlayerIds(point.players.map((p) => p.id));
      setStartingOnOffense(point.starting_on_offense);
      setWon(point.won);
      setSelectedLineId(""); // Reset line filter
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
    if (selectedPlayerIds.length === 7) {
      updateMutation.mutate();
    }
  };

  const isValid = selectedPlayerIds.length === 7;

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

        {/* Players Section */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Players on the Field
          </Typography>

          <PointPlayerSelection
            teamId={teamId}
            players={players}
            selectedPlayerIds={selectedPlayerIds}
            onSelectedPlayerIdsChange={setSelectedPlayerIds}
            startingOnOffense={startingOnOffense}
            onStartingOnOffenseChange={setStartingOnOffense}
            selectedLineId={selectedLineId}
            onSelectedLineIdChange={setSelectedLineId}
            open={open}
            clearPlayersOnLineChange={false}
            showGenderValidation={false}
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
