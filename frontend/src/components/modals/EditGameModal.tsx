import { useState, type FormEvent, useEffect } from "react";
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
import { updateGame } from "../../services";
import type { Game } from "../../types";

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export default function EditGameModal({
  isOpen,
  onClose,
  game,
}: EditGameModalProps) {
  const [opponentName, setOpponentName] = useState(game.opponent_name);
  const [date, setDate] = useState(
    game.date ? new Date(game.date).toISOString().split("T")[0] : ""
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    setOpponentName(game.opponent_name);
    setDate(game.date ? new Date(game.date).toISOString().split("T")[0] : "");
  }, [game]);

  const mutation = useMutation({
    mutationFn: (data: { opponent_name: string }) =>
      updateGame(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", game.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (opponentName.trim()) {
      mutation.mutate({
        opponent_name: opponentName.trim(),
      });
    }
  };

  const handleClose = () => {
    setOpponentName(game.opponent_name);
    setDate(game.date ? new Date(game.date).toISOString().split("T")[0] : "");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Game</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Opponent Name"
              type="text"
              fullWidth
              variant="outlined"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Enter opponent name"
              inputProps={{ maxLength: 100 }}
              required
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              variant="outlined"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              disabled
              helperText="Date cannot be changed after game creation"
            />
            {mutation.isError && (
              <Alert severity="error">
                Error updating game. Please try again.
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
            disabled={mutation.isPending || !opponentName.trim()}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
