import { useState, type FormEvent } from "react";
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
import { createGame, getCompetitions } from "../../services";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId?: number; // Optional: if provided, competition is pre-selected
}

export default function CreateGameModal({
  isOpen,
  onClose,
  competitionId,
}: CreateGameModalProps) {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | "">("");
  const [opponentName, setOpponentName] = useState("");
  const [date, setDate] = useState("");
  const queryClient = useQueryClient();

  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: () => getCompetitions(),
    enabled: !competitionId, // Only fetch if no competitionId provided
  });

  const mutation = useMutation({
    mutationFn: createGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["competition-games"] });
      setSelectedCompetitionId("");
      setOpponentName("");
      setDate("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalCompetitionId = competitionId || selectedCompetitionId;
    if (finalCompetitionId && opponentName.trim()) {
      mutation.mutate({
        competition_id: Number(finalCompetitionId),
        opponent_name: opponentName.trim(),
        date: date || null,
      });
    }
  };

  const handleClose = () => {
    setSelectedCompetitionId("");
    setOpponentName("");
    setDate("");
    mutation.reset();
    onClose();
  };

  const finalCompetitionId = competitionId || selectedCompetitionId;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          {!competitionId && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel id="competition-label">Competition</InputLabel>
              <Select
                labelId="competition-label"
                id="competition-select"
                value={selectedCompetitionId}
                onChange={(e) => setSelectedCompetitionId(e.target.value as number)}
                label="Competition"
              >
                {competitions?.map((competition) => (
                  <MenuItem key={competition.id} value={competition.id}>
                    {competition.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

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
            disabled={mutation.isPending || !finalCompetitionId || !opponentName.trim()}
          >
            {mutation.isPending ? "Creating..." : "Create Game"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
