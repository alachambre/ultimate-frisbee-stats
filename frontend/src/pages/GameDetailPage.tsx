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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { getGame, deleteGame, finishGame } from "../services";
import { getActivePoint, deletePoint } from "../services/points";
import { getCompetition } from "../services/competitions";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import EditGameModal from "../components/modals/EditGameModal";
import LivePointTracker from "../components/points/LivePointTracker";
import PointHistoryList from "../components/points/PointHistoryList";
import EditPointDialog from "../components/modals/EditPointDialog";
import type { PointWithPlayers } from "../types";

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PointWithPlayers | null>(null);
  const [deletingPoint, setDeletingPoint] = useState<PointWithPlayers | null>(null);

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGame(Number(gameId)),
    enabled: !!gameId,
  });

  // Poll for active point every 5 seconds while game is in progress
  const { data: activePoint } = useQuery({
    queryKey: ["activePoint", gameId],
    queryFn: () => getActivePoint(Number(gameId)),
    enabled: !!gameId && game?.status === "in_progress",
    refetchInterval: game?.status === "in_progress" ? 5000 : false,
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
      queryClient.invalidateQueries({ queryKey: ["activePoint", gameId] });
      setDeletingPoint(null);
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
    queryClient.invalidateQueries({ queryKey: ["activePoint", gameId] });
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
                label={game.status === "in_progress" ? "In Progress" : "Finished"}
                color={game.status === "in_progress" ? "primary" : "success"}
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
            {game.status === "in_progress" && (
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
                  Finish
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
            Final Score
          </Typography>
          <Typography variant="h2" fontWeight="bold">
            {game.our_score} - {game.opponent_score}
          </Typography>
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

      {/* Live Point Tracker */}
      {competition && (
        <LivePointTracker
          game={game}
          activePoint={activePoint || null}
          players={competition.players}
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

      {/* Finish Confirmation Dialog */}
      <Dialog
        open={isFinishConfirmOpen}
        onClose={() => setIsFinishConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Finish Game?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Mark game as finished? This cannot be undone.
          </Typography>
          {finishMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error finishing game. Please try again.
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
            {finishMutation.isPending ? "Finishing..." : "Finish Game"}
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
    </Container>
  );
}
