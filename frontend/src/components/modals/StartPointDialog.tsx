import { useState, useMemo, useEffect } from "react";
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
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { startPoint, updatePoint } from "../../services/points";
import { getGame } from "../../services/games";
import PointPlayerSelection from "../points/PointPlayerSelection";
import type { Player, PointWithPlayers } from "../../types";

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

  // Fetch game data to get existing points for ABBA pattern
  const { data: game } = useQuery({
    queryKey: ["game", String(gameId)],
    queryFn: () => getGame(gameId),
    enabled: open,
  });

  // Preselect offense/defense based on previous point result
  useEffect(() => {
    if (!open || !game?.points || game.points.length === 0) {
      return;
    }

    // Get the most recent completed point
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => b.point_number - a.point_number);

    if (completedPoints.length > 0) {
      const lastPoint = completedPoints[0];
      // If we won the previous point, we start on defense (opponent gets possession)
      // If we lost the previous point, we start on offense (we get possession back)
      setStartingOnOffense(!lastPoint.won);
    }
  }, [open, game]);

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
    // The pattern repeats every 4 points. Using 0-indexed position:
    // pos % 4: 0→A, 1→B, 2→B, 3→A (then repeats)
    const position = nextPointNumber - 1; // Convert to 0-indexed
    const positionInCycle = position % 4;
    const isPatternA = positionInCycle === 0 || positionInCycle === 3;

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

  // Count selected by gender for validation
  const selectedMen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "W")
  ).length;

  // Check if current selection matches required ratio
  const meetsGenderRequirement = useMemo(() => {
    if (!requiredGenderRatio) {
      // No requirement yet, but still need valid mixity (4M+3W or 3M+4W)
      return (
        selectedPlayerIds.length === 7 &&
        ((selectedMen === 4 && selectedWomen === 3) ||
          (selectedMen === 3 && selectedWomen === 4))
      );
    }

    return (
      selectedMen === requiredGenderRatio.men &&
      selectedWomen === requiredGenderRatio.women
    );
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
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <span>Start Point</span>
        {/* Mixity indicator */}
        {requiredGenderRatio && (
          <Chip
            icon={requiredGenderRatio.men === 4 ? <MaleIcon /> : <FemaleIcon />}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="caption" fontWeight={500}>
                  Mixity:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {requiredGenderRatio.men === 4 ? "Men" : "Women"}
                </Typography>
              </Box>
            }
            size="small"
            sx={{
              backgroundColor:
                selectedPlayerIds.length === 7 && !meetsGenderRequirement
                  ? "error.main"
                  : requiredGenderRatio.men === 4
                  ? "primary.main"
                  : "secondary.main",
              color: "white",
              "& .MuiChip-icon": {
                color: "white",
              },
            }}
          />
        )}
      </DialogTitle>
      <DialogContent>
        {startMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(startMutation.error as any)?.response?.data?.detail ||
              "Failed to start point. Please try again."}
          </Alert>
        )}

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
          clearPlayersOnLineChange={true}
          showGenderValidation={true}
          requiredGenderRatio={requiredGenderRatio}
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
