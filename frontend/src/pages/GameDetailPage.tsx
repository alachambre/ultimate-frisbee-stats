import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AddIcon from "@mui/icons-material/Add";
import { getGame, deleteGame, finishGame, updateGame, removePlayersFromGame } from "../services";
import { getRunningPoint, deletePoint } from "../services/points";
import { getCompetition } from "../services/competitions";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import EditGameModal from "../components/modals/EditGameModal";
import LivePointTracker from "../components/points/LivePointTracker";
import PointHistoryList from "../components/points/PointHistoryList";
import EditPointDialog from "../components/modals/EditPointDialog";
import PlayersGrid from "../components/players/PlayersGrid";
import AddPlayersToGameModal from "../components/modals/AddPlayersToGameModal";
import GameTimer from "../components/games/GameTimer";
import type { PointWithPlayers, Player } from "../types";

export default function GameDetailPage() {
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

  if (isLoading) {
    return <LoadingState message="Loading game..." />;
  }

  if (error || !game) {
    return <ErrorState message="Error loading game. Please try again." />;
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
          Back to Games
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
                  ? new Date(game.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Date not set"}
              </Typography>
            </Box>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={
                  game.status === "ready"
                    ? "Not Started"
                    : game.status === "started"
                    ? "Ongoing"
                    : "Finished"
                }
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
                Edit
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
                  {startMutation.isPending ? "Starting..." : "Start Game"}
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
                  End Game
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
                Delete
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Score Section */}
      <Paper sx={{ mb: 3 }}>
        <Box p={4} textAlign="center">
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {game.status === "ended" ? "Final Score" : "Score"}
          </Typography>
          <Typography variant="h2" fontWeight="bold">
            {game.our_score} - {game.opponent_score}
          </Typography>

          {/* Game Timer */}
          {game.start_datetime && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Game Duration
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
            Comments
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
                  Players ({game.players.length})
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setShowPlayers(!showPlayers)}
                  aria-label={showPlayers ? "Hide players" : "Show players"}
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
                Add Players
              </Button>
            </Box>
          </Box>

          <Collapse in={showPlayers}>
            <Box p={3}>
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
                      Men ({game.players.filter((p) => p.gender === "M").length})
                    </Typography>
                    {game.players.filter((p) => p.gender === "M").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No male players in roster
                      </Typography>
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
                      Women ({game.players.filter((p) => p.gender === "W").length})
                    </Typography>
                    {game.players.filter((p) => p.gender === "W").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No female players in roster
                      </Typography>
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
            Point History ({game.points.length})
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
        <DialogTitle>Delete Game?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Delete this game? This will also delete all points.
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error deleting game. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteConfirmOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Game"}
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
        <DialogTitle>End Game?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Mark game as ended? This cannot be undone.
          </Typography>
          {finishMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error ending game. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsFinishConfirmOpen(false)}
            disabled={finishMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinish}
            variant="contained"
            color="success"
            disabled={finishMutation.isPending}
          >
            {finishMutation.isPending ? "Ending..." : "End Game"}
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
        <DialogTitle>Delete Point?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Delete Point #{deletingPoint?.point_number}? This cannot be undone.
          </Typography>
          {deletePointMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error deleting point. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletingPoint(null)}
            disabled={deletePointMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeletePoint}
            variant="contained"
            color="error"
            disabled={deletePointMutation.isPending}
          >
            {deletePointMutation.isPending ? "Deleting..." : "Delete Point"}
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
        <DialogTitle>Remove Player from Game?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Remove "{playerToRemove?.name}" from this game? This will not delete
            the player from the competition roster.
          </Typography>
          {removePlayerMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error removing player from game. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPlayerToRemove(null)}
            disabled={removePlayerMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmRemovePlayer}
            variant="contained"
            color="error"
            disabled={removePlayerMutation.isPending}
          >
            {removePlayerMutation.isPending ? "Removing..." : "Remove Player"}
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
