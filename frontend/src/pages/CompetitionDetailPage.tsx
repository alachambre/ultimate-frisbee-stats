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
  Collapse,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EventIcon from "@mui/icons-material/Event";
import {
  getCompetition,
  deleteCompetition,
  getCompetitionGames,
} from "../services";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import RosterSummaryHeader from "../components/players/RosterSummaryHeader";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import PlayerSelectionList from "../components/shared/PlayerSelectionList";
import GamesGrid from "../components/games/GamesGrid";
import EmptyGamesState from "../components/games/EmptyGamesState";
import EditCompetitionModal from "../components/modals/EditCompetitionModal";
import AddPlayersToRosterModal from "../components/modals/AddPlayersToRosterModal";
import CreateGameModal from "../components/modals/CreateGameModal";
import { queryKeys } from "../utils/queryKeys";
import { formatDateRange } from "../utils/dateFormatting";
import StatusChip from "../components/shared/StatusChip";

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

  const menPlayers = competition.players
    .filter((player) => player.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = competition.players
    .filter((player) => player.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));
  const rosterPlayers = [...menPlayers, ...womenPlayers];

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
              <StatusChip kind="competition" status={competition.status} size="small" />
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
                  competition.end_date,
                  i18n.resolvedLanguage
                )}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<BarChartIcon />}
              onClick={() =>
                navigate(
                  `/statistics?teamId=${competition.team_id}&mode=competition&competitionId=${competition.id}`
                )
              }
              aria-label={t("competitions:detail.viewStatistics")}
              sx={{
                minWidth: { xs: 40, sm: "auto" },
                px: { xs: 1.25, sm: 2 },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: 0, sm: 1 },
                  marginLeft: { xs: 0, sm: -0.5 },
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("competitions:detail.viewStatistics")}
              </Box>
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditModalOpen(true)}
              aria-label={t("competitions:detail.edit")}
              sx={{
                minWidth: { xs: 40, sm: "auto" },
                px: { xs: 1.25, sm: 2 },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: 0, sm: 1 },
                  marginLeft: { xs: 0, sm: -0.5 },
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("competitions:detail.edit")}
              </Box>
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
              aria-label={t("competitions:detail.delete")}
              sx={{
                minWidth: { xs: 40, sm: "auto" },
                px: { xs: 1.25, sm: 2 },
                "& .MuiButton-startIcon": {
                  marginRight: { xs: 0, sm: 1 },
                  marginLeft: { xs: 0, sm: -0.5 },
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {t("competitions:detail.delete")}
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Roster Section */}
      <Paper sx={{ mb: 3 }}>
        <RosterSummaryHeader
          title={t("competitions:detail.roster")}
          subtitle={t("competitions:detail.rosterSummary", { count: competition.players.length })}
          totalLabel={t("competitions:detail.totalPlayers", { count: competition.players.length })}
          menLabel={t("competitions:detail.menCount", { count: menPlayers.length })}
          womenLabel={t("competitions:detail.womenCount", { count: womenPlayers.length })}
          isCollapsible
          isExpanded={showRoster}
          onToggle={() => setShowRoster(!showRoster)}
          toggleAriaLabel={showRoster ? t("competitions:detail.hideRoster") : t("competitions:detail.showRoster")}
          showBorder={showRoster}
        />

        <Collapse in={showRoster}>
          <Box p={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={1.5}
              mb={2}
              flexDirection={{ xs: "column", sm: "row" }}
            >
              <Typography variant="body2" color="text.secondary">
                {t("competitions:detail.rosterManageHint")}
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setIsAddPlayersModalOpen(true)}
                sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
              >
                {t("competitions:detail.addPlayers")}
              </Button>
            </Box>
            {competition.players.length === 0 ? (
              <EmptyPlayersState
                onAddClick={() => setIsAddPlayersModalOpen(true)}
                buttonLabel={t("competitions:detail.addPlayers")}
              />
            ) : (
              <PlayerSelectionList
                players={rosterPlayers}
                selectedIds={[]}
                onToggle={() => {}}
                menLabel={t("competitions:detail.men")}
                womenLabel={t("competitions:detail.women")}
                emptyMenLabel={t("competitions:detail.noMalePlayers")}
                emptyWomenLabel={t("competitions:detail.noFemalePlayers")}
                renderSecondary={(player) =>
                  player.number !== null && player.number !== undefined
                    ? `#${player.number}`
                    : ""
                }
              />
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

      {/* Modals */}
      <EditCompetitionModal
        key={competition.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        competition={competition}
      />

      {isAddPlayersModalOpen && (
        <AddPlayersToRosterModal
          isOpen={isAddPlayersModalOpen}
          onClose={() => setIsAddPlayersModalOpen(false)}
          competitionId={Number(competitionId)}
          teamId={competition.team_id}
          currentRosterIds={competition.players.map((p) => p.id)}
        />
      )}

      <CreateGameModal
        isOpen={isCreateGameModalOpen}
        onClose={() => setIsCreateGameModalOpen(false)}
        competitionId={Number(competitionId)}
      />
    </Container>
  );
}
