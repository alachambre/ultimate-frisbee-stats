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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startPoint, updatePoint } from "../../services/points";
import { getLines } from "../../services/lines";
import { getGame } from "../../services/games";
import PlayerSelector from "../points/PlayerSelector";
import type { Player, Line, PointWithPlayers } from "../../types";

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

  // Fetch game data to get existing points for ABBA pattern
  const { data: game } = useQuery({
    queryKey: ["game", String(gameId)],
    queryFn: () => getGame(gameId),
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

  // Calculate required gender ratio based on ABBA pattern
  const requiredGenderRatio = useMemo(() => {
    if (!game?.points || game.points.length === 0) {
      // First point - either ratio is acceptable
      return null;
    }

    // Get completed points sorted by point_number
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => a.point_number - b.point_number);

    if (completedPoints.length === 0) {
      // No completed points yet - either ratio is acceptable
      return null;
    }

    // Determine the next point number
    const nextPointNumber = Math.max(...game.points.map((p: PointWithPlayers) => p.point_number)) + 1;

    // ABBA pattern: A-B-B-A-A-B-B-A...
    // Calculate if this point should be "A" or "B"
    // Pattern for point number n (1-based): Math.floor((n - 1) / 2) % 2 === 0 → "A", else "B"
    const isPatternA = Math.floor((nextPointNumber - 1) / 2) % 2 === 0;

    // Determine what "A" ratio is based on the first completed point
    const firstPoint = completedPoints[0];
    const firstPointMen = firstPoint.players.filter((p: Player) => p.gender === "M").length;

    // First point establishes what "A" is (4M+3W or 3M+4W)
    const patternAIsFourMen = firstPointMen === 4;

    // Determine required ratio for this point
    if (isPatternA) {
      return patternAIsFourMen ? { men: 4, women: 3 } : { men: 3, women: 4 };
    } else {
      return patternAIsFourMen ? { men: 3, women: 4 } : { men: 4, women: 3 };
    }
  }, [game]);

  // Check if current selection matches required ratio
  const meetsGenderRequirement = useMemo(() => {
    if (!requiredGenderRatio) {
      // No requirement yet, but still need valid mixity (4M+3W or 3M+4W)
      return selectedPlayerIds.length === 7 &&
             ((selectedMen === 4 && selectedWomen === 3) ||
              (selectedMen === 3 && selectedWomen === 4));
    }

    return selectedMen === requiredGenderRatio.men &&
           selectedWomen === requiredGenderRatio.women;
  }, [requiredGenderRatio, selectedMen, selectedWomen, selectedPlayerIds.length]);

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
    if (selectedPlayerIds.length === 7 && meetsGenderRequirement) {
      startMutation.mutate();
    }
  };

  const isValid = selectedPlayerIds.length === 7 && meetsGenderRequirement;

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

        {/* Gender requirement badge (ABBA rule) */}
        {requiredGenderRatio && (
          <Alert
            severity={
              selectedPlayerIds.length === 7
                ? meetsGenderRequirement
                  ? "success"
                  : "error"
                : "info"
            }
            icon={
              selectedPlayerIds.length === 7 ? (
                meetsGenderRequirement ? (
                  <CheckCircleIcon fontSize="inherit" />
                ) : (
                  <WarningIcon fontSize="inherit" />
                )
              ) : undefined
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="body2" fontWeight={500}>
              ABBA Gender Rule: {requiredGenderRatio.men} Men, {requiredGenderRatio.women} Women Required
            </Typography>
          </Alert>
        )}
        {!requiredGenderRatio && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500}>
              First Point: Select either 4 Men + 3 Women or 3 Men + 4 Women
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This will establish the ABBA pattern for subsequent points
            </Typography>
          </Alert>
        )}

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
              color={
                selectedPlayerIds.length === 7
                  ? meetsGenderRequirement
                    ? "success.main"
                    : "error.main"
                  : selectedPlayerIds.length > 0
                  ? "warning.main"
                  : "text.secondary"
              }
              fontWeight={selectedPlayerIds.length > 0 ? 500 : 400}
            >
              ({selectedPlayerIds.length}/7
              {selectedPlayerIds.length > 0 && `: ${selectedMen}M, ${selectedWomen}W`}
              {selectedPlayerIds.length === 7 && meetsGenderRequirement && " ✓"})
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
