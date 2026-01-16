import { useState, FormEvent } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { createGame, getTeams } from "../../services";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGameModal({
  isOpen,
  onClose,
}: CreateGameModalProps) {
  const [teamId, setTeamId] = useState<number | "">("");
  const [opponentName, setOpponentName] = useState("");
  const [date, setDate] = useState("");
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setTeamId("");
      setOpponentName("");
      setDate("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (teamId && opponentName.trim()) {
      mutation.mutate({
        team_id: Number(teamId),
        opponent_name: opponentName.trim(),
        date: date || null,
      });
    }
  };

  const handleClose = () => {
    setTeamId("");
    setOpponentName("");
    setDate("");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense" required>
            <InputLabel id="team-label">Team</InputLabel>
            <Select
              labelId="team-label"
              id="team-select"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value as number)}
              label="Team"
            >
              {teams?.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
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
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error creating game. Please try again.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !teamId || !opponentName.trim()}
          >
            {mutation.isPending ? "Creating..." : "Create Game"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
