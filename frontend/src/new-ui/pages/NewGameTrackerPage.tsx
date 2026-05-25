import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import { GameRosterDialog } from "../../components/games/detail/GameRosterDialog";
import AddPlayersToGameModal from "../../components/modals/AddPlayersToGameModal";
import EditGameModal from "../../components/modals/EditGameModal";
import LivePointTracker from "../../components/points/LivePointTracker";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import { finishGame, updateGame } from "../../services";
import { formatDateTime } from "../../utils/dateFormatting";
import {
  invalidateGameAfterPointMutation,
  invalidateGameHistory,
  invalidateGameLiveState,
} from "../../utils/queryInvalidation";
import { queryKeys } from "../../utils/queryKeys";
import { useGameDetailPageData } from "../../pages/hooks/useGameDetailPageData";

export default function NewGameTrackerPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "games", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const queryClient = useQueryClient();

  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);

  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading,
  );
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
  const canViewStatistics =
    !shouldProtectUi || auth.capabilities.canViewStatistics;
  const canViewPlayerStatistics =
    !shouldProtectUi || auth.capabilities.canViewPlayerStatistics;

  const {
    gameIdNumber,
    game,
    isLoading,
    error,
    activePoint,
    activePointTurnovers,
    activePointStoppages,
    liveStatsByPlayerId,
    competition,
    rosterPlayersForTabs,
    getRosterPlayerHighlight,
  } = useGameDetailPageData(gameId, canViewPlayerStatistics);

  const startMutation = useMutation({
    mutationFn: () => updateGame(gameIdNumber, { status: "started" }),
    onSuccess: async () => {
      await invalidateGameLiveState(queryClient, gameIdNumber);
      await queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => finishGame(gameIdNumber),
    onSuccess: async () => {
      await invalidateGameHistory(queryClient, gameIdNumber);
      await queryClient.invalidateQueries({ queryKey: queryKeys.games });
      setIsFinishConfirmOpen(false);
    },
  });

  if (isLoading) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (error || !game) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  const handlePointUpdated = () => {
    void invalidateGameAfterPointMutation(queryClient, gameIdNumber);
  };
  const statisticsPath = competition
    ? `/statistics?teamId=${competition.team_id}&gameIds=${game.id}`
    : "/statistics";
  const canShowTracker =
    (game.status === "ready" || game.status === "started") &&
    (!canEditData || competition);
  const gameActionButtonSx = {
    minHeight: { xs: 48, sm: 44 },
    minWidth: 0,
    px: { xs: 0.5, sm: 2 },
    "& .MuiButton-startIcon": {
      ml: 0,
      mr: { xs: 0, sm: 1 },
    },
  };
  const mobileHiddenLabelSx = {
    display: { xs: "none", sm: "inline" },
  };

  return (
    <Container
      disableGutters
      maxWidth="md"
      sx={{ px: { xs: 0, sm: 3 }, py: { xs: 0, md: 4 } }}
    >
      <Stack spacing={2.5}>
        <Paper
          component="header"
          elevation={0}
          sx={(theme) => ({
            bgcolor: theme.colors.newUi.primary,
            borderRadius: { xs: 0, sm: 1 },
            color: theme.palette.primary.contrastText,
            overflow: "hidden",
          })}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              alignItems="center"
              direction="row"
              justifyContent="space-between"
              spacing={1.5}
            >
              <Button
                color="inherit"
                component={Link}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: "inherit",
                  fontWeight: 800,
                  minWidth: 0,
                  opacity: 0.9,
                  px: 0,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "transparent",
                    opacity: 1,
                  },
                }}
                to="/games"
              >
                {t("navigation:newUiPages.liveGame.tracker.back")}
              </Button>
              <Chip
                label={
                  game.status === "started"
                    ? t("navigation:newUiPages.liveGame.board.live")
                    : t("games:status.ready")
                }
                size="small"
                sx={(theme) => ({
                  bgcolor: alpha(theme.palette.common.white, 0.16),
                  color: theme.palette.common.white,
                  fontWeight: 800,
                  "& .MuiChip-label": {
                    px: 1.25,
                  },
                })}
              />
            </Stack>

            <Typography
              component="h1"
              sx={{
                border: 0,
                clip: "rect(0 0 0 0)",
                height: 1,
                m: -1,
                overflow: "hidden",
                p: 0,
                position: "absolute",
                left: 0,
                top: 0,
                whiteSpace: "nowrap",
                width: 1,
              }}
            >
              {t("navigation:newUiPages.liveGame.tracker.heading", {
                teamName: game.team_name,
                opponentName: game.opponent_name,
              })}
            </Typography>

            <Stack
              alignItems="center"
              direction="row"
              justifyContent="center"
              spacing={{ xs: 2, sm: 4 }}
              sx={{ mt: { xs: 2, sm: 3 } }}
            >
              <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <Typography
                  fontWeight={800}
                  sx={{ opacity: 0.9, overflowWrap: "anywhere" }}
                  variant="body2"
                >
                  {game.team_name}
                </Typography>
              </Box>
              <Typography
                aria-label={t(
                  "navigation:newUiPages.liveGame.board.currentScore",
                )}
                fontWeight={900}
                sx={{
                  typography: { xs: "h3", sm: "h2" },
                  whiteSpace: "nowrap",
                }}
              >
                {game.our_score} - {game.opponent_score}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                <Typography
                  fontWeight={800}
                  sx={{ opacity: 0.9, overflowWrap: "anywhere" }}
                  variant="body2"
                >
                  {game.opponent_name}
                </Typography>
              </Box>
            </Stack>
            <Typography
              sx={{ mt: 1, opacity: 0.78 }}
              textAlign="center"
              variant="body2"
            >
              {game.competition_name}
              {game.date
                ? ` · ${formatDateTime(game.date, i18n.resolvedLanguage)}`
                : ""}
            </Typography>
          </Box>
        </Paper>

        <Stack
          spacing={2.5}
          sx={{ px: { xs: 1.5, sm: 0 }, pb: { xs: 2, sm: 0 } }}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }}
          >
            {(canEditData || canViewStatistics) && (
              <Tooltip
                title={t(
                  "navigation:newUiPages.liveGame.tracker.actions.roster",
                )}
              >
                <Button
                  aria-label={t(
                    "navigation:newUiPages.liveGame.tracker.actions.roster",
                  )}
                  fullWidth
                  onClick={() => setIsRosterDialogOpen(true)}
                  startIcon={<GroupIcon />}
                  sx={gameActionButtonSx}
                  variant="outlined"
                >
                  <Box component="span" sx={mobileHiddenLabelSx}>
                    {t("navigation:newUiPages.liveGame.tracker.actions.roster")}
                  </Box>
                </Button>
              </Tooltip>
            )}
            {canViewStatistics && (
              <Tooltip
                title={t(
                  "navigation:newUiPages.liveGame.tracker.actions.stats",
                )}
              >
                <Button
                  aria-label={t(
                    "navigation:newUiPages.liveGame.tracker.actions.stats",
                  )}
                  component={Link}
                  fullWidth
                  startIcon={<BarChartIcon />}
                  sx={gameActionButtonSx}
                  to={statisticsPath}
                  variant="outlined"
                >
                  <Box component="span" sx={mobileHiddenLabelSx}>
                    {t("navigation:newUiPages.liveGame.tracker.actions.stats")}
                  </Box>
                </Button>
              </Tooltip>
            )}
            {canEditData && (
              <Tooltip
                title={t(
                  "navigation:newUiPages.liveGame.tracker.actions.edit",
                )}
              >
                <Button
                  aria-label={t(
                    "navigation:newUiPages.liveGame.tracker.actions.edit",
                  )}
                  fullWidth
                  onClick={() => setIsEditModalOpen(true)}
                  startIcon={<EditIcon />}
                  sx={gameActionButtonSx}
                  variant="outlined"
                >
                  <Box component="span" sx={mobileHiddenLabelSx}>
                    {t("navigation:newUiPages.liveGame.tracker.actions.edit")}
                  </Box>
                </Button>
              </Tooltip>
            )}
            {canEditData && game.status === "ready" && (
              <Tooltip title={t("games:detail.startGame")}>
                <span>
                  <Button
                    aria-label={t("games:detail.startGame")}
                    disabled={startMutation.isPending}
                    fullWidth
                    onClick={() => startMutation.mutate()}
                    startIcon={<PlayArrowIcon />}
                    sx={gameActionButtonSx}
                    variant="contained"
                  >
                    <Box component="span" sx={mobileHiddenLabelSx}>
                      {startMutation.isPending
                        ? t("common:action.loading")
                        : t("games:detail.startGame")}
                    </Box>
                  </Button>
                </span>
              </Tooltip>
            )}
            {canEditData && game.status === "started" && (
              <Tooltip
                title={t(
                  "navigation:newUiPages.liveGame.tracker.actions.complete",
                )}
              >
                <Button
                  aria-label={t(
                    "navigation:newUiPages.liveGame.tracker.actions.complete",
                  )}
                  color="success"
                  fullWidth
                  onClick={() => setIsFinishConfirmOpen(true)}
                  startIcon={<CheckCircleIcon />}
                  sx={gameActionButtonSx}
                  variant="outlined"
                >
                  <Box component="span" sx={mobileHiddenLabelSx}>
                    {t("navigation:newUiPages.liveGame.tracker.actions.complete")}
                  </Box>
                </Button>
              </Tooltip>
            )}
          </Box>

          {canShowTracker && (
            <LivePointTracker
              activePoint={activePoint || null}
              activePointStoppages={activePointStoppages}
              activePointTurnovers={activePointTurnovers}
              game={game}
              onPointUpdated={handlePointUpdated}
              players={game.players}
              renderWhenReady
              readOnly={!canEditData}
              teamId={competition?.team_id ?? 0}
              variant="field"
            />
          )}
        </Stack>
      </Stack>

      {(canEditData || canViewStatistics) && competition && (
        <GameRosterDialog
          canManageRoster={canEditData}
          disabled={!canEditData || game.status === "ended"}
          getHighlight={getRosterPlayerHighlight}
          liveStatsByPlayerId={liveStatsByPlayerId}
          onClose={() => setIsRosterDialogOpen(false)}
          onOpenAddPlayers={
            canEditData ? () => setIsAddPlayersModalOpen(true) : undefined
          }
          open={isRosterDialogOpen}
          players={rosterPlayersForTabs}
        />
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setIsFinishConfirmOpen(false)}
        open={isFinishConfirmOpen}
      >
        <DialogTitle>{t("games:detail.endGameConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("games:detail.endGameConfirm")}
          </Typography>
          {finishMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={finishMutation.isPending}
            onClick={() => setIsFinishConfirmOpen(false)}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            color="success"
            disabled={finishMutation.isPending}
            onClick={() => finishMutation.mutate()}
            variant="contained"
          >
            {finishMutation.isPending
              ? t("common:action.loading")
              : t("navigation:newUiPages.liveGame.tracker.actions.complete")}
          </Button>
        </DialogActions>
      </Dialog>

      {canEditData && isEditModalOpen && (
        <EditGameModal
          game={game}
          isOpen={isEditModalOpen}
          key={game.id}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {competition && canEditData && isAddPlayersModalOpen && (
        <AddPlayersToGameModal
          competitionId={competition.id}
          currentPlayerIds={game.players.map((player) => player.id)}
          gameId={gameIdNumber}
          isOpen={isAddPlayersModalOpen}
          onClose={() => setIsAddPlayersModalOpen(false)}
        />
      )}
    </Container>
  );
}
