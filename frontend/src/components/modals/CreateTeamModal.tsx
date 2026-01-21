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
} from "@mui/material";
import { createTeam } from "../../services";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
}: CreateTeamModalProps) {
  const [teamName, setTeamName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setTeamName("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      mutation.mutate({ name: teamName.trim() });
    }
  };

  const handleClose = () => {
    setTeamName("");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            type="text"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            inputProps={{ maxLength: 100 }}
            required
          />
          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error creating team. Please try again.
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
            disabled={mutation.isPending || !teamName.trim()}
          >
            {mutation.isPending ? "Creating..." : "Create Team"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
