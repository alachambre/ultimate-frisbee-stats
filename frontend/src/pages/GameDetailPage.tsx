import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { deleteGame, deleteHalftime, finishGame, updateGame } from "../services";
import { deletePoint } from "../services/points";
import { GameHeaderActions } from "../components/games/detail/GameHeaderActions";
import { GameHistorySection } from "../components/games/detail/GameHistorySection";
import { GameRosterDialog } from "../components/games/detail/GameRosterDialog";
import { GameScorePanel } from "../components/games/detail/GameScorePanel";
import GameTrendsSection from "../components/statistics/GameTrendsSection";
import AddPlayersToGameModal from "../components/modals/AddPlayersToGameModal";
import EditGameModal from "../components/modals/EditGameModal";
import EditPointDialog from "../components/modals/EditPointDialog";
import LivePointTracker from "../components/points/LivePointTracker";
import ErrorState from "../components/shared/ErrorState";
import LoadingState from "../components/shared/LoadingState";
import PermissionNotice from "../components/shared/PermissionNotice";
import type { Halftime, PointWithPlayers } from "../types";
import { shouldEnforcePermissions, useAuth } from "../auth";
import { queryKeys } from "../utils/queryKeys";
import { buildGamePointTimelineFromPoints } from "../utils/gameTimeline";
import { useGameDetailPageData } from "./hooks/useGameDetailPageData";

export default function GameDetailPage() {
  const auth = useAuth();
  const { t } = useTranslation(["games", "players", "common", "statistics"]);
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointWithPlayers | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PointWithPlayers | null>(null);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canEditData = !shouldProtectUi || auth.capabilities.canEditData;
  const canViewStatistics = !shouldProtectUi || auth.capabilities.canViewStatistics;
  const showSpectatorNotice = shouldProtectUi && !canEditData;

  const {
    gameIdNumber,
    game,
    isLoading,
    error,
    activePoint,
    liveStatsByPlayerId,
    competition,
    competitionPath,
    rosterPlayersForTabs,
    getRosterPlayerHighlight,
  } = useGameDetailPageData(gameId, canViewStatistics);

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(gameIdNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      navigate(competitionPath);
    },
  });

  const startMutation = useMutation({
    mutationFn: () => updateGame(gameIdNumber, { status: "started" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => finishGame(gameIdNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      setIsFinishConfirmOpen(false);
    },
  });

  const deletePointMutation = useMutation({
    mutationFn: (pointId: number) => deletePoint(pointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(gameIdNumber) });
      setDeletingPoint(null);
    },
  });

  const deleteHalftimeMutation = useMutation({
    mutationFn: (halftimeId: number) => deleteHalftime(halftimeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
    },
  });

  if (isLoading) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (error || !game) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleFinish = () => {
    finishMutation.mutate();
  };

  const handlePointUpdated = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activePoint(gameIdNumber) });
  };

  const handleDeletePoint = (point: PointWithPlayers) => {
    setDeletingPoint(point);
  };

  const confirmDeletePoint = () => {
    if (deletingPoint) {
      deletePointMutation.mutate(deletingPoint.id);
    }
  };

  const handleDeleteHalftime = (halftime: Halftime) => {
    deleteHalftimeMutation.mutate(halftime.id);
  };

  const completedGameTimeline =
    game.status === "ended"
      ? buildGamePointTimelineFromPoints(game.id, game.points, game.halftime)
      : undefined;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <GameHeaderActions
        competitionPath={competitionPath}
        teamName={game.team_name}
        opponentName={game.opponent_name}
        canEditData={canEditData}
        canViewStatistics={Boolean(competition) && canViewStatistics}
        onViewStatistics={() => {
          if (!competition) return;
          navigate(
                      `/statistics?teamId=${competition.team_id}&competitionIds=${competition.id}&gameIds=${game.id}`
          );
        }}
        onOpenRoster={() => setIsRosterDialogOpen(true)}
        onOpenEdit={() => setIsEditModalOpen(true)}
        onStart={() => startMutation.mutate()}
        onOpenFinish={() => setIsFinishConfirmOpen(true)}
        onOpenDelete={() => setIsDeleteConfirmOpen(true)}
        isStartPending={startMutation.isPending}
        gameStatus={game.status}
      />

      {showSpectatorNotice && (
        <PermissionNotice
          title={t("common:access.spectatorModeTitle")}
          description={t("common:access.gameSpectatorDescription")}
          sx={{ mb: 3 }}
        />
      )}

      <GameScorePanel
        teamName={game.team_name}
        opponentName={game.opponent_name}
        ourScore={game.our_score}
        opponentScore={game.opponent_score}
        startDatetime={game.start_datetime}
        endDatetime={game.end_datetime}
        comments={game.comments}
      >
        {completedGameTimeline && completedGameTimeline.points.length > 0 && (
          <Accordion
            disableGutters
            elevation={0}
            square
            sx={{
              "&::before": { display: "none" },
              bgcolor: "transparent",
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="game-trends-content"
              id="game-trends-header"
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {t("statistics:charts.title")}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0, pb: 0 }}>
              <GameTrendsSection
                timeline={completedGameTimeline}
                isLoading={false}
                embedded
              />
            </AccordionDetails>
          </Accordion>
        )}
      </GameScorePanel>

      {competition && (
        <GameRosterDialog
          open={isRosterDialogOpen}
          onClose={() => setIsRosterDialogOpen(false)}
          onOpenAddPlayers={canEditData ? () => setIsAddPlayersModalOpen(true) : undefined}
          canManageRoster={canEditData}
          disabled={!canEditData || game.status === "ended"}
          players={rosterPlayersForTabs}
          liveStatsByPlayerId={liveStatsByPlayerId}
          getHighlight={getRosterPlayerHighlight}
        />
      )}

      {competition && (
        <LivePointTracker
          game={game}
          activePoint={activePoint || null}
          players={game.players}
          teamId={competition.team_id}
          onPointUpdated={handlePointUpdated}
          readOnly={!canEditData}
        />
      )}

      <GameHistorySection
        points={game.points}
        halftime={game.halftime}
        gameEndedAt={game.end_datetime}
        onEditPoint={canEditData ? (point) => setEditingPoint(point) : undefined}
        onDeletePoint={canEditData ? handleDeletePoint : undefined}
        onDeleteHalftime={canEditData ? handleDeleteHalftime : undefined}
        isDeletingHalftime={deleteHalftimeMutation.isPending}
        hasDeleteHalftimeError={deleteHalftimeMutation.isError}
      />

      <Dialog open={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("games:detail.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{t("games:detail.deleteConfirm")}</Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteConfirmOpen(false)} disabled={deleteMutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending
              ? t("common:action.loading")
              : t("games:detail.deleteGameButton")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isFinishConfirmOpen} onClose={() => setIsFinishConfirmOpen(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setIsFinishConfirmOpen(false)} disabled={finishMutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button onClick={handleFinish} variant="contained" color="success" disabled={finishMutation.isPending}>
            {finishMutation.isPending ? t("common:action.loading") : t("games:detail.endGame")}
          </Button>
        </DialogActions>
      </Dialog>

      {canEditData && isEditModalOpen && (
        <EditGameModal
          key={game.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          game={game}
        />
      )}

      <Dialog open={canEditData && !!deletingPoint} onClose={() => setDeletingPoint(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("games:detail.deletePointTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("games:detail.deletePointConfirm", { pointNumber: deletingPoint?.point_number })}
          </Typography>
          {deletePointMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("games:detail.deletePointError")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingPoint(null)} disabled={deletePointMutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={confirmDeletePoint}
            variant="contained"
            color="error"
            disabled={deletePointMutation.isPending}
          >
            {deletePointMutation.isPending
              ? t("games:detail.deletingPoint")
              : t("games:detail.deletePoint")}
          </Button>
        </DialogActions>
      </Dialog>

      {canEditData && editingPoint && competition && (
        <EditPointDialog
          open={!!editingPoint}
          onClose={() => setEditingPoint(null)}
          point={editingPoint}
          players={competition.players}
          teamId={competition.team_id}
          onSuccess={() => {
            handlePointUpdated();
            setEditingPoint(null);
          }}
        />
      )}

      {competition && canEditData && isAddPlayersModalOpen && (
        <AddPlayersToGameModal
          isOpen={isAddPlayersModalOpen}
          onClose={() => setIsAddPlayersModalOpen(false)}
          gameId={gameIdNumber}
          competitionId={competition.id}
          currentPlayerIds={game.players.map((player) => player.id)}
        />
      )}
    </Container>
  );
}
