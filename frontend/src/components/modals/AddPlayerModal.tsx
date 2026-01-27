import { useState, type FormEvent } from "react";
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
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";
import { createPlayer } from "../../services";
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
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Gender
              </Typography>
              <ToggleButtonGroup
                value={gender}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setGender(newValue as Gender);
                  }
                }}
                fullWidth
                aria-label="player gender"
                sx={{
                  "& .MuiToggleButton-root": {
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 500,
                    "&.Mui-selected": {
                      fontWeight: "bold",
                      color: "white",
                      "&:hover": {
                        opacity: 0.9,
                      },
                    },
                    "&.Mui-selected[value='M']": {
                      backgroundColor: "primary.main",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    },
                    "&.Mui-selected[value='W']": {
                      backgroundColor: "secondary.main",
                      "&:hover": {
                        backgroundColor: "secondary.dark",
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="M" aria-label="male">
                  <MaleIcon sx={{ mr: 1, fontSize: 20 }} />
                  Male
                </ToggleButton>
                <ToggleButton value="W" aria-label="female">
                  <FemaleIcon sx={{ mr: 1, fontSize: 20 }} />
                  Female
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
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
