import { useState, useEffect, useMemo, useRef } from "react";
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
import WarningIcon from "@mui/icons-material/Warning";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import { getTurnoversByPoint } from "../../services/turnovers";
import PointTimer from "../points/PointTimer";
import type { PointWithPlayers, TurnoverWithPlayer } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

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
  const [preselectedWon, setPreselectedWon] = useState<boolean | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const queryClient = useQueryClient();
  const initializedRef = useRef(false);

  // Fetch turnovers for the active point
  const { data: turnovers = [] } = useQuery<TurnoverWithPlayer[]>({
    queryKey: queryKeys.turnovers(activePoint.id),
    queryFn: () => getTurnoversByPoint(activePoint.id),
    enabled: open && !!activePoint.id,
  });

  // Calculate current possession based on starting position and turnovers
  const weHavePossession = useMemo(() => {
    const currentlyHavePossession = (activePoint.starting_on_offense ? 1 : 0) + turnovers.length;
    return currentlyHavePossession % 2 === 1;
  }, [activePoint.starting_on_offense, turnovers.length]);

  // Preselect outcome when dialog opens based on possession
  useEffect(() => {
    if (open && !initializedRef.current) {
      // Only initialize once when dialog opens
      initializedRef.current = true;
      // This is a legitimate use of setState in useEffect for initialization when the dialog opens
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreselectedWon(weHavePossession);
       
      setWon(weHavePossession);
       
      setShowWarning(false);
    } else if (!open) {
      // Reset initialization flag when dialog closes
      initializedRef.current = false;
    }
  }, [open, weHavePossession]);

  const finishMutation = useMutation({
    mutationFn: () =>
      updatePoint(activePoint.id, {
        won: won!,
        end_datetime: new Date().toISOString(),
        status: "scored",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(activePoint.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(activePoint.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.liveStats(activePoint.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameTeamStatistics(activePoint.game_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameStrategyStatistics(activePoint.game_id) });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setWon(null);
    setPreselectedWon(null);
    setShowWarning(false);
    finishMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    if (won !== null) {
      finishMutation.mutate();
    }
  };

  const handleOutcomeChange = (newWon: boolean) => {
    setWon(newWon);
    // Show warning if user changed from the preselected value
    if (preselectedWon !== null && newWon !== preselectedWon) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const isOffense = activePoint.starting_on_offense;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {isOffense ? (
            <FlashOnIcon sx={{ color: (theme) => theme.colors.offense.main }} />
          ) : (
            <ShieldIcon sx={{ color: (theme) => theme.colors.defense.main }} />
          )}
          {t("points:dialog.finish.title")}
        </Box>
      </DialogTitle>
      <DialogContent>
        {finishMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(finishMutation.error as Error & { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        {/* Elapsed Time */}
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t("points:tracker.elapsedTime")}
          </Typography>
          {activePoint.start_datetime && (
            <PointTimer startDatetime={activePoint.start_datetime} />
          )}
        </Box>

        {/* Warning if user changed preselection */}
        {showWarning && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            {t("points:dialog.finish.possessionWarning", "The outcome doesn't match the current possession. A turnover may be missing.")}
          </Alert>
        )}

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
                handleOutcomeChange(newValue === "won");
              }
            }}
            fullWidth
            aria-label={t("common:ariaLabel.pointOutcome")}
            sx={(theme) => ({
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
                  backgroundColor: theme.palette.success.main,
                  color: theme.palette.common.white,
                  "&:hover": {
                    backgroundColor: theme.palette.success.dark,
                  },
                },
                "&.Mui-selected[value='lost']": {
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.common.white,
                  "&:hover": {
                    backgroundColor: theme.palette.error.dark,
                  },
                },
              },
            })}
          >
            <ToggleButton value="won" aria-label={t("common:ariaLabel.wonPoint")}>
              <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:dialog.finish.won")}
            </ToggleButton>
            <ToggleButton value="lost" aria-label={t("common:ariaLabel.lostPoint")}>
              <CancelIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:dialog.finish.lost")}
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
