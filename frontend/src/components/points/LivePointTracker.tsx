import { useState, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CommentIcon from "@mui/icons-material/Comment";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import PointTimer from "./PointTimer";
import StartPointDialog from "../modals/StartPointDialog";
import FinishPointDialog from "../modals/FinishPointDialog";
import CompletePointDialog from "../modals/CompletePointDialog";
import AddCommentDialog from "../modals/AddCommentDialog";
import SelectStrategyDialog from "../modals/SelectStrategyDialog";
import { RecordCallDialog } from "../modals/RecordCallDialog";
import { RecordTurnoverDialog } from "../modals/RecordTurnoverDialog";
import { ResumeFromCallDialog } from "../modals/ResumeFromCallDialog";
import ManagePlayersDialog from "../modals/ManagePlayersDialog";
import { PointEventsHistory } from "./PointEventsHistory";
import type { GameDetail, PointWithPlayers, Player, TurnoverWithPlayer, Call } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { getTurnoversByPoint } from "../../services/turnovers";
import { getCallsByPoint } from "../../services/calls";
import GroupIcon from "@mui/icons-material/Group";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import { queryKeys } from "../../utils/queryKeys";

interface LivePointTrackerProps {
  game: GameDetail;
  activePoint: PointWithPlayers | null;
  players: Player[];
  teamId: number;
  onPointUpdated?: () => void;
}

export default function LivePointTracker({
  game,
  activePoint,
  players,
  teamId,
  onPointUpdated,
}: LivePointTrackerProps) {
  const { t } = useTranslation(["points", "common"]);
  const theme = useTheme();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isTurnoverDialogOpen, setIsTurnoverDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isManagePlayersDialogOpen, setIsManagePlayersDialogOpen] = useState(false);
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  // Fetch turnovers for active point (needed for possession logic)
  const { data: existingTurnovers = [] } = useQuery<TurnoverWithPlayer[]>({
    queryKey: queryKeys.turnovers(activePoint?.id ?? 0),
    queryFn: () => getTurnoversByPoint(activePoint!.id),
    enabled: !!activePoint,
  });

  // Fetch calls for active point (needed to check for pending calls)
  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: queryKeys.calls(activePoint?.id ?? 0),
    queryFn: () => getCallsByPoint(activePoint!.id),
    enabled: !!activePoint,
  });

  // Check if there are any pending calls (calls without resume_timestamp)
  const hasPendingCall = calls.some(call => call.resume_timestamp === null);
  const pendingCall = calls.find(call => call.resume_timestamp === null);

  // Find scored points (most recent scored point)
  const scoredPoint = useMemo(() => {
    return game.points
      .filter((p) => p.status === "scored")
      .sort((a, b) => b.point_number - a.point_number)[0];
  }, [game.points]);

  // The "active" point is either running or scored
  const currentPoint = activePoint || scoredPoint;

  // Mutation to update pull status
  const updatePullMutation = useMutation({
    mutationFn: (pull: boolean) => {
      if (!activePoint) throw new Error("No active point");
      return updatePoint(activePoint.id, { pull });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameTeamStatistics(game.id) });
      onPointUpdated?.();
    },
  });

  // Mutation to launch pull (transition ready → running)
  const launchPullMutation = useMutation({
    mutationFn: () => {
      if (!activePoint) throw new Error("No active point");
      return updatePoint(activePoint.id, { status: "running" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(game.id) });
      onPointUpdated?.();
    },
  });

  // Check if point has valid player composition (exactly 7 players + correct ABBA gender)
  const hasValidPlayerComposition = useMemo(() => {
    if (!currentPoint || currentPoint.players.length !== 7) {
      return false;
    }

    // Count by gender
    const men = currentPoint.players.filter((p) => p.gender === "M").length;
    const women = currentPoint.players.filter((p) => p.gender === "W").length;

    // Get completed points to determine ABBA pattern
    const completedPoints = game.points
      .filter((p: PointWithPlayers) => p.status === "completed")
      .sort((a: PointWithPlayers, b: PointWithPlayers) => a.point_number - b.point_number);

    if (completedPoints.length === 0) {
      // First point: accept either 4M+3W or 3M+4W
      return (men === 4 && women === 3) || (men === 3 && women === 4);
    }

    // ABBA pattern: A-B-B-A-A-B-B-A...
    const position = currentPoint.point_number - 1; // Convert to 0-indexed
    const positionInCycle = position % 4;
    const isPatternA = positionInCycle === 0 || positionInCycle === 3;

    // Determine what "A" ratio is based on the first completed point
    const firstPoint = completedPoints[0];
    const firstPointMen = firstPoint.players.filter((p: Player) => p.gender === "M").length;
    const patternAIsFourMen = firstPointMen === 4;

    // Check if current point matches required ratio
    if (isPatternA) {
      return patternAIsFourMen
        ? men === 4 && women === 3
        : men === 3 && women === 4;
    } else {
      return patternAIsFourMen
        ? men === 3 && women === 4
        : men === 4 && women === 3;
    }
  }, [currentPoint, game.points]);

  // Mutation to restart a scored point (cancel the score)
  const restartPointMutation = useMutation({
    mutationFn: () => {
      if (!scoredPoint) throw new Error("No scored point");
      return updatePoint(scoredPoint.id, {
        status: "running",
        won: null,
        end_datetime: null,
      });
    },
    onSuccess: async (updatedPoint) => {
      // Optimistically update both caches immediately to avoid UI flicker

      // 1. Update activePoint cache
      queryClient.setQueryData(queryKeys.activePoint(game.id), updatedPoint);

      // 2. Update game cache - replace the scored point with the updated point
      queryClient.setQueryData(queryKeys.game(game.id), (oldData: unknown) => {
        if (!oldData || typeof oldData !== 'object') return oldData;
        const gameData = oldData as { points: PointWithPlayers[] };
        return {
          ...gameData,
          points: gameData.points.map((p) =>
            p.id === updatedPoint.id ? updatedPoint : p
          ),
        };
      });

      // 3. Invalidate stats queries since un-scoring a point affects statistics
      queryClient.invalidateQueries({ queryKey: queryKeys.liveStats(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameTeamStatistics(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.gameStrategyStatistics(game.id) });
      onPointUpdated?.();
    },
  });

  // Only show live tracker for started games (hide for ready and ended)
  if (game.status !== "started") {
    return null;
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...(currentPoint && {
            borderTop: 3,
            borderColor: (theme) => currentPoint.starting_on_offense
              ? theme.colors.offense.main
              : theme.colors.defense.main
          })
        }}
      >
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {t("points:tracker.title", "Live Point Tracking")}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {!currentPoint ? (
          // No active or scored point - show start button
          <Box textAlign="center" py={2}>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {t("points:empty.noPoints")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsStartDialogOpen(true)}
              size="large"
            >
              {t("points:tracker.newPoint")}
            </Button>
          </Box>
        ) : (
          // Active or scored point - show appropriate button
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t("points:history.point")} #{currentPoint.point_number} -{" "}
                  {currentPoint.status === "ready"
                    ? t("points:status.ready", "Ready")
                    : currentPoint.status === "running"
                    ? t("points:status.running")
                    : t("points:status.scored")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={
                      currentPoint.starting_on_offense
                        ? t("points:tracker.offense")
                        : t("points:tracker.defense")
                    }
                    size="small"
                    sx={(theme) => currentPoint.starting_on_offense ? {} : {
                      bgcolor: theme.colors.defense.main,
                      color: theme.palette.common.white,
                      '& .MuiChip-label': {
                        color: theme.palette.common.white
                      }
                    }}
                    color={currentPoint.starting_on_offense ? "primary" : undefined}
                  />
                  {currentPoint.status === "scored" && (
                    <Chip
                      label={currentPoint.won
                        ? t("points:dialog.finish.weScored")
                        : t("points:dialog.finish.theyScored")}
                      size="small"
                      color={currentPoint.won ? "success" : "error"}
                    />
                  )}
                </Box>
              </Box>
              {currentPoint.start_datetime && (
                <Box textAlign="center">
                  <Typography
                    variant="body2"
                    gutterBottom
                    sx={{
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main,
                      fontWeight: 'medium'
                    }}
                  >
                    {currentPoint.status === "running"
                      ? t("points:tracker.elapsedTime", "Elapsed Time")
                      : t("points:tracker.duration", "Duration")}
                  </Typography>
                  <PointTimer
                    key={`${currentPoint.id}-${currentPoint.status}`}
                    startDatetime={currentPoint.start_datetime}
                    endDatetime={currentPoint.status === "scored" ? currentPoint.end_datetime || undefined : undefined}
                    color={currentPoint.starting_on_offense
                      ? theme.colors.offense.main
                      : theme.colors.defense.main}
                  />
                </Box>
              )}
            </Box>

            {/* Pull tracking - only for running defensive points */}
            {activePoint &&
             activePoint.status === "running" &&
             !activePoint.starting_on_offense &&
             activePoint.pull === null && (
              <Box mt={2} textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t("points:tracker.pullQuestion", "Did the pull land inbound?")}
                </Typography>
                <ButtonGroup variant="outlined" disabled={updatePullMutation.isPending}>
                  <Button
                    startIcon={<CheckIcon />}
                    onClick={() => updatePullMutation.mutate(true)}
                    color="success"
                  >
                    {t("points:dialog.start.inbounds")}
                  </Button>
                  <Button
                    startIcon={<CloseIcon />}
                    onClick={() => updatePullMutation.mutate(false)}
                    color="error"
                  >
                    {t("points:dialog.start.outOfBounds")}
                  </Button>
                </ButtonGroup>
              </Box>
            )}

            {/* Configuration buttons - Select Strategy and Select Players (when not set) */}
            {(!currentPoint.strategy || !hasValidPlayerComposition) && (
              <Box display="flex" justifyContent="center" gap={2} mt={2} flexWrap="wrap">
                {!currentPoint.strategy && (
                  <Button
                    variant="outlined"
                    startIcon={<EmojiObjectsIcon />}
                    onClick={() => setIsStrategyDialogOpen(true)}
                    size="medium"
                  >
                    {t("points:tracker.selectStrategy", "Select Strategy")}
                  </Button>
                )}
                {!hasValidPlayerComposition && (
                  <Button
                    variant="outlined"
                    startIcon={<GroupIcon />}
                    onClick={() => setIsManagePlayersDialogOpen(true)}
                    size="medium"
                    sx={{
                      borderColor: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main,
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main,
                      '&:hover': {
                        borderColor: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.dark
                          : theme.colors.defense.dark,
                      }
                    }}
                  >
                    {t("points:tracker.selectPlayers", "Select Players")}
                  </Button>
                )}
              </Box>
            )}

            {/* More Actions Menu */}
            <Menu
              anchorEl={moreActionsAnchor}
              open={Boolean(moreActionsAnchor)}
              onClose={() => setMoreActionsAnchor(null)}
            >
              {[
                currentPoint.strategy && (
                  <MenuItem
                    key="change-strategy"
                    onClick={() => {
                      setIsStrategyDialogOpen(true);
                      setMoreActionsAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <EmojiObjectsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("points:tracker.changeStrategy", "Change Strategy")}
                    </ListItemText>
                  </MenuItem>
                ),
                hasValidPlayerComposition && (
                  <MenuItem
                    key="manage-players"
                    onClick={() => {
                      setIsManagePlayersDialogOpen(true);
                      setMoreActionsAnchor(null);
                    }}
                  >
                    <ListItemIcon>
                      <GroupIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t("points:tracker.managePlayers", "Manage Players")}
                    </ListItemText>
                  </MenuItem>
                ),
                <MenuItem
                  key="comment"
                  onClick={() => {
                    setIsCommentDialogOpen(true);
                    setMoreActionsAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <CommentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>
                    {currentPoint.comments
                      ? t("points:tracker.editComment", "Edit Comment")
                      : t("points:tracker.addComment", "Add Comment")}
                  </ListItemText>
                </MenuItem>
              ].filter(Boolean)}
            </Menu>

            {/* Action Buttons */}
            <Box display="flex" justifyContent="center" gap={2} mt={3} flexWrap="wrap">
              {currentPoint.status === "ready" ? (
                // Ready status - show Launch Pull
                <>
                  <Button
                    variant="contained"
                    startIcon={<RocketLaunchIcon />}
                    onClick={() => launchPullMutation.mutate()}
                    disabled={launchPullMutation.isPending}
                    size="large"
                    sx={{
                      bgcolor: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main,
                      '&:hover': {
                        bgcolor: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.dark
                          : theme.colors.defense.dark,
                      }
                    }}
                  >
                    {launchPullMutation.isPending
                      ? t("points:tracker.launching", "Launching...")
                      : t("points:tracker.launchPull", "Launch Pull")}
                  </Button>
                  <Tooltip title={t("common:action.moreActions", "More Actions")}>
                    <Button
                      variant="outlined"
                      onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
                      aria-label={t("common:action.moreActions", "More Actions")}
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        borderColor: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.main
                          : theme.colors.defense.main,
                        color: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.main
                          : theme.colors.defense.main,
                        '&:hover': {
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.dark
                            : theme.colors.defense.dark,
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </Button>
                  </Tooltip>
                </>
              ) : currentPoint.status === "running" ? (
                hasPendingCall ? (
                  // When there's a pending call, show Resume + More Actions buttons
                  <>
                    <Tooltip title={t("points:tracker.resume", "Resume")}>
                      <Button
                        variant="contained"
                        color="warning"
                        onClick={() => setIsResumeDialogOpen(true)}
                        aria-label={t("points:tracker.resume", "Resume")}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        <PlayArrowIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t("common:action.moreActions", "More Actions")}>
                      <Button
                        variant="outlined"
                        onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
                        aria-label={t("common:action.moreActions", "More Actions")}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          color: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          '&:hover': {
                            borderColor: (theme) => currentPoint.starting_on_offense
                              ? theme.colors.offense.dark
                              : theme.colors.defense.dark,
                          }
                        }}
                      >
                        <MoreVertIcon />
                      </Button>
                    </Tooltip>
                  </>
                ) : (
                  // Normal action buttons when no pending call
                  <>
                    <Tooltip title={t("points:tracker.finish", "Finish Point")}>
                      <Button
                        variant="outlined"
                        color="success"
                        onClick={() => setIsFinishDialogOpen(true)}
                        aria-label={t("points:tracker.finish", "Finish Point")}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        <CheckCircleIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t("points:recordCall", "Record Call")}>
                      <Button
                        variant="outlined"
                        onClick={() => setIsCallDialogOpen(true)}
                        aria-label={t("points:recordCall", "Record Call")}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          color: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          '&:hover': {
                            borderColor: (theme) => currentPoint.starting_on_offense
                              ? theme.colors.offense.dark
                              : theme.colors.defense.dark,
                          }
                        }}
                      >
                        <PauseCircleIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t("points:recordTurnover", "Record Turnover")}>
                      <Button
                        variant="outlined"
                        onClick={() => setIsTurnoverDialogOpen(true)}
                        aria-label={t("points:recordTurnover", "Record Turnover")}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          color: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          '&:hover': {
                            borderColor: (theme) => currentPoint.starting_on_offense
                              ? theme.colors.offense.dark
                              : theme.colors.defense.dark,
                          }
                        }}
                      >
                        <SwapHorizIcon />
                      </Button>
                    </Tooltip>
                    <Tooltip title={t("common:action.moreActions", "More Actions")}>
                      <Button
                        variant="outlined"
                        onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
                        aria-label={t("common:action.moreActions", "More Actions")}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          color: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.main
                            : theme.colors.defense.main,
                          '&:hover': {
                            borderColor: (theme) => currentPoint.starting_on_offense
                              ? theme.colors.offense.dark
                              : theme.colors.defense.dark,
                          }
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
                      onClick={() => setIsCompleteDialogOpen(true)}
                      aria-label={t("points:tracker.complete", "Complete Point")}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      <DoneAllIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip title={restartPointMutation.isPending ? t("points:tracker.resuming", "Resuming...") : t("points:tracker.resume", "Resume Point")}>
                    <span>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => restartPointMutation.mutate()}
                        disabled={restartPointMutation.isPending}
                        aria-label={restartPointMutation.isPending ? t("points:tracker.resuming", "Resuming...") : t("points:tracker.resume", "Resume Point")}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        <RestartAltIcon />
                      </Button>
                    </span>
                  </Tooltip>
                  <Tooltip title={t("common:action.moreActions", "More Actions")}>
                    <Button
                      variant="outlined"
                      onClick={(e) => setMoreActionsAnchor(e.currentTarget)}
                      aria-label={t("common:action.moreActions", "More Actions")}
                      sx={{
                        minWidth: 'auto',
                        px: 2,
                        borderColor: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.main
                          : theme.colors.defense.main,
                        color: (theme) => currentPoint.starting_on_offense
                          ? theme.colors.offense.main
                          : theme.colors.defense.main,
                        '&:hover': {
                          borderColor: (theme) => currentPoint.starting_on_offense
                            ? theme.colors.offense.dark
                            : theme.colors.defense.dark,
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </Button>
                  </Tooltip>
                </>
              )}
            </Box>

            {/* Display strategy if exists */}
            {currentPoint.strategy && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: (theme) => currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiObjectsIcon
                    fontSize="small"
                    sx={{
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  >
                    {currentPoint.starting_on_offense
                      ? t("points:tracker.offense", "Offense")
                      : t("points:tracker.defense", "Defense")
                    } / {currentPoint.strategy.name}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Display comment if exists */}
            {currentPoint.comments && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: (theme) => currentPoint.starting_on_offense
                    ? theme.colors.offense.main
                    : theme.colors.defense.main
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CommentIcon
                    fontSize="small"
                    sx={{
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{
                      color: (theme) => currentPoint.starting_on_offense
                        ? theme.colors.offense.main
                        : theme.colors.defense.main
                    }}
                  >
                    {t("points:tracker.comment", "Comment")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {currentPoint.comments}
                </Typography>
              </Box>
            )}

            {/* Divider before chronology */}
            <Divider sx={{ my: 3 }} />

            {/* Display chronology for active points (running or scored) */}
            {currentPoint && (
              <PointEventsHistory
                pointId={currentPoint.id}
                startingOnOffense={currentPoint.starting_on_offense}
                pointStartTime={currentPoint.start_datetime}
                strategy={currentPoint.strategy}
                pull={currentPoint.pull}
                pointStatus={currentPoint.status}
                endDateTime={currentPoint.end_datetime}
                won={currentPoint.won}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      <StartPointDialog
        open={isStartDialogOpen}
        onClose={() => setIsStartDialogOpen(false)}
        gameId={game.id}
        onSuccess={onPointUpdated}
      />

      {currentPoint && (
        <ManagePlayersDialog
          open={isManagePlayersDialogOpen}
          onClose={() => setIsManagePlayersDialogOpen(false)}
          point={currentPoint}
          teamId={teamId}
          players={players}
          onSuccess={onPointUpdated}
        />
      )}

      {activePoint && (
        <FinishPointDialog
          open={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          activePoint={activePoint}
          onSuccess={onPointUpdated}
        />
      )}

      {scoredPoint && (
        <CompletePointDialog
          open={isCompleteDialogOpen}
          onClose={() => setIsCompleteDialogOpen(false)}
          scoredPoint={scoredPoint}
          onSuccess={onPointUpdated}
        />
      )}

      {currentPoint && (
        <AddCommentDialog
          key={`comment-${currentPoint.id}`}
          open={isCommentDialogOpen}
          onClose={() => setIsCommentDialogOpen(false)}
          point={currentPoint}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}

      {currentPoint && (
        <SelectStrategyDialog
          key={`strategy-${currentPoint.id}`}
          open={isStrategyDialogOpen}
          onClose={() => setIsStrategyDialogOpen(false)}
          point={currentPoint}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}

      {activePoint && (
        <RecordCallDialog
          open={isCallDialogOpen}
          onClose={() => setIsCallDialogOpen(false)}
          point={activePoint}
        />
      )}

      {activePoint && (
        <RecordTurnoverDialog
          open={isTurnoverDialogOpen}
          onClose={() => setIsTurnoverDialogOpen(false)}
          point={activePoint}
          existingTurnovers={existingTurnovers}
        />
      )}

      {pendingCall && (
        <ResumeFromCallDialog
          open={isResumeDialogOpen}
          onClose={() => setIsResumeDialogOpen(false)}
          call={pendingCall}
        />
      )}
    </>
  );
}
