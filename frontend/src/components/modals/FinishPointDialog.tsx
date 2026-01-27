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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import PointTimer from "../points/PointTimer";
import type { PointWithPlayers } from "../../types";

interface FinishPointDialogProps {
  open: boolean;
  onClose: () => void;
  activePoint: PointWithPlayers;
  onSuccess?: () => void;
}

export default function FinishPointDialog({
  open,
  onClose,
  activePoint,
  onSuccess,
}: FinishPointDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  const [won, setWon] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  const finishMutation = useMutation({
    mutationFn: () =>
      updatePoint(activePoint.id, {
        won: won!,
        end_datetime: new Date().toISOString(),
        status: "scored",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(activePoint.game_id)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", activePoint.game_id] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setWon(null);
    finishMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (won !== null) {
      finishMutation.mutate();
    }
  };

  const isOffense = activePoint.starting_on_offense;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {isOffense ? (
            <FlashOnIcon color="primary" />
          ) : (
            <ShieldIcon color="secondary" />
          )}
          Finish {isOffense ? t("points:tracker.offense") : t("points:tracker.defense")} Point
        </Box>
      </DialogTitle>
      <DialogContent>
        {finishMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(finishMutation.error as any)?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {/* Elapsed Time */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t("points:tracker.elapsedTime", "Elapsed Time")}
          </Typography>
          {activePoint.start_datetime && (
            <PointTimer startDatetime={activePoint.start_datetime} />
          )}
        </Box>

        {/* Outcome */}
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t("points:dialog.finish.outcome", "Outcome")}
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
              {t("points:dialog.finish.won", "Won")}
            </ToggleButton>
            <ToggleButton value="lost" aria-label="lost the point">
              <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:dialog.finish.lost", "Lost")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={finishMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={won === null || finishMutation.isPending}
        >
          {finishMutation.isPending
            ? t("points:dialog.finish.finishing", "Finishing...")
            : t("points:tracker.finish", "Finish Point")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
