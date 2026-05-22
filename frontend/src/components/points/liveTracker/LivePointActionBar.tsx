import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import GroupIcon from "@mui/icons-material/Group";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Button, Tooltip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import type { MouseEvent } from "react";
import type { PointWithPlayers } from "../../../types";

interface LivePointActionBarProps {
  currentPoint: PointWithPlayers;
  hasPendingStoppage: boolean;
  isLaunchPullPending: boolean;
  onLaunchPull: () => void;
  isRestartPending: boolean;
  onRestartPoint: () => void;
  onOpenFinish: () => void;
  onOpenRecordStoppage: () => void;
  onOpenRecordTurnover: () => void;
  onOpenResume: () => void;
  onOpenComplete: () => void;
  onOpenMoreActions: (event: MouseEvent<HTMLButtonElement>) => void;
  onOpenManagePlayers?: () => void;
  variant?: "classic" | "field";
}

export function LivePointActionBar({
  currentPoint,
  hasPendingStoppage,
  isLaunchPullPending,
  onLaunchPull,
  isRestartPending,
  onRestartPoint,
  onOpenFinish,
  onOpenRecordStoppage,
  onOpenRecordTurnover,
  onOpenResume,
  onOpenComplete,
  onOpenMoreActions,
  onOpenManagePlayers,
  variant = "classic",
}: LivePointActionBarProps) {
  const { t } = useTranslation(["points", "common"]);
  const accentOutlinedSx: SxProps<Theme> = {
    borderColor: (theme) =>
      currentPoint.starting_on_offense
        ? theme.colors.offense.main
        : theme.colors.defense.main,
    color: (theme) =>
      currentPoint.starting_on_offense
        ? theme.colors.offense.main
        : theme.colors.defense.main,
    "&:hover": {
      borderColor: (theme) =>
        currentPoint.starting_on_offense
          ? theme.colors.offense.dark
          : theme.colors.defense.dark,
    },
  };

  if (variant === "field") {
    const fieldButtonSx = {
      minHeight: 44,
      flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 auto" },
    };

    return (
      <Box
        sx={{
          bgcolor: "background.paper",
          borderColor: "divider",
          borderTop: { xs: 1, sm: 0 },
          bottom: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: { xs: "stretch", sm: "center" },
          mt: 2,
          mx: { xs: -2, sm: 0 },
          pb: { xs: 1, sm: 0 },
          position: { xs: "sticky", sm: "static" },
          pt: { xs: 1.5, sm: 0 },
          px: { xs: 2, sm: 0 },
          zIndex: 1,
        }}
      >
        {currentPoint.status === "ready" && (
          <Button
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            onClick={onLaunchPull}
            disabled={isLaunchPullPending}
            sx={{
              ...fieldButtonSx,
              bgcolor: (theme) =>
                currentPoint.starting_on_offense
                  ? theme.colors.offense.main
                  : theme.colors.defense.main,
              "&:hover": {
                bgcolor: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.dark
                    : theme.colors.defense.dark,
              },
            }}
          >
            {isLaunchPullPending
              ? t("points:tracker.launching", "Launching...")
              : t("points:tracker.launchPull", "Launch Pull")}
          </Button>
        )}

        {currentPoint.status === "running" && hasPendingStoppage && (
          <Button
            variant="contained"
            color="warning"
            startIcon={<PlayArrowIcon />}
            onClick={onOpenResume}
            sx={fieldButtonSx}
          >
            {t("points:tracker.resume", "Resume")}
          </Button>
        )}

        {currentPoint.status === "running" && !hasPendingStoppage && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={onOpenFinish}
              sx={{
                ...fieldButtonSx,
                flex: { xs: "1 1 100%", sm: "0 0 auto" },
              }}
            >
              {t("points:tracker.finishPoint", "Finish point")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={onOpenRecordTurnover}
              sx={{ ...fieldButtonSx, ...accentOutlinedSx }}
            >
              {t("points:recordTurnover", "Record Turnover")}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PauseCircleIcon />}
              onClick={onOpenRecordStoppage}
              sx={{ ...fieldButtonSx, ...accentOutlinedSx }}
            >
              {t("points:recordCall", "Record stoppage")}
            </Button>
          </>
        )}

        {currentPoint.status === "scored" && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<DoneAllIcon />}
              onClick={onOpenComplete}
              sx={fieldButtonSx}
            >
              {t("points:tracker.complete", "Complete Point")}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestartAltIcon />}
              onClick={onRestartPoint}
              disabled={isRestartPending}
              sx={fieldButtonSx}
            >
              {isRestartPending
                ? t("points:tracker.resuming", "Resuming...")
                : t("points:tracker.resume", "Resume Point")}
            </Button>
          </>
        )}

        <Button
          variant="outlined"
          startIcon={<GroupIcon />}
          onClick={onOpenManagePlayers}
          disabled={!onOpenManagePlayers}
          sx={{ ...fieldButtonSx, ...accentOutlinedSx }}
        >
          {t("points:tracker.line", "Line")}
        </Button>
        <Button
          variant="outlined"
          startIcon={<MoreVertIcon />}
          onClick={onOpenMoreActions}
          sx={{ ...fieldButtonSx, ...accentOutlinedSx }}
        >
          {t("points:tracker.more", "More")}
        </Button>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" gap={2} mt={3} flexWrap="wrap">
      {currentPoint.status === "ready" ? (
        <>
          <Button
            variant="contained"
            startIcon={<RocketLaunchIcon />}
            onClick={onLaunchPull}
            disabled={isLaunchPullPending}
            size="large"
            sx={{
              bgcolor: (theme) =>
                currentPoint.starting_on_offense
                  ? theme.colors.offense.main
                  : theme.colors.defense.main,
              "&:hover": {
                bgcolor: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.dark
                    : theme.colors.defense.dark,
              },
            }}
          >
            {isLaunchPullPending
              ? t("points:tracker.launching", "Launching...")
              : t("points:tracker.launchPull", "Launch Pull")}
          </Button>
          <Tooltip title={t("common:action.moreActions", "More Actions")}>
            <Button
              variant="outlined"
              onClick={onOpenMoreActions}
              aria-label={t("common:action.moreActions", "More Actions")}
              sx={{
                minWidth: "auto",
                px: 2,
                borderColor: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
                "&:hover": {
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.dark
                      : theme.colors.defense.dark,
                },
              }}
            >
              <MoreVertIcon />
            </Button>
          </Tooltip>
        </>
      ) : currentPoint.status === "running" ? (
        hasPendingStoppage ? (
          <>
            <Tooltip title={t("points:tracker.resume", "Resume")}>
              <Button
                variant="contained"
                color="warning"
                onClick={onOpenResume}
                aria-label={t("points:tracker.resume", "Resume")}
                sx={{ minWidth: "auto", px: 2 }}
              >
                <PlayArrowIcon />
              </Button>
            </Tooltip>
            <Tooltip title={t("common:action.moreActions", "More Actions")}>
              <Button
                variant="outlined"
                onClick={onOpenMoreActions}
                aria-label={t("common:action.moreActions", "More Actions")}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  color: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  "&:hover": {
                    borderColor: (theme) =>
                      currentPoint.starting_on_offense
                        ? theme.colors.offense.dark
                        : theme.colors.defense.dark,
                  },
                }}
              >
                <MoreVertIcon />
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title={t("points:tracker.finish", "Finish Point")}>
              <Button
                variant="outlined"
                color="success"
                onClick={onOpenFinish}
                aria-label={t("points:tracker.finish", "Finish Point")}
                sx={{ minWidth: "auto", px: 2 }}
              >
                <CheckCircleIcon />
              </Button>
            </Tooltip>
            <Tooltip title={t("points:recordCall", "Record stoppage")}>
              <Button
                variant="outlined"
                onClick={onOpenRecordStoppage}
                aria-label={t("points:recordCall", "Record stoppage")}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  color: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  "&:hover": {
                    borderColor: (theme) =>
                      currentPoint.starting_on_offense
                        ? theme.colors.offense.dark
                        : theme.colors.defense.dark,
                  },
                }}
              >
                <PauseCircleIcon />
              </Button>
            </Tooltip>
            <Tooltip title={t("points:recordTurnover", "Record Turnover")}>
              <Button
                variant="outlined"
                onClick={onOpenRecordTurnover}
                aria-label={t("points:recordTurnover", "Record Turnover")}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  color: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  "&:hover": {
                    borderColor: (theme) =>
                      currentPoint.starting_on_offense
                        ? theme.colors.offense.dark
                        : theme.colors.defense.dark,
                  },
                }}
              >
                <SwapHorizIcon />
              </Button>
            </Tooltip>
            <Tooltip title={t("common:action.moreActions", "More Actions")}>
              <Button
                variant="outlined"
                onClick={onOpenMoreActions}
                aria-label={t("common:action.moreActions", "More Actions")}
                sx={{
                  minWidth: "auto",
                  px: 2,
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  color: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main,
                  "&:hover": {
                    borderColor: (theme) =>
                      currentPoint.starting_on_offense
                        ? theme.colors.offense.dark
                        : theme.colors.defense.dark,
                  },
                }}
              >
                <MoreVertIcon />
              </Button>
            </Tooltip>
          </>
        )
      ) : (
        <>
          <Tooltip title={t("points:tracker.complete", "Complete Point")}>
            <Button
              variant="outlined"
              color="success"
              onClick={onOpenComplete}
              aria-label={t("points:tracker.complete", "Complete Point")}
              sx={{ minWidth: "auto", px: 2 }}
            >
              <DoneAllIcon />
            </Button>
          </Tooltip>
          <Tooltip
            title={
              isRestartPending
                ? t("points:tracker.resuming", "Resuming...")
                : t("points:tracker.resume", "Resume Point")
            }
          >
            <span>
              <Button
                variant="outlined"
                color="warning"
                onClick={onRestartPoint}
                disabled={isRestartPending}
                aria-label={
                  isRestartPending
                    ? t("points:tracker.resuming", "Resuming...")
                    : t("points:tracker.resume", "Resume Point")
                }
                sx={{ minWidth: "auto", px: 2 }}
              >
                <RestartAltIcon />
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={t("common:action.moreActions", "More Actions")}>
            <Button
              variant="outlined"
              onClick={onOpenMoreActions}
              aria-label={t("common:action.moreActions", "More Actions")}
              sx={{
                minWidth: "auto",
                px: 2,
                borderColor: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
                color: (theme) =>
                  currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main,
                "&:hover": {
                  borderColor: (theme) =>
                    currentPoint.starting_on_offense
                      ? theme.colors.offense.dark
                      : theme.colors.defense.dark,
                },
              }}
            >
              <MoreVertIcon />
            </Button>
          </Tooltip>
        </>
      )}
    </Box>
  );
}
