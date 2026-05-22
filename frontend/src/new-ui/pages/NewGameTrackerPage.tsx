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
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
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
import StatusChip from "../../components/shared/StatusChip";
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
    auth.isLoading
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

  return (
    <Container
      maxWidth="md"
      sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, md: 4 } }}
    >
      <Stack spacing={2.5}>
        <Button
          component={Link}
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
          to="/games"
        >
          {t("navigation:newUiPages.liveGame.tracker.back")}
        </Button>

        <Paper
          elevation={0}
          sx={(theme) => ({
            bgcolor: theme.colors.newUi.primary,
            borderRadius: 1,
            color: theme.palette.primary.contrastText,
            overflow: "hidden",
          })}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack
              alignItems={{ xs: "flex-start", sm: "center" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography
                  component="p"
                  sx={{ opacity: 0.78 }}
                  variant="overline"
                >
                  {t("navigation:newUiPages.liveGame.tracker.eyebrow")}
                </Typography>
                <Typography component="h1" fontWeight={900} variant="h5">
                  {t("navigation:newUiPages.liveGame.tracker.heading", {
                    teamName: game.team_name,
                    opponentName: game.opponent_name,
                  })}
                </Typography>
                <Typography sx={{ opacity: 0.78 }} variant="body2">
                  {game.competition_name}
                </Typography>
              </Box>
              <StatusChip
                kind="game"
                opponentScore={game.opponent_score}
                ourScore={game.our_score}
                status={game.status}
              />
            </Stack>

            <Stack
              alignItems="center"
              direction="row"
              divider={
                <Divider
                  flexItem
                  orientation="vertical"
                  sx={(theme) => ({
                    borderColor: alpha(theme.palette.primary.contrastText, 0.35),
                  })}
                />
              }
              justifyContent="center"
              spacing={{ xs: 2, sm: 4 }}
              sx={{ mt: 3 }}
            >
              <Box sx={{ minWidth: 96, textAlign: "center" }}>
                <Typography sx={{ opacity: 0.78 }} variant="body2">
                  {game.team_name}
                </Typography>
                <Typography fontWeight={900} variant="h3">
                  {game.our_score}
                </Typography>
              </Box>
              <Box sx={{ minWidth: 96, textAlign: "center" }}>
                <Typography sx={{ opacity: 0.78 }} variant="body2">
                  {game.opponent_name}
                </Typography>
                <Typography fontWeight={900} variant="h3">
                  {game.opponent_score}
                </Typography>
              </Box>
            </Stack>
            {game.date && (
              <Typography
                sx={{ mt: 1, opacity: 0.78 }}
                textAlign="center"
                variant="body2"
              >
                {formatDateTime(game.date, i18n.resolvedLanguage)}
              </Typography>
            )}
          </Box>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          {(canEditData || canViewStatistics) && (
            <Button
              fullWidth
              onClick={() => setIsRosterDialogOpen(true)}
              startIcon={<GroupIcon />}
              variant="outlined"
            >
              {t("navigation:newUiPages.liveGame.tracker.actions.roster")}
            </Button>
          )}
          {canViewStatistics && (
            <Button
              component={Link}
              fullWidth
              startIcon={<BarChartIcon />}
              to={statisticsPath}
              variant="outlined"
            >
              {t("navigation:newUiPages.liveGame.tracker.actions.stats")}
            </Button>
          )}
          {canEditData && (
            <Button
              fullWidth
              onClick={() => setIsEditModalOpen(true)}
              startIcon={<EditIcon />}
              variant="outlined"
            >
              {t("navigation:newUiPages.liveGame.tracker.actions.edit")}
            </Button>
          )}
          {canEditData && game.status === "ready" && (
            <Button
              disabled={startMutation.isPending}
              fullWidth
              onClick={() => startMutation.mutate()}
              startIcon={<PlayArrowIcon />}
              variant="contained"
            >
              {startMutation.isPending
                ? t("common:action.loading")
                : t("games:detail.startGame")}
            </Button>
          )}
          {canEditData && game.status === "started" && (
            <Button
              color="success"
              fullWidth
              onClick={() => setIsFinishConfirmOpen(true)}
              startIcon={<CheckCircleIcon />}
              variant="outlined"
            >
              {t("navigation:newUiPages.liveGame.tracker.actions.complete")}
            </Button>
          )}
        </Stack>

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
          />
        )}
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
          <Typography gutterBottom>{t("games:detail.endGameConfirm")}</Typography>
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
