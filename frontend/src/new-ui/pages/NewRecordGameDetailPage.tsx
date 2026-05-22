import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../../auth";
import { GameHistorySection } from "../../components/games/detail/GameHistorySection";
import { GameRosterDialog } from "../../components/games/detail/GameRosterDialog";
import AddPlayersToGameModal from "../../components/modals/AddPlayersToGameModal";
import EditGameModal from "../../components/modals/EditGameModal";
import EditPointDialog from "../../components/modals/EditPointDialog";
import LivePointTracker from "../../components/points/LivePointTracker";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import StatusChip from "../../components/shared/StatusChip";
import {
  deleteHalftime,
  finishGame,
  updateGame,
} from "../../services";
import { deletePoint } from "../../services/points";
import type { Halftime, PointWithPlayers } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";
import {
  invalidateGameAfterPointMutation,
  invalidateGameHistory,
  invalidateGameLiveState,
} from "../../utils/queryInvalidation";
import { queryKeys } from "../../utils/queryKeys";
import { useGameDetailPageData } from "../../pages/hooks/useGameDetailPageData";

export default function NewRecordGameDetailPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["navigation", "games", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const queryClient = useQueryClient();

  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointWithPlayers | null>(
    null
  );
  const [deletingPoint, setDeletingPoint] = useState<PointWithPlayers | null>(
    null
  );
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);

  const shouldProtectUi = shouldEnforcePermissions(
    auth.enforcementMode,
    auth.isLoading
  );
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
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
    gameTurnovers,
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

  const deletePointMutation = useMutation({
    mutationFn: (pointId: number) => deletePoint(pointId),
    onSuccess: async () => {
      await invalidateGameAfterPointMutation(queryClient, gameIdNumber);
      setDeletingPoint(null);
    },
  });

  const deleteHalftimeMutation = useMutation({
    mutationFn: (halftimeId: number) => deleteHalftime(halftimeId),
    onSuccess: async () => {
      await invalidateGameAfterPointMutation(queryClient, gameIdNumber);
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

  const confirmDeletePoint = () => {
    if (deletingPoint) {
      deletePointMutation.mutate(deletingPoint.id);
    }
  };

  const handleDeleteHalftime = (halftime: Halftime) => {
    deleteHalftimeMutation.mutate(halftime.id);
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, md: 4 } }}>
      <Stack spacing={2.5}>
        <Button
          component={Link}
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
          to="/record"
        >
          {t("navigation:newUiPages.recordGame.detail.back")}
        </Button>

        <Paper
          elevation={0}
          sx={(theme) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: { xs: 2, sm: 3 },
          })}
        >
          <Stack spacing={2.5}>
            <Stack
              alignItems={{ xs: "flex-start", sm: "center" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1.5}
            >
              <Box>
                <Typography color="text.secondary" variant="overline">
                  {t("navigation:newUiPages.recordGame.detail.eyebrow")}
                </Typography>
                <Typography component="h1" fontWeight={900} variant="h5">
                  {t("navigation:newUiPages.recordGame.detail.heading", {
                    teamName: game.team_name,
                    opponentName: game.opponent_name,
                  })}
                </Typography>
                <Typography color="text.secondary" variant="body2">
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

            <Box
              aria-label={t("navigation:newUiPages.recordGame.detail.score")}
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                p: { xs: 2, sm: 3 },
              }}
            >
              <Typography color="text.secondary" textAlign="center" variant="body2">
                {t("navigation:newUiPages.recordGame.detail.score")}
              </Typography>
              <Stack
                alignItems="center"
                direction="row"
                divider={<Divider flexItem orientation="vertical" />}
                justifyContent="center"
                spacing={{ xs: 2, sm: 4 }}
                sx={{ mt: 1 }}
              >
                <Box sx={{ minWidth: 96, textAlign: "center" }}>
                  <Typography color="text.secondary" variant="body2">
                    {game.team_name}
                  </Typography>
                  <Typography fontWeight={900} variant="h3">
                    {game.our_score}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 96, textAlign: "center" }}>
                  <Typography color="text.secondary" variant="body2">
                    {game.opponent_name}
                  </Typography>
                  <Typography fontWeight={900} variant="h3">
                    {game.opponent_score}
                  </Typography>
                </Box>
              </Stack>
              {game.date && (
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1 }}
                  textAlign="center"
                  variant="body2"
                >
                  {formatDateTime(game.date, i18n.resolvedLanguage)}
                </Typography>
              )}
            </Box>

          </Stack>
        </Paper>

        {competition && (
          <LivePointTracker
            activePoint={activePoint || null}
            activePointStoppages={activePointStoppages}
            activePointTurnovers={activePointTurnovers}
            game={game}
            onPointUpdated={handlePointUpdated}
            players={game.players}
            readOnly={!canEditData}
            teamId={competition.team_id}
          />
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            fullWidth
            onClick={() => setIsRosterDialogOpen(true)}
            startIcon={<GroupIcon />}
            variant="outlined"
          >
            {t("games:detail.roster")}
          </Button>
          {canEditData && (
            <Button
              fullWidth
              onClick={() => setIsEditModalOpen(true)}
              startIcon={<EditIcon />}
              variant="outlined"
            >
              {t("common:action.edit")}
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
              {t("games:detail.endGame")}
            </Button>
          )}
        </Stack>

        {competition && (
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

        <Box component="section">
          <Typography component="h2" fontWeight={800} gutterBottom variant="h6">
            {t("navigation:newUiPages.recordGame.detail.history")}
          </Typography>
          <GameHistorySection
            gameEndedAt={game.end_datetime}
            halftime={game.halftime}
            hasDeleteHalftimeError={deleteHalftimeMutation.isError}
            isDeletingHalftime={deleteHalftimeMutation.isPending}
            onDeleteHalftime={canEditData ? handleDeleteHalftime : undefined}
            onDeletePoint={
              canEditData ? (point) => setDeletingPoint(point) : undefined
            }
            onEditPoint={
              canEditData ? (point) => setEditingPoint(point) : undefined
            }
            points={game.points}
            turnovers={gameTurnovers}
          />
        </Box>
      </Stack>

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
              : t("games:detail.endGame")}
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

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setDeletingPoint(null)}
        open={canEditData && !!deletingPoint}
      >
        <DialogTitle>{t("games:detail.deletePointTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("games:detail.deletePointConfirm", {
              pointNumber: deletingPoint?.point_number,
            })}
          </Typography>
          {deletePointMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("games:detail.deletePointError")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={deletePointMutation.isPending}
            onClick={() => setDeletingPoint(null)}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            color="error"
            disabled={deletePointMutation.isPending}
            onClick={confirmDeletePoint}
            variant="contained"
          >
            {deletePointMutation.isPending
              ? t("games:detail.deletingPoint")
              : t("games:detail.deletePoint")}
          </Button>
        </DialogActions>
      </Dialog>

      {canEditData && editingPoint && competition && (
        <EditPointDialog
          onClose={() => setEditingPoint(null)}
          onSuccess={() => {
            handlePointUpdated();
            setEditingPoint(null);
          }}
          open={!!editingPoint}
          players={competition.players}
          point={editingPoint}
          teamId={competition.team_id}
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
