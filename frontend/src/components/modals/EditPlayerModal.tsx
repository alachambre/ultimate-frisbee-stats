import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import { updatePlayer, deletePlayer } from "../../services";
import PlayerForm from "../players/PlayerForm";
import type { Player, Gender } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  teamId: number;
  onPlayerChanged?: () => void;
  onViewStatistics?: (player: Player) => void;
}

export default function EditPlayerModal({
  isOpen,
  onClose,
  onPlayerChanged,
  player,
  teamId,
  onViewStatistics,
}: EditPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [playerName, setPlayerName] = useState(player.name);
  const [playerNumber, setPlayerNumber] = useState(
    player.number?.toString() || ""
  );
  const [gender, setGender] = useState<Gender>(player.gender);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; number?: number | null; gender?: Gender }) =>
      updatePlayer(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
      onPlayerChanged?.();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlayer(player.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team(teamId) });
      onPlayerChanged?.();
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      updateMutation.mutate({
        name: playerName.trim(),
        number: playerNumber ? Number(playerNumber) : null,
        gender: gender,
      });
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleClose = () => {
    onClose();
    setPlayerName(player.name);
    setPlayerNumber(player.number?.toString() || "");
    setGender(player.gender);
    setShowDeleteConfirm(false);
    updateMutation.reset();
    deleteMutation.reset();
  };

  const handleViewStatistics = () => {
    if (!onViewStatistics) return;
    onViewStatistics(player);
    handleClose();
  };

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("players:modal.edit.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Box>
            {t("players:modal.edit.deleteConfirm", { playerName: player.name })}
            {deleteMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(deleteMutation.error as { response?: { data?: { detail?: string } } })
                  ?.response?.data?.detail || t("common:messages.error")}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleteMutation.isPending}
            type="button"
          >
            {t("common:action.cancel")}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? `${t("players:modal.edit.delete")}...` : t("players:modal.edit.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("players:modal.edit.title")}</DialogTitle>
        <DialogContent>
          <PlayerForm
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            gender={gender}
            onGenderChange={setGender}
            playerNumber={playerNumber}
            onPlayerNumberChange={setPlayerNumber}
            autoFocus={true}
          />
          {updateMutation.isError && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">
                {t("common:messages.error")}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { xs: "stretch", sm: "space-between" },
            gap: 1,
            p: 2,
          }}
        >
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            color="error"
            disabled={updateMutation.isPending}
            type="button"
            sx={{
              order: { xs: 4, sm: 1 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {t("players:modal.edit.delete")}
          </Button>
          {onViewStatistics && (
            <Button
              onClick={handleViewStatistics}
              startIcon={<BarChartIcon />}
              color="primary"
              disabled={updateMutation.isPending}
              type="button"
              sx={{
                order: { xs: 3, sm: 2 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {t("players:modal.edit.viewStatistics")}
            </Button>
          )}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              width: { xs: "100%", sm: "auto" },
              order: { xs: 1, sm: 3 },
            }}
          >
            <Button
              onClick={handleClose}
              disabled={updateMutation.isPending}
              type="button"
              sx={{
                order: { xs: 2, sm: 1 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {t("common:action.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isPending || !playerName.trim()}
              sx={{
                order: { xs: 1, sm: 2 },
                width: { xs: "100%", sm: "auto" },
              }}
            >
              {updateMutation.isPending ? `${t("common:action.save")}...` : t("common:action.save")}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
