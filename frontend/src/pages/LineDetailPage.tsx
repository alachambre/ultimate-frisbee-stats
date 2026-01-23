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
  Grid,
  alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  getLine,
  deleteLine,
  removePlayersFromLine,
  getTeam,
} from "../services";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import PlayersGrid from "../components/players/PlayersGrid";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import EditLineModal from "../components/modals/EditLineModal";
import AddPlayersToLineModal from "../components/modals/AddPlayersToLineModal";
import type { Player } from "../types";

export default function LineDetailPage() {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  const {
    data: line,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["line", lineId],
    queryFn: () => getLine(Number(lineId)),
    enabled: !!lineId,
  });

  const { data: team } = useQuery({
    queryKey: ["team", line?.team_id],
    queryFn: () => getTeam(line!.team_id),
    enabled: !!line?.team_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLine(Number(lineId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lines"] });
      if (line?.team_id) {
        navigate(`/teams/${line.team_id}`);
      }
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (playerId: number) =>
      removePlayersFromLine(Number(lineId), [playerId]),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["line", lineId],
      });
      setPlayerToRemove(null);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading line..." />;
  }

  if (error || !line) {
    return <ErrorState message="Error loading line. Please try again." />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
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
          to={`/teams/${line.team_id}`}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to {team?.name || "Team"}
        </Button>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h4" fontWeight="bold">
                {line.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({line.players.length} players)
              </Typography>
            </Box>
            {line.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {line.description}
              </Typography>
            )}
            <Box display="flex" alignItems="center" gap={1}>
              <GroupsIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                Team:{" "}
                <Link
                  to={`/teams/${line.team_id}`}
                  style={{ textDecoration: "none", color: "inherit", fontWeight: "bold" }}
                >
                  {team?.name || "Loading..."}
                </Link>
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Players Section */}
      <Paper>
        <Box p={3} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Players ({line.players.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setIsAddPlayersModalOpen(true)}
            >
              Add Players
            </Button>
          </Box>
        </Box>

        <Box p={3}>
          {line.players.length === 0 ? (
            <EmptyPlayersState
              onAddClick={() => setIsAddPlayersModalOpen(true)}
            />
          ) : (
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
                    Men ({line.players.filter((p) => p.gender === "M").length})
                  </Typography>
                  {line.players.filter((p) => p.gender === "M").length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      No male players yet
                    </Typography>
                  ) : (
                    <PlayersGrid
                      players={line.players
                        .filter((p) => p.gender === "M")
                        .sort((a, b) => a.name.localeCompare(b.name))}
                      onDeletePlayer={handleRemovePlayer}
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
                    Women ({line.players.filter((p) => p.gender === "W").length})
                  </Typography>
                  {line.players.filter((p) => p.gender === "W").length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 2 }}
                    >
                      No female players yet
                    </Typography>
                  ) : (
                    <PlayersGrid
                      players={line.players
                        .filter((p) => p.gender === "W")
                        .sort((a, b) => a.name.localeCompare(b.name))}
                      onDeletePlayer={handleRemovePlayer}
                    />
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Line?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete "{line.name}"? This action cannot
            be undone.
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error deleting line. Please try again.
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
            {deleteMutation.isPending ? "Deleting..." : "Delete Line"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Player Confirmation Dialog */}
      <Dialog
        open={!!playerToRemove}
        onClose={() => setPlayerToRemove(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Player from Line?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to remove "{playerToRemove?.name}" from this
            line? This will not delete the player from the team.
          </Typography>
          {removePlayerMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error removing player from line. Please try again.
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

      {/* Modals */}
      <EditLineModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        line={line}
      />

      <AddPlayersToLineModal
        isOpen={isAddPlayersModalOpen}
        onClose={() => setIsAddPlayersModalOpen(false)}
        lineId={Number(lineId)}
        teamId={line.team_id}
        currentPlayerIds={line.players.map((p) => p.id)}
      />
    </Container>
  );
}
