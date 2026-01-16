import { useState, FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from "@mui/material";
import { createPlayer } from "../../services";

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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", teamId.toString()] });
      setPlayerName("");
      setPlayerNumber("");
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
      });
    }
  };

  const handleClose = () => {
    setPlayerName("");
    setPlayerNumber("");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Player</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Player Name"
              type="text"
              fullWidth
              variant="outlined"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
              inputProps={{ maxLength: 100 }}
              required
            />
            <TextField
              label="Jersey Number (Optional)"
              type="number"
              fullWidth
              variant="outlined"
              value={playerNumber}
              onChange={(e) => setPlayerNumber(e.target.value)}
              placeholder="0-99"
              inputProps={{ min: 0, max: 99 }}
            />
            {mutation.isError && (
              <Alert severity="error">
                Error adding player. Please try again.
              </Alert>
            )}
          </Box>
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
