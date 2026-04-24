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
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { startPoint } from "../../services/points";
import { getGame } from "../../services/games";
import type { PointWithPlayers, FieldSide } from "../../types";
import { queryKeys } from "../../utils/queryKeys";
import { DEFAULT_FIELD_SIDE, inferNextFieldSide } from "../../utils/fieldSide";

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
  const { data: game, isLoading: isGameLoading } = useQuery({
    queryKey: queryKeys.game(gameId),
    queryFn: () => getGame(gameId),
    enabled: open,
  });

  const isFirstPoint = Boolean(game && game.points.length === 0);
  const halftimeTimestampMs = useMemo(() => {
    const halftimeTimestamp = game?.halftime?.halftime_timestamp;
    if (!halftimeTimestamp) {
      return null;
    }
    const parsed = Date.parse(halftimeTimestamp);
    return Number.isNaN(parsed) ? null : parsed;
  }, [game?.halftime?.halftime_timestamp]);
  const hasPointAfterHalftime = useMemo(() => {
    if (!game || halftimeTimestampMs === null) {
      return false;
    }

    return game.points.some((point) => {
      const pointTimestamps = [
        point.created_at,
        point.start_datetime,
        point.end_datetime,
      ].filter((value): value is string => Boolean(value));

      return pointTimestamps.some((timestamp) => {
        const parsed = Date.parse(timestamp);
        return !Number.isNaN(parsed) && parsed > halftimeTimestampMs;
      });
    });
  }, [game, halftimeTimestampMs]);
  const isFirstPointAfterHalftime = Boolean(
    game?.halftime &&
    game.points.length > 0 &&
    !hasPointAfterHalftime
  );
  const requiresFieldSideSelection = isFirstPoint || isFirstPointAfterHalftime;
  const completedPoints = useMemo(
    () =>
      (game?.points ?? [])
        .filter((p: PointWithPlayers) => p.status === "completed")
        .sort((a: PointWithPlayers, b: PointWithPlayers) => b.point_number - a.point_number),
    [game]
  );
  const lastCompletedPoint = completedPoints[0];

  // Compute the correct initial value based on previous point result
  const computedStartingOnOffense = useMemo(() => {
    if (!game?.points || game.points.length === 0) {
      return true; // Default to offense for first point
    }

    if (completedPoints.length > 0) {
      const lastPoint = completedPoints[0];
      // If we won the previous point, we start on defense (opponent gets possession)
      // If we lost the previous point, we start on offense (we get possession back)
      return !lastPoint.won;
    }

    return true; // Default to offense if no completed points
  }, [game, completedPoints]);
  const inferredFieldSide = useMemo(
    () => inferNextFieldSide(lastCompletedPoint) ?? DEFAULT_FIELD_SIDE,
    [lastCompletedPoint]
  );
  const dialogStateKey = `${game?.id ?? "loading"}:${game?.points.length ?? 0}:${game?.halftime?.halftime_timestamp ?? "no-halftime"}:${lastCompletedPoint?.id ?? "no-completed-point"}`;

  const startMutation = useMutation({
    mutationFn: async ({
      startingOnOffense,
      fieldSide,
    }: {
      startingOnOffense: boolean;
      fieldSide: FieldSide;
    }) => {
      // Create point in ready status (no players selected yet)
      const point = await startPoint({
        game_id: gameId,
        starting_on_offense: startingOnOffense,
        field_side: requiresFieldSideSelection ? fieldSide : inferredFieldSide,
      });
      return point;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(gameId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameLiveState(gameId) });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    startMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    startMutation.mutate({
      startingOnOffense: computedStartingOnOffense,
      fieldSide: inferredFieldSide,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>{t("points:dialog.start.title")}</DialogTitle>
      {isGameLoading || !game ? (
        <>
          <DialogContent>
            <Box
              sx={{
                minHeight: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <CircularProgress size={36} />
              <Typography variant="body2" color="text.secondary">
                {t("common:action.loading")}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t("common:action.cancel")}</Button>
            <Button onClick={handleSubmit} variant="contained" disabled>
              {t("points:dialog.start.create", "Create Point")}
            </Button>
          </DialogActions>
        </>
      ) : (
        <StartPointDialogForm
          key={dialogStateKey}
          initialStartingOnOffense={computedStartingOnOffense}
          initialFieldSide={inferredFieldSide}
          requiresFieldSideSelection={requiresFieldSideSelection}
          inferredFieldSide={inferredFieldSide}
          isFirstPointAfterHalftime={isFirstPointAfterHalftime}
          isSubmitting={startMutation.isPending}
          errorMessage={
            (startMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
            null
          }
          onCancel={handleClose}
          onSubmit={({ startingOnOffense, fieldSide }) =>
            startMutation.mutate({ startingOnOffense, fieldSide })
          }
        />
      )}
    </Dialog>
  );
}

interface StartPointDialogFormProps {
  initialStartingOnOffense: boolean;
  initialFieldSide: FieldSide;
  requiresFieldSideSelection: boolean;
  inferredFieldSide: FieldSide;
  isFirstPointAfterHalftime: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (payload: {
    startingOnOffense: boolean;
    fieldSide: FieldSide;
  }) => void;
}

function StartPointDialogForm({
  initialStartingOnOffense,
  initialFieldSide,
  requiresFieldSideSelection,
  inferredFieldSide,
  isFirstPointAfterHalftime,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: StartPointDialogFormProps) {
  const { t } = useTranslation(["points", "common"]);
  const [startingOnOffense, setStartingOnOffense] = useState<boolean>(initialStartingOnOffense);
  const [fieldSide, setFieldSide] = useState<FieldSide>(initialFieldSide);

  const handleSubmit = () => {
    onSubmit({
      startingOnOffense,
      fieldSide: requiresFieldSideSelection ? fieldSide : inferredFieldSide,
    });
  };

  return (
    <>
      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage || t("common:error.generic")}
          </Alert>
        )}

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
            aria-label={t("common:ariaLabel.startingPosition")}
            sx={(theme) => ({
              "& .MuiToggleButton-root": {
                py: 1.5,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  fontWeight: "bold",
                  color: theme.palette.common.white,
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
            <ToggleButton value="offense" aria-label={t("common:ariaLabel.onOffense")}>
              <FlashOnIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:tracker.offense")}
            </ToggleButton>
            <ToggleButton value="defense" aria-label={t("common:ariaLabel.onDefense")}>
              <ShieldIcon sx={{ mr: 1, fontSize: 20 }} />
              {t("points:tracker.defense")}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {requiresFieldSideSelection && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("points:dialog.start.fieldSide")}
            </Typography>
            <ToggleButtonGroup
              value={fieldSide}
              exclusive
              onChange={(_, newValue: FieldSide | null) => {
                if (newValue) {
                  setFieldSide(newValue);
                }
              }}
              fullWidth
              aria-label={t("points:dialog.start.fieldSideAria")}
              sx={(theme) => ({
                mb: 1.5,
                "& .MuiToggleButton-root": {
                  py: 1.25,
                  textTransform: "none",
                  fontWeight: 500,
                  "&.Mui-selected": {
                    fontWeight: "bold",
                    backgroundColor: alpha(theme.palette.primary.main, 0.16),
                    borderColor: alpha(theme.palette.primary.main, 0.45),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.24),
                    },
                  },
                },
              })}
            >
              <ToggleButton value="table_left" aria-label={t("points:dialog.start.endzoneLeft")}>
                {t("points:dialog.start.endzoneLeft")}
              </ToggleButton>
              <ToggleButton value="table_right" aria-label={t("points:dialog.start.endzoneRight")}>
                {t("points:dialog.start.endzoneRight")}
              </ToggleButton>
            </ToggleButtonGroup>

            <Box
              role="img"
              aria-label={t("points:dialog.start.fieldSideGuideAria")}
              sx={(theme) => ({
                position: "relative",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: theme.palette.common.white,
                p: 1.5,
                overflow: "hidden",
              })}
            >
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1.5,
                  bgcolor: theme.palette.common.white,
                  height: 76,
                  overflow: "hidden",
                })}
              >
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: fieldSide === "table_left"
                      ? alpha(theme.palette.primary.main, 0.16)
                      : theme.palette.common.white,
                    color: theme.palette.text.primary,
                    borderRight: 1,
                    borderColor: "divider",
                    transition: "background-color 0.2s ease",
                  })}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("points:dialog.start.sideA")}
                  </Typography>
                </Box>
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: fieldSide === "table_right"
                      ? alpha(theme.palette.primary.main, 0.16)
                      : theme.palette.common.white,
                    color: theme.palette.text.primary,
                    transition: "background-color 0.2s ease",
                  })}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("points:dialog.start.sideB")}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mt: 1.25,
                }}
              >
                <Box
                  sx={(theme) => ({
                    px: 1.25,
                    py: 0.35,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.28),
                  })}
                >
                  <Typography variant="caption" fontWeight={600}>
                    {t("points:dialog.start.scoreTable")}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {t("points:dialog.start.fieldSideHint")}
            </Typography>
            {isFirstPointAfterHalftime && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                {t("points:dialog.start.fieldSideHalftimeHint")}
              </Typography>
            )}
          </Box>
        )}
        {!requiresFieldSideSelection && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
            {t("points:dialog.start.fieldSideAuto", {
              side: inferredFieldSide === "table_left"
                ? t("points:dialog.start.sideA")
                : t("points:dialog.start.sideB"),
            })}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isSubmitting}>
          {t("common:action.cancel")}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting
            ? t("points:dialog.start.starting", "Creating...")
            : t("points:dialog.start.create", "Create Point")}
        </Button>
      </DialogActions>
    </>
  );
}
