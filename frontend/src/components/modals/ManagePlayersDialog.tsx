import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Chip,
  Typography,
} from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import { getGame } from "../../services/games";
import PointPlayerSelection from "../points/PointPlayerSelection";
import type { Player, PointWithPlayers } from "../../types";

interface ManagePlayersDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  teamId: number;
  players: Player[];
  onSuccess?: () => void;
}

export default function ManagePlayersDialog({
  open,
  onClose,
  point,
  teamId,
  players,
  onSuccess,
}: ManagePlayersDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | "">("");
  const queryClient = useQueryClient();

  // Initialize selectedPlayerIds from point.players when dialog opens
  useEffect(() => {
    if (open && point.players) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPlayerIds(point.players.map((p) => p.id));
    }
  }, [open, point.players]);

  // Fetch game data to get existing points for ABBA pattern
  const { data: game } = useQuery({
    queryKey: ["game", String(point.game_id)],
    queryFn: () => getGame(point.game_id),
    enabled: open,
  });

  // Calculate required gender ratio based on ABBA pattern
  const requiredGenderRatio = useMemo(() => {
    if (!game?.points || game.points.length === 0) {
      return null;
    }

    // Get completed points sorted by point_number
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => a.point_number - b.point_number);

    if (completedPoints.length === 0) {
      return null;
    }

    // ABBA pattern: A-B-B-A-A-B-B-A...
    const position = point.point_number - 1; // Convert to 0-indexed
    const positionInCycle = position % 4;
    const isPatternA = positionInCycle === 0 || positionInCycle === 3;

    // Determine what "A" ratio is based on the first completed point
    const firstPoint = completedPoints[0];
    const firstPointMen = firstPoint.players.filter((p: Player) => p.gender === "M").length;
    const patternAIsFourMen = firstPointMen === 4;

    // Determine required ratio for this point
    if (isPatternA) {
      return patternAIsFourMen ? { men: 4, women: 3 } : { men: 3, women: 4 };
    } else {
      return patternAIsFourMen ? { men: 3, women: 4 } : { men: 4, women: 3 };
    }
  }, [game, point.point_number]);

  // Count selected by gender
  const selectedMen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "M")
  ).length;
  const selectedWomen = selectedPlayerIds.filter((id) =>
    players.some((p) => p.id === id && p.gender === "W")
  ).length;

  // Check if current selection matches required ratio (when 7 players selected)
  const meetsGenderRequirement = useMemo(() => {
    if (selectedPlayerIds.length !== 7) {
      return true; // No validation for non-7-player selections
    }

    if (!requiredGenderRatio) {
      // No requirement yet, but still need valid mixity (4M+3W or 3M+4W)
      return (
        (selectedMen === 4 && selectedWomen === 3) ||
        (selectedMen === 3 && selectedWomen === 4)
      );
    }

    return (
      selectedMen === requiredGenderRatio.men &&
      selectedWomen === requiredGenderRatio.women
    );
  }, [requiredGenderRatio, selectedMen, selectedWomen, selectedPlayerIds.length]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await updatePoint(point.id, {
        player_ids: selectedPlayerIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(point.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", point.game_id] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setSelectedPlayerIds([]);
    setSelectedLineId("");
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  // Show warning if 7 players selected but doesn't meet ABBA requirement
  const showGenderWarning = selectedPlayerIds.length === 7 && !meetsGenderRequirement;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <span>{t("points:dialog.managePlayers.title", "Select Players")}</span>
        {/* Mixity indicator */}
        {requiredGenderRatio && selectedPlayerIds.length === 7 && (
          <Chip
            icon={requiredGenderRatio.men === 4 ? <MaleIcon /> : <FemaleIcon />}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="caption" fontWeight={500}>
                  {t("points:dialog.start.mixity")}:
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {requiredGenderRatio.men === 4
                    ? t("points:dialog.start.men")
                    : t("points:dialog.start.women")}
                </Typography>
              </Box>
            }
            size="small"
            sx={{
              backgroundColor: showGenderWarning
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
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {showGenderWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t("points:dialog.managePlayers.genderWarning", "Selected players don't match the required ABBA gender ratio.")}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          {t("points:dialog.managePlayers.info", "Select 0-7 players. Exactly 7 players required to complete the point.")}
        </Alert>

        <PointPlayerSelection
          teamId={teamId}
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          onSelectedPlayerIdsChange={setSelectedPlayerIds}
          startingOnOffense={point.starting_on_offense}
          onStartingOnOffenseChange={() => {}} // Read-only
          selectedLineId={selectedLineId}
          onSelectedLineIdChange={setSelectedLineId}
          open={open}
          clearPlayersOnLineChange={false}
          showGenderValidation={false} // We handle validation ourselves
          requiredGenderRatio={null} // Don't show strict requirement in component
          hideStartingPosition={true} // Don't show offense/defense toggle
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending
            ? t("common:action.saving", "Saving...")
            : t("common:action.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
