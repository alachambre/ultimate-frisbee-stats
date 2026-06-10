import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import GroupIcon from "@mui/icons-material/Group";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { Box, Button, Tooltip } from "@mui/material";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTranslation } from "react-i18next";
import type { MouseEvent, ReactNode } from "react";
import type { PointWithPlayers } from "../../../types";

interface LivePointActionBarProps {
  currentPoint: PointWithPlayers;
  hasPendingStoppage: boolean;
  hasValidPlayerComposition?: boolean;
  isLaunchPullPending: boolean;
  isUpdatePullPending?: boolean;
  onLaunchPull: () => void;
  onMarkPullInbounds?: () => void;
  onMarkPullOutOfBounds?: () => void;
  isRestartPending: boolean;
  onRestartPoint: () => void;
  onOpenFinish: () => void;
  onOpenRecordStoppage: () => void;
  onOpenRecordTurnover: () => void;
  onOpenResume: () => void;
  onOpenComplete: () => void;
  onOpenMoreActions: (event: MouseEvent<HTMLButtonElement>) => void;
  onOpenManagePlayers?: () => void;
  onOpenStrategy?: () => void;
  onOpenComment?: () => void;
  showPullResolution?: boolean;
  variant?: "classic" | "field";
}

export function LivePointActionBar({
  currentPoint,
  hasPendingStoppage,
  hasValidPlayerComposition,
  isLaunchPullPending,
  isUpdatePullPending = false,
  onLaunchPull,
  onMarkPullInbounds,
  onMarkPullOutOfBounds,
  isRestartPending,
  onRestartPoint,
  onOpenFinish,
  onOpenRecordStoppage,
  onOpenRecordTurnover,
  onOpenResume,
  onOpenComplete,
  onOpenMoreActions,
  onOpenManagePlayers,
  onOpenStrategy,
  onOpenComment,
  showPullResolution = false,
  variant = "classic",
}: LivePointActionBarProps) {
  const { t } = useTranslation(["points", "common"]);
  const theme = useTheme();
  const isMobileActionLayout = useMediaQuery(theme.breakpoints.down("sm"));
  const accentOutlinedSx: SxProps<Theme> = {
    borderColor: (theme) => theme.colors.newUi.primary,
    color: (theme) => theme.colors.newUi.primary,
    "&:hover": {
      bgcolor: (theme) => theme.colors.newUi.primarySoft,
      borderColor: (theme) => theme.colors.newUi.primary,
    },
  };

  if (variant === "field") {
    const fieldDeckSx = {
      bgcolor: "background.paper",
      bottom: 0,
      boxShadow: { xs: 3, sm: 0 },
      display: "flex",
      flexDirection: "column",
      gap: 1,
      mt: 2,
      mx: { xs: -2, sm: 0 },
      pb: { xs: 1, sm: 0 },
      position: { xs: "sticky", sm: "static" },
      pt: { xs: 1.5, sm: 0 },
      px: { xs: 2, sm: 0 },
      zIndex: 1,
    } satisfies SxProps<Theme>;
    const fieldPrimaryRowSx = {
      display: "flex",
      width: "100%",
    } satisfies SxProps<Theme>;
    const fieldSetupRowSx = {
      display: "grid",
      gap: 1,
      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
      width: "100%",
    } satisfies SxProps<Theme>;
    const fieldSetupButtonSx = {
      fontWeight: 800,
      minHeight: 52,
      minWidth: 0,
      px: 2,
      whiteSpace: "nowrap",
      "& .MuiButton-startIcon": {
        mr: 1,
      },
    } satisfies SxProps<Theme>;
    const fieldPullButtonSx = {
      minHeight: 52,
      minWidth: 0,
      px: 2,
      whiteSpace: "nowrap",
      "& .MuiButton-startIcon": {
        mr: 1,
      },
    } satisfies SxProps<Theme>;
    const fieldSecondaryRowSx = {
      display: "flex",
      flexWrap: "nowrap",
      gap: { xs: 0.75, sm: 1 },
      justifyContent: { xs: "space-between", sm: "center" },
      minWidth: 0,
      overflowX: "auto",
      scrollbarWidth: "none",
      width: "100%",
      "&::-webkit-scrollbar": {
        display: "none",
      },
    } satisfies SxProps<Theme>;
    const fieldPrimaryButtonSx = {
      flex: "1 1 100%",
      minHeight: 56,
      minWidth: 0,
      px: { xs: 2, sm: 2.5 },
      whiteSpace: "nowrap",
      "& .MuiButton-startIcon": {
        mr: 1,
      },
    } satisfies SxProps<Theme>;
    const fieldSecondaryButtonSx = {
      minHeight: 44,
      minWidth: 0,
      px: { xs: 0.75, sm: 1.5 },
      whiteSpace: "nowrap",
      width: "100%",
      "& .MuiButton-startIcon": {
        mr: { xs: 0.5, sm: 1 },
      },
    } satisfies SxProps<Theme>;
    const fieldSecondaryButtonWrapperSx = {
      display: "flex",
      flex: { xs: "1 1 0", sm: "0 0 auto" },
      minWidth: { xs: 74, sm: 96 },
    } satisfies SxProps<Theme>;

    const renderFieldSecondaryButton = ({
      actionKey,
      label,
      icon,
      onClick,
      disabled = false,
      color,
      showLabelOnMobile = false,
    }: {
      actionKey: string;
      label: string;
      icon: ReactNode;
      onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
      disabled?: boolean;
      color?: "success" | "warning";
      showLabelOnMobile?: boolean;
    }) => {
      const shouldRenderLabel = showLabelOnMobile || !isMobileActionLayout;

      return (
        <Tooltip key={actionKey} title={label}>
          <Box component="span" sx={fieldSecondaryButtonWrapperSx}>
            <Button
              variant="outlined"
              color={color}
              startIcon={icon}
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              sx={
                color
                  ? fieldSecondaryButtonSx
                  : [fieldSecondaryButtonSx, accentOutlinedSx]
              }
            >
              <Box
                component="span"
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {shouldRenderLabel ? label : null}
              </Box>
            </Button>
          </Box>
        </Tooltip>
      );
    };

    const primaryAction =
      currentPoint.status === "ready" ? (
        <Button
          variant="contained"
          startIcon={<RocketLaunchIcon />}
          onClick={onLaunchPull}
          disabled={isLaunchPullPending}
          aria-label={
            isLaunchPullPending
              ? t("points:tracker.launching", "Launching...")
              : t("points:tracker.launchPull", "Launch Pull")
          }
          sx={{
            ...fieldPrimaryButtonSx,
            bgcolor: (theme) => theme.colors.newUi.primary,
            "&:hover": {
              bgcolor: (theme) => theme.colors.newUi.primary,
            },
          }}
        >
          {isLaunchPullPending
            ? t("points:tracker.launching", "Launching...")
            : t("points:tracker.launchPull", "Launch Pull")}
        </Button>
      ) : currentPoint.status === "running" && hasPendingStoppage ? (
        <Button
          variant="contained"
          color="warning"
          startIcon={<PlayArrowIcon />}
          onClick={onOpenResume}
          aria-label={t("points:tracker.resume", "Resume")}
          sx={fieldPrimaryButtonSx}
        >
          {t("points:tracker.resume", "Resume")}
        </Button>
      ) : currentPoint.status === "running" ? (
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircleIcon />}
          onClick={onOpenFinish}
          aria-label={t("points:tracker.finishPoint", "Finish point")}
          sx={fieldPrimaryButtonSx}
        >
          {t("points:tracker.finishPoint", "Finish point")}
        </Button>
      ) : currentPoint.status === "scored" ? (
        <Button
          variant="contained"
          color="success"
          startIcon={<DoneAllIcon />}
          onClick={onOpenComplete}
          aria-label={t("points:tracker.complete", "Complete Point")}
          sx={fieldPrimaryButtonSx}
        >
          {t("points:tracker.complete", "Complete Point")}
        </Button>
      ) : null;

    const hasCompleteLine =
      hasValidPlayerComposition ?? currentPoint.players.length >= 7;
    const isLineIncomplete = !hasCompleteLine;
    const isStrategyMissing = !currentPoint.strategy;
    const playerActionLabel = t("points:tracker.selectPlayers", "Players");
    const strategyActionLabel = t("points:tracker.selectStrategy", "Strategy");
    const commentActionLabel = t("points:tracker.addComment", "Comment");
    const setupActions: ReactNode[] = [];

    if (isLineIncomplete) {
      setupActions.push(
        <Button
          aria-label={t(
            "points:tracker.requiredPlayersAction",
            "Select players",
          )}
          color="warning"
          disabled={!onOpenManagePlayers}
          key="required-players"
          onClick={onOpenManagePlayers}
          startIcon={<GroupIcon />}
          sx={fieldSetupButtonSx}
          variant="outlined"
        >
          {playerActionLabel}
        </Button>,
      );
    }

    if (isStrategyMissing) {
      setupActions.push(
        <Button
          aria-label={t(
            "points:tracker.requiredStrategyAction",
            "Set strategy",
          )}
          disabled={!onOpenStrategy}
          key="required-strategy"
          onClick={onOpenStrategy}
          startIcon={<EmojiObjectsIcon />}
          sx={[fieldSetupButtonSx, accentOutlinedSx]}
          variant="outlined"
        >
          {strategyActionLabel}
        </Button>,
      );
    }

    const secondaryActions: ReactNode[] = [];

    if (currentPoint.status === "ready") {
      secondaryActions.push(
        renderFieldSecondaryButton({
          actionKey: "manage-players",
          label: playerActionLabel,
          icon: <GroupIcon />,
          onClick: onOpenManagePlayers,
          disabled: !onOpenManagePlayers,
          color: isLineIncomplete ? "warning" : undefined,
        }),
        renderFieldSecondaryButton({
          actionKey: "strategy",
          label: strategyActionLabel,
          icon: <EmojiObjectsIcon />,
          onClick: onOpenStrategy,
          disabled: !onOpenStrategy,
        }),
        renderFieldSecondaryButton({
          actionKey: "comment",
          label: commentActionLabel,
          icon: <CommentIcon />,
          onClick: onOpenComment,
          disabled: !onOpenComment,
        }),
      );
    }

    if (currentPoint.status === "running" && !hasPendingStoppage) {
      secondaryActions.push(
        renderFieldSecondaryButton({
          actionKey: "turnover",
          label: t("points:tracker.turnover", "Turnover"),
          icon: <SwapHorizIcon />,
          onClick: onOpenRecordTurnover,
        }),
        renderFieldSecondaryButton({
          actionKey: "stoppage",
          label: t("points:tracker.stoppage", "Stoppage"),
          icon: <PauseCircleIcon />,
          onClick: onOpenRecordStoppage,
        }),
      );
    }

    if (currentPoint.status === "scored") {
      secondaryActions.push(
        renderFieldSecondaryButton({
          actionKey: "resume",
          label: isRestartPending
            ? t("points:tracker.resuming", "Resuming...")
            : t("points:tracker.resume", "Resume Point"),
          icon: <RestartAltIcon />,
          onClick: onRestartPoint,
          disabled: isRestartPending,
          color: "warning",
        }),
      );
    }

    if (currentPoint.status !== "ready") {
      secondaryActions.push(
        renderFieldSecondaryButton({
          actionKey: "line",
          label: playerActionLabel,
          icon: <GroupIcon />,
          onClick: onOpenManagePlayers,
          disabled: !onOpenManagePlayers,
          color: isLineIncomplete ? "warning" : undefined,
        }),
      );
    }

    secondaryActions.push(
      renderFieldSecondaryButton({
        actionKey: "more",
        label: t("points:tracker.more", "More"),
        icon: <MoreVertIcon />,
        onClick: onOpenMoreActions,
      }),
    );

    return (
      <Box sx={fieldDeckSx}>
        {setupActions.length > 0 && (
          <Box
            role="group"
            aria-label={t(
              "points:tracker.requiredSetupActions",
              "Required setup",
            )}
            sx={fieldSetupRowSx}
          >
            {setupActions}
          </Box>
        )}
        {showPullResolution && (
          <Box
            role="group"
            aria-label={t("points:tracker.pullResolutionActions")}
            sx={fieldSetupRowSx}
          >
            <Button
              color="success"
              disabled={isUpdatePullPending || !onMarkPullInbounds}
              onClick={onMarkPullInbounds}
              startIcon={<CheckCircleIcon />}
              sx={fieldPullButtonSx}
              variant="outlined"
            >
              {t("points:dialog.start.inbounds")}
            </Button>
            <Button
              color="error"
              disabled={isUpdatePullPending || !onMarkPullOutOfBounds}
              onClick={onMarkPullOutOfBounds}
              startIcon={<CloseIcon />}
              sx={fieldPullButtonSx}
              variant="outlined"
            >
              {t("points:dialog.start.outOfBounds")}
            </Button>
          </Box>
        )}
        {primaryAction && (
          <Box
            role="group"
            aria-label={t(
              "points:tracker.primaryPointAction",
              "Primary point action",
            )}
            sx={fieldPrimaryRowSx}
          >
            {primaryAction}
          </Box>
        )}
        <Box
          role="group"
          aria-label={t("points:tracker.pointActions", "Point actions")}
          sx={fieldSecondaryRowSx}
        >
          {secondaryActions}
        </Box>
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
