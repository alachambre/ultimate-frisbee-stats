import { useState, useMemo } from "react";
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
  Chip,
  Divider,
  Grid,
  alpha,
  Collapse,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import { getGame, deleteGame, finishGame, updateGame, removePlayersFromGame, getLiveGameStatistics } from "../services";
import { getRunningPoint, deletePoint } from "../services/points";
import { getCompetition } from "../services/competitions";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import EditGameModal from "../components/modals/EditGameModal";
import LivePointTracker from "../components/points/LivePointTracker";
import PointHistoryList from "../components/points/PointHistoryList";
import EditPointDialog from "../components/modals/EditPointDialog";
import PlayersGrid from "../components/players/PlayersGrid";
import GamePlayerStatsCard from "../components/players/GamePlayerStatsCard";
import AddPlayersToGameModal from "../components/modals/AddPlayersToGameModal";
import GameTimer from "../components/games/GameTimer";
import type { PointWithPlayers, Player, PlayerGameStats } from "../types";

export default function GameDetailPage() {
  const { t, i18n } = useTranslation(["games", "players", "common"]);
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointWithPlayers | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PointWithPlayers | null>(null);
  const [showPlayers, setShowPlayers] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "points" | "time">("name");

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGame(Number(gameId)),
    enabled: !!gameId,
  });

  // Poll for running point every 5 seconds while game is started
  const { data: runningPoint } = useQuery({
    queryKey: ["runningPoint", gameId],
    queryFn: () => getRunningPoint(Number(gameId)),
    enabled: !!gameId && game?.status === "started",
    refetchInterval: game?.status === "started" ? 5000 : false,
  });

  // Fetch game statistics - poll every 5s for started games, fetch once for ended games
  const { data: liveStats } = useQuery({
    queryKey: ["liveGameStats", gameId],
    queryFn: () => getLiveGameStatistics(Number(gameId)),
    enabled: !!gameId && (game?.status === "started" || game?.status === "ended"),
    refetchInterval: game?.status === "started" ? 5000 : false, // Only poll for started games
  });

  // Get competition data to access players for point tracking
  const { data: competition } = useQuery({
    queryKey: ["competition", game?.competition_id],
    queryFn: () => getCompetition(game!.competition_id),
    enabled: !!game?.competition_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGame(Number(gameId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      navigate("/games");
    },
  });

  const startMutation = useMutation({
    mutationFn: () => updateGame(Number(gameId), { status: "started" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });

  const finishMutation = useMutation({
    mutationFn: () => finishGame(Number(gameId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setIsFinishConfirmOpen(false);
    },
  });

  const deletePointMutation = useMutation({
    mutationFn: (pointId: number) => deletePoint(pointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      setDeletingPoint(null);
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (playerId: number) =>
      removePlayersFromGame(Number(gameId), [playerId]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", gameId] });
      setPlayerToRemove(null);
    },
  });

  // Helper function to determine highlight based on playing time
  const getHighlight = (stats: PlayerGameStats, allStats: PlayerGameStats[]): "high" | "low" | null => {
    // Only highlight if player has actually played
    if (stats.effective_time_seconds === 0) return null;

    // Get all players who have played (time > 0)
    const playersWithTime = allStats.filter((s) => s.effective_time_seconds > 0);
    if (playersWithTime.length < 3) return null; // Need at least 3 players (reduced from 4 for testing)

    // Sort by time (descending)
    const sortedByTime = [...playersWithTime].sort((a, b) => b.effective_time_seconds - a.effective_time_seconds);

    // For small rosters, use simpler logic: top 33% and bottom 33%
    const topCount = Math.max(1, Math.floor(sortedByTime.length / 3));
    const bottomCount = Math.max(1, Math.floor(sortedByTime.length / 3));

    const topThreshold = sortedByTime[topCount - 1]?.effective_time_seconds || 0;
    const bottomThreshold = sortedByTime[sortedByTime.length - bottomCount]?.effective_time_seconds || 0;

    // Highlight top players (equal or above top threshold)
    if (stats.effective_time_seconds >= topThreshold && stats.effective_time_seconds > bottomThreshold) {
      return "high";
    }

    // Highlight bottom players (equal or below bottom threshold)
    if (stats.effective_time_seconds <= bottomThreshold && stats.effective_time_seconds < topThreshold) {
      return "low";
    }

    return null;
  };

  // Helper function to sort stats
  const sortStats = (stats: PlayerGameStats[]): PlayerGameStats[] => {
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
  };

  // Sorted stats by gender
  const sortedMenStats = useMemo(() => {
    if (!liveStats) return [];
    const menIds = game?.players.filter((p) => p.gender === "M").map((p) => p.id) || [];
    return sortStats(liveStats.filter((s) => menIds.includes(s.player_id)));
  }, [liveStats, game?.players, sortBy]);

  const sortedWomenStats = useMemo(() => {
    if (!liveStats) return [];
    const womenIds = game?.players.filter((p) => p.gender === "W").map((p) => p.id) || [];
    return sortStats(liveStats.filter((s) => womenIds.includes(s.player_id)));
  }, [liveStats, game?.players, sortBy]);

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
    queryClient.invalidateQueries({ queryKey: ["game", gameId] });
    queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
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

  const handleRemovePlayer = (player: Player) => {
    setPlayerToRemove(player);
  };

  const confirmRemovePlayer = () => {
    if (playerToRemove) {
      removePlayerMutation.mutate(playerToRemove.id);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          component={Link}
          to="/games"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          {t("common:action.back")}
        </Button>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexDirection={{ xs: "column", sm: "row" }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              vs {game.opponent_name}
            </Typography>
            <Box display="flex" gap={1} alignItems="center" mb={1}>
              <CalendarTodayIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {game.date
                  ? new Date(game.date).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : t("games:detail.dateNotSet")}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={t(`games:status.${game.status}`)}
                color={game.status === "started" ? "primary" : "default"}
                size="small"
              />
              <Chip label={game.team_name} variant="outlined" size="small" />
            </Box>
          </Box>
          <Box display="flex" gap={1}>
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
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {game.status === "ended" ? t("games:detail.finalScore") : t("games:detail.score")}
          </Typography>
          <Typography variant="h2" fontWeight="bold">
            {game.our_score} - {game.opponent_score}
          </Typography>

          {/* Game Timer */}
          {game.start_datetime && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {t("games:detail.gameDuration")}
              </Typography>
              <GameTimer
                startDatetime={game.start_datetime}
                endDatetime={game.end_datetime}
              />
            </Box>
          )}

          <Box mt={2} display="flex" justifyContent="center" gap={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {game.team_name}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {game.our_score}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="body2" color="text.secondary">
                {game.opponent_name}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {game.opponent_score}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Comments Section */}
      {game.comments && (
        <Paper sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t("games:detail.comments")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {game.comments}
          </Typography>
        </Paper>
      )}

      {/* Selected Players Section */}
      {competition && (
        <Paper sx={{ mb: 3 }}>
          <Box
            p={3}
            borderBottom={showPlayers ? "1px solid" : "none"}
            borderColor="divider"
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6">
                  {t("games:detail.rosterSection", { count: game.players.length })}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowPlayers(!showPlayers)}
                  aria-label={showPlayers ? t("games:detail.hidePlayers") : t("games:detail.showPlayers")}
                >
                  {showPlayers ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddPlayersModalOpen(true)}
                size="small"
                disabled={game.status === "ended"}
              >
                {t("games:detail.addPlayers")}
              </Button>
            </Box>
          </Box>

          <Collapse in={showPlayers}>
            <Box p={3}>
              {/* Sorting Controls - show when we have stats to display */}
              {(game.status === "started" || game.status === "ended") && liveStats && liveStats.length > 0 && (
                <Box mb={3}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
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
                </Box>
              )}
              <Grid container spacing={3}>
                {/* Men Column */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderColor: "primary.main",
                      borderWidth: 2,
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.02),
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "primary.main",
                        fontWeight: "bold",
                        mb: 2,
                      }}
                    >
                      {t("games:detail.men")} ({game.players.filter((p) => p.gender === "M").length})
                    </Typography>
                    {game.players.filter((p) => p.gender === "M").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t("players:empty.noPlayers")}
                      </Typography>
                    ) : (game.status === "started" || game.status === "ended") && sortedMenStats.length > 0 ? (
                      <Grid container spacing={2}>
                        {sortedMenStats.map((stats) => (
                          <Grid size={{ xs: 6 }} key={stats.player_id}>
                            <GamePlayerStatsCard
                              stats={stats}
                              highlight={liveStats ? getHighlight(stats, liveStats) : null}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <PlayersGrid
                        players={game.players
                          .filter((p) => p.gender === "M")
                          .sort((a, b) => a.name.localeCompare(b.name))}
                        onDeletePlayer={game.status === "ended" ? undefined : handleRemovePlayer}
                      />
                    )}
                  </Paper>
                </Grid>

                {/* Women Column */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderColor: "secondary.main",
                      borderWidth: 2,
                      backgroundColor: (theme) =>
                        alpha(theme.palette.secondary.main, 0.02),
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "secondary.main",
                        fontWeight: "bold",
                        mb: 2,
                      }}
                    >
                      {t("games:detail.women")} ({game.players.filter((p) => p.gender === "W").length})
                    </Typography>
                    {game.players.filter((p) => p.gender === "W").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t("players:empty.noPlayers")}
                      </Typography>
                    ) : (game.status === "started" || game.status === "ended") && sortedWomenStats.length > 0 ? (
                      <Grid container spacing={2}>
                        {sortedWomenStats.map((stats) => (
                          <Grid size={{ xs: 6 }} key={stats.player_id}>
                            <GamePlayerStatsCard
                              stats={stats}
                              highlight={liveStats ? getHighlight(stats, liveStats) : null}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <PlayersGrid
                        players={game.players
                          .filter((p) => p.gender === "W")
                          .sort((a, b) => a.name.localeCompare(b.name))}
                        onDeletePlayer={game.status === "ended" ? undefined : handleRemovePlayer}
                      />
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Live Point Tracker */}
      {competition && (
        <LivePointTracker
          game={game}
          activePoint={runningPoint || null}
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

      {/* Remove Player Confirmation Dialog */}
      <Dialog
        open={!!playerToRemove}
        onClose={() => setPlayerToRemove(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("games:detail.removePlayerTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("games:detail.removePlayerConfirm", { playerName: playerToRemove?.name })}
          </Typography>
          {removePlayerMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("games:detail.removePlayerError")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPlayerToRemove(null)}
            disabled={removePlayerMutation.isPending}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={confirmRemovePlayer}
            variant="contained"
            color="error"
            disabled={removePlayerMutation.isPending}
          >
            {removePlayerMutation.isPending ? t("games:detail.removingPlayer") : t("games:detail.removePlayer")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Players to Game Modal */}
      {competition && (
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
