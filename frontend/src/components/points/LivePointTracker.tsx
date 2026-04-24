import { useState } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import { useTranslation } from "react-i18next";
import StartPointDialog from "../modals/StartPointDialog";
import FinishPointDialog from "../modals/FinishPointDialog";
import CompletePointDialog from "../modals/CompletePointDialog";
import AddCommentDialog from "../modals/AddCommentDialog";
import SelectStrategyDialog from "../modals/SelectStrategyDialog";
import { RecordStoppageDialog } from "../modals/RecordStoppageDialog";
import { RecordTurnoverDialog } from "../modals/RecordTurnoverDialog";
import { ResumeFromStoppageDialog } from "../modals/ResumeFromStoppageDialog";
import ManagePlayersDialog from "../modals/ManagePlayersDialog";
import { PointEventsHistory } from "./PointEventsHistory";
import type { GameDetail, PointWithPlayers, Player, TurnoverWithPlayer, Stoppage } from "../../types";
import { useQuery } from "@tanstack/react-query";
import { getTurnoversByPoint } from "../../services/turnovers";
import { getStoppagesByPoint } from "../../services/stoppages";
import GroupIcon from "@mui/icons-material/Group";
import { queryKeys } from "../../utils/queryKeys";
import { LIVE_TRACKER_REFRESH_INTERVAL_MS } from "../../utils/refreshIntervals";
import { LivePointHeader } from "./liveTracker/LivePointHeader";
import { LivePointActionBar } from "./liveTracker/LivePointActionBar";
import { LivePointContextCards } from "./liveTracker/LivePointContextCards";
import { LivePointMixityIndicator } from "./liveTracker/LivePointMixityIndicator";
import { useLivePointMutations } from "./liveTracker/useLivePointMutations";
import { useLivePointState } from "./liveTracker/useLivePointState";

interface LivePointTrackerProps {
  game: GameDetail;
  activePoint: PointWithPlayers | null;
  activePointTurnovers?: TurnoverWithPlayer[];
  activePointStoppages?: Stoppage[];
  players: Player[];
  teamId: number;
  onPointUpdated?: () => void;
  readOnly?: boolean;
}

export default function LivePointTracker({
  game,
  activePoint,
  activePointTurnovers,
  activePointStoppages,
  players,
  teamId,
  onPointUpdated,
  readOnly = false,
}: LivePointTrackerProps) {
  const { t } = useTranslation(["points", "common"]);
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isFinishDialogOpen, setIsFinishDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isTurnoverDialogOpen, setIsTurnoverDialogOpen] = useState(false);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isManagePlayersDialogOpen, setIsManagePlayersDialogOpen] = useState(false);
  const [isHalftimeConfirmOpen, setIsHalftimeConfirmOpen] = useState(false);
  const [moreActionsAnchor, setMoreActionsAnchor] = useState<null | HTMLElement>(null);
  const hasHalftime = Boolean(game.halftime);

  // Fetch turnovers for active point (needed for possession logic)
  const { data: existingTurnovers = [] } = useQuery<TurnoverWithPlayer[]>({
    queryKey: queryKeys.turnovers(activePoint?.id ?? 0),
    queryFn: () => getTurnoversByPoint(activePoint!.id),
    enabled: !!activePoint && activePointTurnovers === undefined,
    refetchInterval: activePoint ? LIVE_TRACKER_REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: true,
  });
  const liveTurnovers = activePointTurnovers ?? existingTurnovers;

  // Fetch stoppages for active point (needed to check for pending stoppages)
  const { data: stoppages = [] } = useQuery<Stoppage[]>({
    queryKey: queryKeys.stoppages(activePoint?.id ?? 0),
    queryFn: () => getStoppagesByPoint(activePoint!.id),
    enabled: !!activePoint && activePointStoppages === undefined,
    refetchInterval: activePoint ? LIVE_TRACKER_REFRESH_INTERVAL_MS : false,
    refetchIntervalInBackground: true,
  });
  const liveStoppages = activePointStoppages ?? stoppages;

  const {
    scoredPoint,
    currentPoint,
    hasPendingStoppage,
    pendingStoppage,
    hasValidPlayerComposition,
    expectedGenderRatio,
  } = useLivePointState({
    game,
    activePoint,
    stoppages: liveStoppages,
  });

  const {
    updatePullMutation,
    launchPullMutation,
    restartPointMutation,
    createHalftimeMutation,
  } = useLivePointMutations({
    gameId: game.id,
    activePoint,
    scoredPoint,
    onPointUpdated,
    onHalftimeCreated: () => {
      setIsHalftimeConfirmOpen(false);
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
              {readOnly
                ? t(
                    "points:tracker.spectatorIdle",
                    "No live point is currently active. The tracker will update here when play starts."
                  )
                : t("points:empty.noPoints")}
            </Typography>
            {expectedGenderRatio && (
              <Box mb={2} display="flex" justifyContent="center">
                <LivePointMixityIndicator requiredGenderRatio={expectedGenderRatio} />
              </Box>
            )}
            {!readOnly && createHalftimeMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {t("common:error.generic")}
              </Alert>
            )}
            {!readOnly && (
              <Box display="flex" justifyContent="center" gap={1.5} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsStartDialogOpen(true)}
                  size="large"
                >
                  {t("points:tracker.newPoint")}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AccessTimeFilledIcon />}
                  onClick={() => setIsHalftimeConfirmOpen(true)}
                  disabled={hasHalftime || createHalftimeMutation.isPending}
                  size="large"
                >
                  {createHalftimeMutation.isPending
                    ? t("points:tracker.recordingHalftime", "Recording...")
                    : t("points:tracker.halfTime", "Half time")}
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          // Active or scored point - show appropriate button
          <Box>
            <LivePointHeader
              currentPoint={currentPoint}
              expectedGenderRatio={expectedGenderRatio}
            />

            {/* Pull tracking - only for running defensive points */}
            {!readOnly &&
             activePoint &&
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
            {!readOnly && (!currentPoint.strategy || !hasValidPlayerComposition) && (
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

            {!readOnly && (
              <LivePointActionBar
                currentPoint={currentPoint}
                hasPendingStoppage={hasPendingStoppage}
                isLaunchPullPending={launchPullMutation.isPending}
                onLaunchPull={() => launchPullMutation.mutate()}
                isRestartPending={restartPointMutation.isPending}
                onRestartPoint={() => restartPointMutation.mutate()}
                onOpenFinish={() => setIsFinishDialogOpen(true)}
                onOpenRecordStoppage={() => setIsCallDialogOpen(true)}
                onOpenRecordTurnover={() => setIsTurnoverDialogOpen(true)}
                onOpenResume={() => setIsResumeDialogOpen(true)}
                onOpenComplete={() => setIsCompleteDialogOpen(true)}
                onOpenMoreActions={(event) => setMoreActionsAnchor(event.currentTarget)}
              />
            )}

            <LivePointContextCards currentPoint={currentPoint} />

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
                fieldSide={currentPoint.field_side}
                turnovers={currentPoint.id === activePoint?.id ? liveTurnovers : undefined}
                stoppages={currentPoint.id === activePoint?.id ? liveStoppages : undefined}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Dialogs */}
      {!readOnly && (
        <StartPointDialog
          open={isStartDialogOpen}
          onClose={() => setIsStartDialogOpen(false)}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && currentPoint && (
        <ManagePlayersDialog
          open={isManagePlayersDialogOpen}
          onClose={() => setIsManagePlayersDialogOpen(false)}
          point={currentPoint}
          teamId={teamId}
          players={players}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && activePoint && (
        <FinishPointDialog
          open={isFinishDialogOpen}
          onClose={() => setIsFinishDialogOpen(false)}
          activePoint={activePoint}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && scoredPoint && (
        <CompletePointDialog
          open={isCompleteDialogOpen}
          onClose={() => setIsCompleteDialogOpen(false)}
          scoredPoint={scoredPoint}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && currentPoint && (
        <AddCommentDialog
          key={`comment-${currentPoint.id}-${currentPoint.comments ?? "empty"}`}
          open={isCommentDialogOpen}
          onClose={() => setIsCommentDialogOpen(false)}
          point={currentPoint}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && currentPoint && (
        <SelectStrategyDialog
          key={`strategy-${currentPoint.id}`}
          open={isStrategyDialogOpen}
          onClose={() => setIsStrategyDialogOpen(false)}
          point={currentPoint}
          gameId={game.id}
          onSuccess={onPointUpdated}
        />
      )}

      {!readOnly && activePoint && (
        <RecordStoppageDialog
          open={isCallDialogOpen}
          onClose={() => setIsCallDialogOpen(false)}
          point={activePoint}
          gameId={game.id}
        />
      )}

      {!readOnly && activePoint && (
        <RecordTurnoverDialog
          open={isTurnoverDialogOpen}
          onClose={() => setIsTurnoverDialogOpen(false)}
          point={activePoint}
          existingTurnovers={liveTurnovers}
        />
      )}

      {!readOnly && pendingStoppage && (
        <ResumeFromStoppageDialog
          open={isResumeDialogOpen}
          onClose={() => setIsResumeDialogOpen(false)}
          stoppage={pendingStoppage}
          gameId={game.id}
        />
      )}

      {!readOnly && (
        <Dialog
          open={isHalftimeConfirmOpen}
          onClose={() => {
            if (!createHalftimeMutation.isPending) {
              setIsHalftimeConfirmOpen(false);
            }
          }}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>
            {t("points:tracker.halfTimeConfirmTitle", "Record half time?")}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {t(
                "points:tracker.halfTimeConfirmDescription",
                "This will add a halftime marker in the game history."
              )}
            </Typography>
            {createHalftimeMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(createHalftimeMutation.error as { response?: { data?: { detail?: string } } })?.response?.data
                  ?.detail || t("common:error.generic")}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsHalftimeConfirmOpen(false)}
              disabled={createHalftimeMutation.isPending}
            >
              {t("common:action.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={() => createHalftimeMutation.mutate()}
              disabled={createHalftimeMutation.isPending}
            >
              {createHalftimeMutation.isPending
                ? t("points:tracker.recordingHalftime", "Recording...")
                : t("common:action.confirm")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
