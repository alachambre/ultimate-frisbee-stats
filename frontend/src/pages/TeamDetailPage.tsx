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
import AddIcon from "@mui/icons-material/Add";
import BarChartIcon from "@mui/icons-material/BarChart";
import { getTeam, deleteTeam } from "../services";
import { getLines, deleteLine } from "../services/lines";
import type { Player, LineWithPlayers } from "../types";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import RosterSummaryHeader from "../components/players/RosterSummaryHeader";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import PlayerSelectionList from "../components/shared/PlayerSelectionList";
import LinesGrid from "../components/lines/LinesGrid";
import EmptyLinesState from "../components/lines/EmptyLinesState";
import AddPlayerModal from "../components/modals/AddPlayerModal";
import EditPlayerModal from "../components/modals/EditPlayerModal";
import CreateLineModal from "../components/modals/CreateLineModal";
import EditLineModal from "../components/modals/EditLineModal";
import { shouldEnforcePermissions, useAuth } from "../auth";
import { queryKeys } from "../utils/queryKeys";
import { formatDate } from "../utils/dateFormatting";

export default function TeamDetailPage() {
  const auth = useAuth();
  const { t, i18n } = useTranslation(["teams", "players", "lines", "common"]);
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
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const canViewStatistics = !shouldProtectUi || auth.capabilities.canViewStatistics;

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

  const menPlayers = team.players
    .filter((player) => player.gender === "M")
    .sort((a, b) => a.name.localeCompare(b.name));
  const womenPlayers = team.players
    .filter((player) => player.gender === "W")
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleViewPlayerStats = (player: Player) => {
    navigate(`/statistics?teamId=${team.id}&mode=player&playerId=${player.id}`);
  };
  const rosterPlayers = [...menPlayers, ...womenPlayers];
  const handlePlayerCardClick = (playerId: number) => {
    const player = team.players.find((candidate) => candidate.id === playerId);
    if (player) {
      setEditingPlayer(player);
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
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {team.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("teams:detail.createdOn", { date: formatDate(team.created_at, i18n.resolvedLanguage) })}
            </Typography>
          </Box>
          <Box
            display="flex"
            gap={1}
            flexDirection="row"
          >
            {canViewStatistics && (
              <Button
                variant="outlined"
                startIcon={<BarChartIcon />}
                onClick={() => navigate(`/statistics?teamId=${team.id}&mode=competition`)}
                aria-label={t("teams:detail.viewStatistics")}
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
                  {t("teams:detail.viewStatistics")}
                </Box>
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
              aria-label={t("common:action.delete")}
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
                {t("common:action.delete")}
              </Box>
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Players Section */}
      <Paper sx={{ overflow: "hidden" }}>
        <RosterSummaryHeader
          title={t("teams:detail.roster")}
          subtitle={t("teams:detail.rosterSummary", { count: team.players.length })}
          totalLabel={t("teams:detail.totalPlayers", { count: team.players.length })}
          menLabel={t("teams:detail.menCount", { count: menPlayers.length })}
          womenLabel={t("teams:detail.womenCount", { count: womenPlayers.length })}
          isCollapsible
          isExpanded={showPlayers}
          onToggle={() => setShowPlayers(!showPlayers)}
          toggleAriaLabel={showPlayers ? t("teams:detail.hidePlayers") : t("teams:detail.showPlayers")}
          showBorder={showPlayers}
        />

        <Collapse in={showPlayers}>
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
              {t("teams:detail.rosterTapHint")}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddPlayerModalOpen(true)}
              sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
            >
              {t("teams:detail.addPlayer")}
            </Button>
          </Box>
          {team.players.length === 0 ? (
            <EmptyPlayersState
              onAddClick={() => setIsAddPlayerModalOpen(true)}
            />
          ) : (
            <PlayerSelectionList
              players={rosterPlayers}
              selectedIds={[]}
              onToggle={handlePlayerCardClick}
              menLabel={t("common:labels.men")}
              womenLabel={t("common:labels.women")}
              emptyMenLabel={t("players:empty.noPlayers")}
              emptyWomenLabel={t("players:empty.noPlayers")}
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
          onViewStatistics={canViewStatistics ? handleViewPlayerStats : undefined}
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
