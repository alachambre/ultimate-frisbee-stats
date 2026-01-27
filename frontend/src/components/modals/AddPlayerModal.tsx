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
import { createPlayer } from "../../services";
import PlayerForm from "../players/PlayerForm";
import type { Gender } from "../../types";

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
}

export default function AddPlayerModal({
  isOpen,
  onClose,
  teamId,
}: AddPlayerModalProps) {
  const { t } = useTranslation(["players", "common"]);
  const [playerName, setPlayerName] = useState("");
  const [playerNumber, setPlayerNumber] = useState("");
  const [gender, setGender] = useState<Gender>("M");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      setPlayerName("");
      setPlayerNumber("");
      setGender("M");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      mutation.mutate({
        team_id: teamId,
        name: playerName.trim(),
        number: playerNumber ? Number(playerNumber) : undefined,
        gender: gender,
      });
    }
  };

  const handleClose = () => {
    setPlayerName("");
    setPlayerNumber("");
    setGender("M");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("common:action.add")} Player</DialogTitle>
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
          {mutation.isError && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">
                {t("common:messages.error")}
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !playerName.trim()}
          >
            {mutation.isPending ? `${t("common:action.add")}...` : `${t("common:action.add")} Player`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
