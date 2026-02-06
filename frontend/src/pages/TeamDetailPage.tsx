import { useState } from "react";
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
  Grid,
  alpha,
  Collapse,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
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
import { queryKeys } from "../utils/queryKeys";

export default function TeamDetailPage() {
  const { t } = useTranslation(["teams", "players", "lines", "common"]);
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
  const teamIdNumber = Number(teamId);
  const teamIdValid = Number.isFinite(teamIdNumber);

  const {
    data: team,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.team(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getTeam(teamIdNumber),
    enabled: teamIdValid,
  });

  const { data: lines } = useQuery({
    queryKey: queryKeys.teamLines(teamIdValid ? teamIdNumber : 0),
    queryFn: () => getLines(teamIdNumber),
    enabled: teamIdValid,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(Number(teamId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
      navigate("/teams");
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: number) => deleteLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teamLines(teamIdNumber) });
      setDeletingLine(null);
    },
  });

  if (isLoading) {
    return <LoadingState message={t("common:action.loading")} />;
  }

  if (error || !team) {
    return <ErrorState message={t("common:messages.error")} />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
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
          {t("common:action.back")}
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
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() => navigate(`/statistics/teams/${team.id}`)}
            >
              {t("teams:detail.viewStatistics")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              {t("common:action.delete")}
            </Button>
          </Box>
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
                {t("teams:detail.roster")} ({team.players.length})
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
              {t("teams:detail.addPlayer")}
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
                    {t("common:labels.male")} ({team.players.filter(p => p.gender === "M").length})
                  </Typography>
                  {team.players.filter(p => p.gender === "M").length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {t("players:empty.noPlayers")}
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
                    {t("common:labels.female")} ({team.players.filter(p => p.gender === "W").length})
                  </Typography>
                  {team.players.filter(p => p.gender === "W").length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {t("players:empty.noPlayers")}
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
              {t("teams:detail.lines")} ({lines?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateLineModalOpen(true)}
            >
              {t("common:action.create")}
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
        <DialogTitle>{t("teams:detail.deleteConfirm")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("teams:detail.deleteConfirm")}
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
            {deleteMutation.isPending ? t("common:action.loading") : t("common:action.delete")}
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
          key={editingPlayer.id}
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
          key={editingLine.id}
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
        <DialogTitle>{t("lines:detail.deleteConfirm")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("lines:detail.deleteConfirm")}
          </Typography>
          {deleteLineMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeletingLine(null)}
            disabled={deleteLineMutation.isPending}
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={confirmDeleteLine}
            variant="contained"
            color="error"
            disabled={deleteLineMutation.isPending}
          >
            {deleteLineMutation.isPending ? t("common:action.loading") : t("common:action.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
