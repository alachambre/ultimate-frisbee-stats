import { useState, type FormEvent, useEffect } from "react";
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
import { updatePlayer, deletePlayer } from "../../services";
import PlayerForm from "../players/PlayerForm";
import type { Player, Gender } from "../../types";

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  teamId: number;
}

export default function EditPlayerModal({
  isOpen,
  onClose,
  player,
  teamId,
}: EditPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [playerName, setPlayerName] = useState(player.name);
  const [playerNumber, setPlayerNumber] = useState(
    player.number?.toString() || ""
  );
  const [gender, setGender] = useState<Gender>(player.gender);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPlayerName(player.name);
    setPlayerNumber(player.number?.toString() || "");
    setGender(player.gender);
  }, [player]);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; number?: number | null; gender?: Gender }) =>
      updatePlayer(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePlayer(player.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
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
    setPlayerName(player.name);
    setPlayerNumber(player.number?.toString() || "");
    setGender(player.gender);
    setShowDeleteConfirm(false);
    updateMutation.reset();
    deleteMutation.reset();
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("common:action.delete")} Player?</DialogTitle>
        <DialogContent>
          <Box>
            {t("common:messages.confirmDelete")}
            {deleteMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {t("common:messages.error")}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
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
            {deleteMutation.isPending ? `${t("common:action.delete")}...` : t("common:action.delete")}
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
            sx={{
              order: { xs: 3, sm: 1 },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {t("common:action.delete")} Player
          </Button>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 1,
              width: { xs: "100%", sm: "auto" },
              order: { xs: 1, sm: 2 },
            }}
          >
            <Button
              onClick={handleClose}
              disabled={updateMutation.isPending}
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
