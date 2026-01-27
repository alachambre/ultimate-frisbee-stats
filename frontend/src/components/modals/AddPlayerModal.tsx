import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
        <DialogTitle>Add Player</DialogTitle>
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
                Error adding player. Please try again.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !playerName.trim()}
          >
            {mutation.isPending ? "Adding..." : "Add Player"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
