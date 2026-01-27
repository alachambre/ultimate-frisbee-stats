import { useState, useEffect, useMemo } from "react";
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
  Chip,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updatePoint } from "../../services/points";
import { getLines } from "../../services/lines";
import PlayerSelector from "../points/PlayerSelector";
import type { PointWithPlayers, Player, Line } from "../../types";

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

  // Fetch lines for the team
  const { data: lines } = useQuery({
    queryKey: ["lines", teamId],
    queryFn: () => getLines(teamId),
    enabled: open,
  });

  // Initialize form values when point changes
  useEffect(() => {
    if (point) {
      setSelectedPlayerIds(point.players.map((p) => p.id));
      setStartingOnOffense(point.starting_on_offense);
      setWon(point.won);
      setSelectedLineId(""); // Reset line filter
    }
  }, [point]);

  // Filter players based on selected line
  const filteredPlayers = useMemo(() => {
    if (typeof selectedLineId !== "number") {
      return players;
    }

    // Find the selected line and get its player IDs
    const selectedLine = lines?.find((line) => line.id === selectedLineId);
    if (!selectedLine || !selectedLine.players) {
      return players;
    }

    const linePlayerIds = selectedLine.players.map((p) => p.id);
    return players.filter((p) => linePlayerIds.includes(p.id));
  }, [players, selectedLineId, lines]);

  // Count selected by gender
  const selectedMen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "W")
  ).length;

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

        {/* Players Section */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            Players on the Field
          </Typography>

          {/* Line filter */}
          {lines && lines.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Filter by Line (Optional)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  label="All Players"
                  onClick={() => setSelectedLineId("")}
                  color={selectedLineId === "" ? "primary" : "default"}
                  variant={selectedLineId === "" ? "filled" : "outlined"}
                />
                {lines.map((line: Line) => (
                  <Chip
                    key={line.id}
                    label={line.name}
                    onClick={() => setSelectedLineId(line.id)}
                    color={selectedLineId === line.id ? "primary" : "default"}
                    variant={selectedLineId === line.id ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Player selection with count header */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select 7 Players{" "}
              <Typography
                component="span"
                variant="body2"
                color={
                  selectedPlayerIds.length === 7
                    ? "success.main"
                    : selectedPlayerIds.length > 0
                    ? "warning.main"
                    : "text.secondary"
                }
                fontWeight={selectedPlayerIds.length > 0 ? 500 : 400}
              >
                ({selectedPlayerIds.length}/7
                {selectedPlayerIds.length > 0 && `: ${selectedMen}M, ${selectedWomen}W`})
              </Typography>
            </Typography>
          </Box>

          <PlayerSelector
            players={[...filteredPlayers].sort((a, b) => a.name.localeCompare(b.name))}
            selectedIds={selectedPlayerIds}
            onChange={setSelectedPlayerIds}
            required
            error={selectedPlayerIds.length > 0 && selectedPlayerIds.length !== 7}
            showCount={false}
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
