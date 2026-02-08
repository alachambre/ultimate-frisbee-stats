import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Button, Tooltip } from "@mui/material";
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
}: LivePointActionBarProps) {
  const { t } = useTranslation(["points", "common"]);

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
