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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupsIcon from "@mui/icons-material/Groups";
import {
  getLine,
  deleteLine,
  getTeam,
} from "../services";
import LoadingState from "../components/shared/LoadingState";
import ErrorState from "../components/shared/ErrorState";
import EmptyPlayersState from "../components/players/EmptyPlayersState";
import PlayerSelectionList from "../components/shared/PlayerSelectionList";
import EditLineModal from "../components/modals/EditLineModal";
import AddPlayersToLineModal from "../components/modals/AddPlayersToLineModal";
import { queryKeys } from "../utils/queryKeys";

export default function LineDetailPage() {
  const { t } = useTranslation(["lines", "common"]);
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPlayersModalOpen, setIsAddPlayersModalOpen] = useState(false);
  const lineIdNumber = Number(lineId);
  const lineIdValid = Number.isFinite(lineIdNumber);

  const {
    data: line,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.line(lineIdValid ? lineIdNumber : 0),
    queryFn: () => getLine(lineIdNumber),
    enabled: lineIdValid,
  });

  const { data: team } = useQuery({
    queryKey: queryKeys.team(line?.team_id ?? 0),
    queryFn: () => getTeam(line!.team_id),
    enabled: !!line?.team_id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLine(Number(lineId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
      if (line?.team_id) {
        navigate(`/teams/${line.team_id}`);
      }
    },
  });

  if (isLoading) {
    return <LoadingState message={t("lines:detail.loading")} />;
  }

  if (error || !line) {
    return <ErrorState message={t("lines:detail.error")} />;
  }

  const handleDelete = () => {
    deleteMutation.mutate();
  };
  const linePlayers = [...line.players].sort((a, b) => a.name.localeCompare(b.name));

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
          {t("lines:detail.backTo", { teamName: team?.name || t("lines:detail.team") })}
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
                ({t("lines:detail.playersCount", { count: line.players.length })})
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
                  {t("lines:detail.teamLabel")}{" "}
                  <Box
                    component={Link}
                    to={`/teams/${line.team_id}`}
                    sx={{ textDecoration: "none", color: "inherit", fontWeight: "bold" }}
                  >
                    {team?.name || t("lines:detail.teamLoading")}
                  </Box>
                </Typography>
              </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditModalOpen(true)}
            >
              {t("lines:detail.edit")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              {t("lines:detail.delete")}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Players Section */}
      <Paper>
        <Box p={3} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {t("lines:detail.players")} ({line.players.length})
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => setIsAddPlayersModalOpen(true)}
            >
              {t("lines:detail.addPlayers")}
            </Button>
          </Box>
        </Box>

        <Box p={3}>
          {line.players.length === 0 ? (
            <EmptyPlayersState
              onAddClick={() => setIsAddPlayersModalOpen(true)}
              buttonLabel={t("lines:detail.addPlayers")}
            />
          ) : (
            <PlayerSelectionList
              players={linePlayers}
              selectedIds={[]}
              onToggle={() => {}}
              menLabel={t("lines:detail.men")}
              womenLabel={t("lines:detail.women")}
              emptyMenLabel={t("lines:detail.noMalePlayers")}
              emptyWomenLabel={t("lines:detail.noFemalePlayers")}
              renderSecondary={(player) =>
                player.number !== null && player.number !== undefined
                  ? `#${player.number}`
                  : ""
              }
            />
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
        <DialogTitle>{t("lines:detail.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {t("lines:detail.deleteConfirm", { lineName: line.name })}
          </Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("lines:detail.deleteError")}
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
            {deleteMutation.isPending ? t("lines:detail.deleting") : t("lines:detail.deleteLine")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <EditLineModal
        key={line.id}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        line={line}
      />

      {isAddPlayersModalOpen && (
        <AddPlayersToLineModal
          isOpen={isAddPlayersModalOpen}
          onClose={() => setIsAddPlayersModalOpen(false)}
          lineId={Number(lineId)}
          teamId={line.team_id}
          currentPlayerIds={line.players.map((p) => p.id)}
        />
      )}
    </Container>
  );
}
