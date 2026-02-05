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
  Chip,
  Collapse,
  IconButton,
  Grid,
  alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EventIcon from "@mui/icons-material/Event";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  getCompetition,
  deleteCompetition,
  getCompetitionGames,
  removePlayersFromRoster,
} from "../services";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import PlayersGrid from "../components/players/PlayersGrid";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import GamesGrid from "../components/games/GamesGrid";
import EmptyGamesState from "../components/games/EmptyGamesState";
import EditCompetitionModal from "../components/modals/EditCompetitionModal";
import AddPlayersToRosterModal from "../components/modals/AddPlayersToRosterModal";
import CreateGameModal from "../components/modals/CreateGameModal";
import type { Player } from "../types";
import { queryKeys } from "../utils/queryKeys";

export default function CompetitionDetailPage() {
  const { t, i18n } = useTranslation(["competitions", "players", "games", "common"]);
  const { competitionId } = useParams<{ competitionId: string }>();
  const competitionIdNumber = Number(competitionId);
  const competitionIdValid = Number.isFinite(competitionIdNumber);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const [isCreateGameModalOpen, setIsCreateGameModalOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [showRoster, setShowRoster] = useState(false);

  const {
    data: competition,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.competition(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetition(competitionIdNumber),
    enabled: competitionIdValid,
  });

  const { data: games } = useQuery({
    queryKey: queryKeys.competitionGames(competitionIdValid ? competitionIdNumber : 0),
    queryFn: () => getCompetitionGames(competitionIdNumber),
    enabled: competitionIdValid,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompetition(Number(competitionId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions });
      navigate("/competitions");
    },
  });

  const removePlayerMutation = useMutation({
    mutationFn: (playerId: number) =>
      removePlayersFromRoster(Number(competitionId), [playerId]),
    onSuccess: () => {
      if (competitionIdValid) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.competition(competitionIdNumber),
        });
      }
      setPlayerToRemove(null);
    },
  });

  if (isLoading) {
    return <LoadingState message={t("competitions:detail.loading")} />;
  }

  if (error || !competition) {
    return (
      <ErrorState message={t("competitions:detail.error")} />
    );
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

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return `${start.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })} - ${end.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Button
          component={Link}
          to="/competitions"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          {t("competitions:detail.backToCompetitions")}
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
                {competition.name}
              </Typography>
              <Chip
                label={t(`common:status.${competition.status}`)}
                size="small"
                color={
                  competition.status === "ongoing" ? "success" : "default"
                }
              />
            </Box>
            {competition.description && (
              <Typography variant="body1" color="text.secondary" mb={1}>
                {competition.description}
              </Typography>
            )}
            <Box display="flex" alignItems="center" gap={1}>
              <EventIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {formatDateRange(
                  competition.start_date,
                  competition.end_date
                )}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditModalOpen(true)}
            >
              {t("competitions:detail.edit")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              {t("competitions:detail.delete")}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Roster Section */}
      <Paper sx={{ mb: 3 }}>
        <Box
          p={3}
          borderBottom={showRoster ? "1px solid" : "none"}
          borderColor="divider"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">
                {t("competitions:detail.rosterCount", { count: competition.players.length })}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowRoster(!showRoster)}
                aria-label={showRoster ? t("competitions:detail.hideRoster") : t("competitions:detail.showRoster")}
              >
                {showRoster ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setIsAddPlayersModalOpen(true)}
            >
              {t("competitions:detail.addPlayers")}
            </Button>
          </Box>
        </Box>

        <Collapse in={showRoster}>
          <Box p={3}>
            {competition.players.length === 0 ? (
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
                        mb: 2
                      }}
                    >
                      {t("competitions:detail.men")} ({competition.players.filter(p => p.gender === "M").length})
                    </Typography>
                    {competition.players.filter(p => p.gender === "M").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t("competitions:detail.noMalePlayers")}
                      </Typography>
                    ) : (
                      <PlayersGrid
                        players={competition.players.filter(p => p.gender === "M").sort((a, b) => a.name.localeCompare(b.name))}
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
                        mb: 2
                      }}
                    >
                      {t("competitions:detail.women")} ({competition.players.filter(p => p.gender === "W").length})
                    </Typography>
                    {competition.players.filter(p => p.gender === "W").length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        {t("competitions:detail.noFemalePlayers")}
                      </Typography>
                    ) : (
                      <PlayersGrid
                        players={competition.players.filter(p => p.gender === "W").sort((a, b) => a.name.localeCompare(b.name))}
                        onDeletePlayer={handleRemovePlayer}
                      />
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Games Section */}
      <Paper>
        <Box p={3} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {t("competitions:detail.gamesCount", { count: games?.length || 0 })}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsCreateGameModalOpen(true)}
            >
              {t("competitions:detail.addGame")}
            </Button>
          </Box>
        </Box>

        <Box p={3}>
          {!games || games.length === 0 ? (
            <EmptyGamesState
              onCreateClick={() => setIsCreateGameModalOpen(true)}
            />
          ) : (
            <GamesGrid games={games} />
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
        <DialogTitle>{t("competitions:detail.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("competitions:detail.deleteConfirm", { competitionName: competition.name })}
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("competitions:detail.deleteError")}
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
            {deleteMutation.isPending ? t("competitions:detail.deleting") : t("competitions:detail.deleteCompetition")}
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
        <DialogTitle>{t("competitions:detail.removePlayerTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("competitions:detail.removePlayerConfirm", { playerName: playerToRemove?.name })}
          </Typography>
          {removePlayerMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("competitions:detail.removePlayerError")}
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
            {removePlayerMutation.isPending ? t("competitions:detail.removing") : t("competitions:detail.removePlayer")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <EditCompetitionModal
        key={competition.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        competition={competition}
      />

      <AddPlayersToRosterModal
        isOpen={isAddPlayersModalOpen}
        onClose={() => setIsAddPlayersModalOpen(false)}
        competitionId={Number(competitionId)}
        teamId={competition.team_id}
        currentRosterIds={competition.players.map((p) => p.id)}
      />

      <CreateGameModal
        isOpen={isCreateGameModalOpen}
        onClose={() => setIsCreateGameModalOpen(false)}
        competitionId={Number(competitionId)}
      />
    </Container>
  );
}
