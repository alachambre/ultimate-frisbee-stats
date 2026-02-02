import { useState } from "react";
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
} from "@mui/material";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { startPoint } from "../../services/points";
import { getGame } from "../../services/games";
import type { PointWithPlayers } from "../../types";

interface StartPointDialogProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  onSuccess?: () => void;
}

export default function StartPointDialog({
  open,
  onClose,
  gameId,
  onSuccess,
}: StartPointDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  const queryClient = useQueryClient();

  // Fetch game data to get existing points
  const { data: game } = useQuery({
    queryKey: ["game", String(gameId)],
    queryFn: () => getGame(gameId),
    enabled: open,
  });

  // Lazy state initialization: calculate default based on previous point result
  // This only runs once on mount, avoiding the need for useEffect
  const [startingOnOffense, setStartingOnOffense] = useState<boolean>(() => {
    if (!game?.points || game.points.length === 0) {
      return true; // Default to offense for first point
    }

    // Get the most recent completed point
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => b.point_number - a.point_number);

    if (completedPoints.length > 0) {
      const lastPoint = completedPoints[0];
      // If we won the previous point, we start on defense (opponent gets possession)
      // If we lost the previous point, we start on offense (we get possession back)
      return !lastPoint.won;
    }

    return true; // Default to offense if no completed points
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      // Create point in ready status (no players selected yet)
      const point = await startPoint({
        game_id: gameId,
        starting_on_offense: startingOnOffense,
      });
      return point;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setStartingOnOffense(true);
    startMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    startMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("points:dialog.start.title")}</DialogTitle>
      <DialogContent>
        {startMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(startMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {/* Starting Position */}
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t("points:dialog.start.pull")}
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
            sx={(theme) => ({
              "& .MuiToggleButton-root": {
                py: 1.5,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  fontWeight: "bold",
                  color: "white",
                  "&:hover": {
                    opacity: 0.9,
                  },
                },
                "&.Mui-selected[value='offense']": {
                  backgroundColor: theme.colors.offense.main,
                  "&:hover": {
                    backgroundColor: theme.colors.offense.dark,
                  },
                },
                "&.Mui-selected[value='defense']": {
                  backgroundColor: theme.colors.defense.main,
                  "&:hover": {
                    backgroundColor: theme.colors.defense.dark,
                  },
                },
              },
            })}
          >
            <ToggleButton value="offense" aria-label="on offense">
              <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:tracker.offense")}
            </ToggleButton>
            <ToggleButton value="defense" aria-label="on defense">
              <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:tracker.defense")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          {t("points:dialog.start.selectPlayersLater", "Players can be selected after creating the point.")}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={startMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={startMutation.isPending}
        >
          {startMutation.isPending
            ? t("points:dialog.start.starting", "Creating...")
            : t("points:dialog.start.create", "Create Point")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
