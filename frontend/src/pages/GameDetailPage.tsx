import { useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import GroupIcon from "@mui/icons-material/Group";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import CloseIcon from "@mui/icons-material/Close";
import CommentIcon from "@mui/icons-material/Comment";
import { getGame, deleteGame, finishGame, updateGame, getLiveGameStatistics } from "../services";
import { getActivePoint, deletePoint } from "../services/points";
import { getCompetition } from "../services/competitions";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import EditGameModal from "../components/modals/EditGameModal";
import LivePointTracker from "../components/points/LivePointTracker";
import PointHistoryList from "../components/points/PointHistoryList";
import EditPointDialog from "../components/modals/EditPointDialog";
import PlayerSelectionList from "../components/shared/PlayerSelectionList";
import AddPlayersToGameModal from "../components/modals/AddPlayersToGameModal";
import GameTimer from "../components/games/GameTimer";
import type { PointWithPlayers, Player, PlayerGameStats } from "../types";
import { getPlayerHighlight } from "../utils/playerHighlighting";
import { queryKeys } from "../utils/queryKeys";

export default function GameDetailPage() {
  const { t } = useTranslation(["games", "players", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointWithPlayers | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PointWithPlayers | null>(null);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "points" | "time">("name");
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false);
  const gameIdNumber = Number(gameId);
  const gameIdValid = Number.isFinite(gameIdNumber);

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.game(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGame(gameIdNumber),
    enabled: gameIdValid,
  });

  // Check if there's a scored point (no active point to poll for)
  const hasScoredPoint = useMemo(() => {
    return game?.points.some((p) => p.status === "scored") ?? false;
  }, [game?.points]);

  // Poll for active point (ready or running) every 5 seconds while game is started
  // Disable if there's a scored point (backend will return 404)
  const { data: activePoint } = useQuery({
    queryKey: queryKeys.activePoint(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getActivePoint(gameIdNumber),
    enabled: gameIdValid && game?.status === "started" && !hasScoredPoint,
    refetchInterval: game?.status === "started" && !hasScoredPoint ? 5000 : false,
    retry: false, // Don't retry on 404 (no active point)
  });

  // Fetch game statistics - poll every 5s for started games, fetch once for ended games
  const { data: liveStats } = useQuery({
    queryKey: queryKeys.liveStats(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getLiveGameStatistics(gameIdNumber),
    enabled: gameIdValid && (game?.status === "started" || game?.status === "ended"),
    refetchInterval: game?.status === "started" ? 5000 : false, // Only poll for started games
  });

  // Get competition data to access players for point tracking
  const competitionId = game?.competition_id;
  const { data: competition } = useQuery({
    queryKey: queryKeys.competition(competitionId ?? 0),
    queryFn: () => getCompetition(competitionId as number),
    enabled: !!competitionId,
  });
  const competitionPath = competitionId ? `/competitions/${competitionId}` : "/competitions";

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(Number(gameId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      navigate(competitionPath);
    },
  });

  const startMutation = useMutation({
    mutationFn: () => updateGame(Number(gameId), { status: "started" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameIdNumber) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => finishGame(Number(gameId)),
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

  // Helper function to sort stats
  const sortStats = useCallback((stats: PlayerGameStats[]): PlayerGameStats[] => {
    const sorted = [...stats];
    switch (sortBy) {
      case "points":
        return sorted.sort((a, b) => b.points_played - a.points_played || a.player_name.localeCompare(b.player_name));
      case "time":
        return sorted.sort((a, b) => b.effective_time_seconds - a.effective_time_seconds || a.player_name.localeCompare(b.player_name));
      case "name":
      default:
        return sorted.sort((a, b) => a.player_name.localeCompare(b.player_name));
    }
  }, [sortBy]);

  const liveStatsByPlayerId = useMemo(
    () => new Map((liveStats || []).map((stats) => [stats.player_id, stats])),
    [liveStats]
  );

  const menPlayers = useMemo(
    () =>
      (game?.players ?? [])
        .filter((player) => player.gender === "M")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [game?.players]
  );
  const womenPlayers = useMemo(
    () =>
      (game?.players ?? [])
        .filter((player) => player.gender === "W")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [game?.players]
  );
  const rosterPlayersForTabs = useMemo(() => {
    const allPlayers = game?.players ?? [];
    if (allPlayers.length === 0) {
      return [];
    }

    const hasLiveStats =
      (game?.status === "started" || game?.status === "ended") &&
      !!liveStats &&
      liveStats.length > 0;

    if (!hasLiveStats) {
      return [...allPlayers].sort((a, b) => a.name.localeCompare(b.name));
    }

    const playersById = new Map(allPlayers.map((player) => [player.id, player]));
    const menIds = new Set(allPlayers.filter((player) => player.gender === "M").map((player) => player.id));
    const womenIds = new Set(allPlayers.filter((player) => player.gender === "W").map((player) => player.id));

    const sortedMenStats = sortStats(liveStats.filter((stats) => menIds.has(stats.player_id)));
    const sortedWomenStats = sortStats(liveStats.filter((stats) => womenIds.has(stats.player_id)));

    const buildGenderPlayers = (
      gender: "M" | "W",
      sortedStats: PlayerGameStats[]
    ): Player[] => {
      const orderedIds = sortedStats.map((stats) => stats.player_id);
      const missingIds = allPlayers
        .filter((player) => player.gender === gender && !orderedIds.includes(player.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((player) => player.id);

      return [...orderedIds, ...missingIds]
        .map((playerId) => playersById.get(playerId))
        .filter((player): player is Player => Boolean(player));
    };

    return [
      ...buildGenderPlayers("M", sortedMenStats),
      ...buildGenderPlayers("W", sortedWomenStats),
    ];
  }, [game?.players, game?.status, liveStats, sortStats]);
  const getRosterPlayerHighlight = (playerId: number): "high" | "low" | null => {
    if (!liveStats || liveStats.length < 5) {
      return null;
    }
    const playerStats = liveStatsByPlayerId.get(playerId);
    if (!playerStats) {
      return null;
    }
    return getPlayerHighlight(playerStats, liveStats);
  };

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

  const handleEditPoint = (point: PointWithPlayers) => {
    setEditingPoint(point);
  };

  const handleDeletePoint = (point: PointWithPlayers) => {
    setDeletingPoint(point);
  };

  const confirmDeletePoint = () => {
    if (deletingPoint) {
      deletePointMutation.mutate(deletingPoint.id);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={2}>
        <Button
          component={Link}
          to={competitionPath}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          {t("common:action.back")}
        </Button>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight="bold" mb={2}>
            {game.team_name} vs {game.opponent_name}
          </Typography>
          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => setIsRosterDialogOpen(true)}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("games:detail.roster")}
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() =>
                competition &&
                navigate(
                  `/statistics?teamId=${competition.team_id}&mode=competition&competitionId=${competition.id}&gameId=${game.id}`
                )
              }
              disabled={!competition}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("games:detail.viewStatistics")}
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditModalOpen(true)}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("common:action.edit")}
              </Box>
            </Button>
            {game.status === "ready" && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                sx={{
                  minWidth: { xs: "auto", sm: "auto" },
                }}
              >
                <Box component="span">
                  {startMutation.isPending ? t("common:action.loading") : t("games:detail.startGame")}
                </Box>
              </Button>
            )}
            {game.status === "started" && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setIsFinishConfirmOpen(true)}
                sx={{
                  minWidth: { xs: "auto", sm: "auto" },
                  "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {t("games:detail.endGame")}
                </Box>
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
              sx={{
                minWidth: { xs: "auto", sm: "auto" },
                "& .MuiButton-startIcon": { margin: { xs: 0, sm: "0 8px 0 -4px" } },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("common:action.delete")}
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Score Section */}
      <Paper sx={{ mb: 3 }}>
        <Box p={4} textAlign="center">
          <Box display="flex" justifyContent="center" gap={4}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {game.team_name}
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {game.our_score}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {game.opponent_name}
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {game.opponent_score}
              </Typography>
            </Box>
          </Box>

          {/* Game Timer */}
          {game.start_datetime && (
            <Box mt={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("games:detail.gameDuration")}
              </Typography>
              <GameTimer
                startDatetime={game.start_datetime}
                endDatetime={game.end_datetime}
              />
            </Box>
          )}

          {/* Game Comment */}
          {game.comments && (
            <Box mt={3}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                  textAlign: 'left',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CommentIcon
                    fontSize="small"
                    sx={{ color: 'primary.main' }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ color: 'primary.main' }}
                  >
                    {t("games:detail.comments")}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {game.comments}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Roster Dialog */}
      {competition && (
        <Dialog
          open={isRosterDialogOpen}
          onClose={() => setIsRosterDialogOpen(false)}
          maxWidth="md"
          fullWidth
          fullScreen={false}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {t("games:detail.rosterSection", { count: game.players.length })}
              </Typography>
              <IconButton
                edge="end"
                color="inherit"
                onClick={() => setIsRosterDialogOpen(false)}
                aria-label={t("common:ariaLabel.close")}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box mb={2} display="flex" gap={1} flexWrap="wrap">
              <Chip
                icon={<GroupIcon />}
                label={t("games:detail.totalPlayers", { count: game.players.length })}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<MaleIcon />}
                label={t("games:detail.menCount", { count: menPlayers.length })}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<FemaleIcon />}
                label={t("games:detail.womenCount", { count: womenPlayers.length })}
                variant="outlined"
                size="small"
              />
            </Box>

            {/* Controls Row - Sorting + Add Players Button */}
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="center" gap={2}>
              {/* Sorting Controls - show when we have stats to display */}
              {(game.status === "started" || game.status === "ended") && liveStats && liveStats.length > 0 ? (
                <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 200 } }}>
                  <InputLabel id="sort-by-label">{t("games:detail.sortBy")}</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    value={sortBy}
                    label={t("games:detail.sortBy")}
                    onChange={(e) => setSortBy(e.target.value as "name" | "points" | "time")}
                  >
                    <MenuItem value="name">{t("games:detail.sortByName")}</MenuItem>
                    <MenuItem value="points">{t("games:detail.sortByPoints")}</MenuItem>
                    <MenuItem value="time">{t("games:detail.sortByTime")}</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Box />
              )}

              {/* Add Players Button - icon only on mobile, with text on desktop */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddPlayersModalOpen(true)}
                disabled={game.status === "ended"}
                sx={{
                  minWidth: { xs: "auto", sm: "auto" },
                  height: 40, // Match the FormControl height
                  "& .MuiButton-startIcon": {
                    margin: { xs: 0, sm: "0 8px 0 -4px" }
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {t("games:detail.addPlayers")}
                </Box>
              </Button>
            </Box>
            <PlayerSelectionList
              players={rosterPlayersForTabs}
              selectedIds={[]}
              onToggle={() => {}}
              menLabel={t("games:detail.men")}
              womenLabel={t("games:detail.women")}
              emptyMenLabel={t("players:empty.noPlayers")}
              emptyWomenLabel={t("players:empty.noPlayers")}
              getHighlight={getRosterPlayerHighlight}
              highlightSecondary={false}
              preserveOrder
              renderPrimary={(player) => {
                const stats = liveStatsByPlayerId.get(player.id);
                if (!stats) {
                  return player.name;
                }
                return `${player.name} - ${stats.points_played} pts`;
              }}
              renderSecondary={(player) => {
                const stats = liveStatsByPlayerId.get(player.id);
                if (!stats) {
                  return "";
                }
                return `${Math.floor(stats.effective_time_seconds / 60)} min`;
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Live Point Tracker */}
      {competition && (
        <LivePointTracker
          game={game}
          activePoint={activePoint || null}
          players={game.players}
          teamId={competition.team_id}
          onPointUpdated={handlePointUpdated}
        />
      )}

      {/* Points Section */}
      <Paper>
        <Box p={3} borderBottom="1px solid" borderColor="divider">
          <Typography variant="h6">
            {t("games:detail.points")} ({game.points.length})
          </Typography>
        </Box>

        <Box p={3}>
          <PointHistoryList
            points={game.points}
            onEditPoint={handleEditPoint}
            onDeletePoint={handleDeletePoint}
          />
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("games:detail.deleteConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("games:detail.deleteConfirm")}
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteConfirmOpen(false)}
            disabled={deleteMutation.isPending}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("common:action.loading") : t("games:detail.deleteGameButton")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Game Confirmation Dialog */}
      <Dialog
        open={isFinishConfirmOpen}
        onClose={() => setIsFinishConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
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
            onClick={() => setIsFinishConfirmOpen(false)}
            disabled={finishMutation.isPending}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={handleFinish}
            variant="contained"
            color="success"
            disabled={finishMutation.isPending}
          >
            {finishMutation.isPending ? t("common:action.loading") : t("games:detail.endGame")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Game Modal */}
      {isEditModalOpen && (
        <EditGameModal
          key={game.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          game={game}
        />
      )}

      {/* Delete Point Confirmation Dialog */}
      <Dialog
        open={!!deletingPoint}
        onClose={() => setDeletingPoint(null)}
        maxWidth="sm"
        fullWidth
      >
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
          <Button
            onClick={() => setDeletingPoint(null)}
            disabled={deletePointMutation.isPending}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={confirmDeletePoint}
            variant="contained"
            color="error"
            disabled={deletePointMutation.isPending}
          >
            {deletePointMutation.isPending ? t("games:detail.deletingPoint") : t("games:detail.deletePoint")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Point Dialog */}
      {editingPoint && competition && (
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

      {/* Add Players to Game Modal */}
      {competition && isAddPlayersModalOpen && (
        <AddPlayersToGameModal
          isOpen={isAddPlayersModalOpen}
          onClose={() => setIsAddPlayersModalOpen(false)}
          gameId={Number(gameId)}
          competitionId={competition.id}
          currentPlayerIds={game.players.map((p) => p.id)}
        />
      )}
    </Container>
  );
}
