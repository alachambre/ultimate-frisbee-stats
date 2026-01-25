import { useState, useMemo } from "react";
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
  Chip,
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startPoint, updatePoint } from "../../services/points";
import { getLines } from "../../services/lines";
import PlayerSelector from "../points/PlayerSelector";
import type { Player, Line } from "../../types";

interface StartPointDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  teamId: number;
  players: Player[];
  onSuccess?: () => void;
}

export default function StartPointDialog({
  open,
  onClose,
  gameId,
  teamId,
  players,
  onSuccess,
}: StartPointDialogProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [startingOnOffense, setStartingOnOffense] = useState<boolean>(true);
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const queryClient = useQueryClient();

  // Fetch lines for the team
  const { data: lines } = useQuery({
    queryKey: ["lines", teamId],
    queryFn: () => getLines(teamId),
    enabled: open,
  });

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

  const startMutation = useMutation({
    mutationFn: async () => {
      // Create point (backend creates with status="ready")
      const point = await startPoint({
        game_id: gameId,
        starting_on_offense: startingOnOffense,
        player_ids: selectedPlayerIds,
      });

      // Immediately transition to "running" status
      const runningPoint = await updatePoint(point.id, { status: "running" });
      return runningPoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setStartingOnOffense(true);
    setSelectedLineId("");
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

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
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

        {/* Line filter */}
        {lines && lines.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Filter by Line (Optional)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                label="All Players"
                onClick={() => {
                  setSelectedLineId("");
                  setSelectedPlayerIds([]);
                }}
                color={selectedLineId === "" ? "primary" : "default"}
                variant={selectedLineId === "" ? "filled" : "outlined"}
              />
              {lines.map((line: Line) => (
                <Chip
                  key={line.id}
                  label={line.name}
                  onClick={() => {
                    setSelectedLineId(line.id);
                    setSelectedPlayerIds([]);
                  }}
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
              color={isValid ? "success.main" : selectedPlayerIds.length > 0 ? "error.main" : "text.secondary"}
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
          error={!isValid && selectedPlayerIds.length > 0}
          showCount={false}
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
