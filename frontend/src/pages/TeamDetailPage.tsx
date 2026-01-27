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
  Collapse,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getTeam, deleteTeam } from "../services";
import { getLines, deleteLine } from "../services/lines";
import type { Player, LineWithPlayers } from "../types";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import PlayersGrid from "../components/players/PlayersGrid";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import LinesGrid from "../components/lines/LinesGrid";
import EmptyLinesState from "../components/lines/EmptyLinesState";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import EditPlayerModal from "../components/modals/EditPlayerModal";
import CreateLineModal from "../components/modals/CreateLineModal";
import EditLineModal from "../components/modals/EditLineModal";

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isCreateLineModalOpen, setIsCreateLineModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<LineWithPlayers | null>(null);
  const [deletingLine, setDeletingLine] = useState<LineWithPlayers | null>(null);
  const [showPlayers, setShowPlayers] = useState(false);

  const {
    data: team,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeam(Number(teamId)),
    enabled: !!teamId,
  });

  const { data: lines } = useQuery({
    queryKey: ["lines", "team", teamId],
    queryFn: () => getLines(Number(teamId)),
    enabled: !!teamId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(Number(teamId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      navigate("/teams");
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: number) => deleteLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lines", "team", teamId] });
      setDeletingLine(null);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading team..." />;
  }

  if (error || !team) {
    return <ErrorState message="Error loading team. Please try again." />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleEditLine = (line: LineWithPlayers) => {
    setEditingLine(line);
  };

  const handleDeleteLine = (line: LineWithPlayers) => {
    setDeletingLine(line);
  };

  const confirmDeleteLine = () => {
    if (deletingLine) {
      deleteLineMutation.mutate(deletingLine.id);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          component={Link}
          to="/teams"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Teams
        </Button>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {team.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created {new Date(team.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            Delete Team
          </Button>
        </Box>
      </Box>

      {/* Players Section */}
      <Paper>
        <Box
          p={3}
          borderBottom={showPlayers ? "1px solid" : "none"}
          borderColor="divider"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">
                Players ({team.players.length})
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
              onClick={() => setIsAddPlayerModalOpen(true)}
            >
              Add Player
            </Button>
          </Box>
        </Box>

        <Collapse in={showPlayers}>
          <Box p={3}>
          {team.players.length === 0 ? (
            <EmptyPlayersState
              onAddClick={() => setIsAddPlayerModalOpen(true)}
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
                      mb: 2
                    }}
                  >
                    Men ({team.players.filter(p => p.gender === "M").length})
                  </Typography>
                  {team.players.filter(p => p.gender === "M").length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No male players yet
                    </Typography>
                  ) : (
                    <PlayersGrid
                      players={team.players.filter(p => p.gender === "M").sort((a, b) => a.name.localeCompare(b.name))}
                      onEditPlayer={setEditingPlayer}
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
                      mb: 2
                    }}
                  >
                    Women ({team.players.filter(p => p.gender === "W").length})
                  </Typography>
                  {team.players.filter(p => p.gender === "W").length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No female players yet
                    </Typography>
                  ) : (
                    <PlayersGrid
                      players={team.players.filter(p => p.gender === "W").sort((a, b) => a.name.localeCompare(b.name))}
                      onEditPlayer={setEditingPlayer}
                    />
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          </Box>
        </Collapse>
      </Paper>

      {/* Lines Section */}
      <Paper sx={{ mt: 3 }}>
        <Box p={3} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Lines ({lines?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateLineModalOpen(true)}
            >
              Create Line
            </Button>
          </Box>
        </Box>

        <Box p={3}>
          {!lines || lines.length === 0 ? (
            <EmptyLinesState
              onCreateLine={() => setIsCreateLineModalOpen(true)}
            />
          ) : (
            <LinesGrid lines={lines} />
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
        <DialogTitle>Delete Team?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete "{team.name}"? This will also
            delete all players and games for this team. This action cannot be
            undone.
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error deleting team. Please try again.
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
            {deleteMutation.isPending ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Player Modals */}
      <AddPlayerModal
        isOpen={isAddPlayerModalOpen}
        onClose={() => setIsAddPlayerModalOpen(false)}
        teamId={Number(teamId)}
      />

      {editingPlayer && (
        <EditPlayerModal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          player={editingPlayer}
          teamId={Number(teamId)}
        />
      )}

      {/* Line Modals */}
      <CreateLineModal
        isOpen={isCreateLineModalOpen}
        onClose={() => setIsCreateLineModalOpen(false)}
        teamId={Number(teamId)}
      />

      {editingLine && (
        <EditLineModal
          isOpen={!!editingLine}
          onClose={() => setEditingLine(null)}
          line={editingLine}
        />
      )}

      {/* Delete Line Confirmation Dialog */}
      <Dialog
        open={!!deletingLine}
        onClose={() => setDeletingLine(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Line?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Delete "{deletingLine?.name}"? This will remove the line but not the
            players from the team.
          </Typography>
          {deleteLineMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error deleting line. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletingLine(null)}
            disabled={deleteLineMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteLine}
            variant="contained"
            color="error"
            disabled={deleteLineMutation.isPending}
          >
            {deleteLineMutation.isPending ? "Deleting..." : "Delete Line"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
