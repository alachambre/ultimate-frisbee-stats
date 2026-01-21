import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  MenuItem,
} from "@mui/material";
import { createCompetition, getTeams } from "../../services";
import type { CompetitionCreate } from "../../types";

interface CreateCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCompetitionModal({
  isOpen,
  onClose,
}: CreateCompetitionModalProps) {
  const [formData, setFormData] = useState({
    team_id: "",
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data: CompetitionCreate) => createCompetition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      handleClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (
      formData.team_id &&
      formData.name.trim() &&
      formData.start_date &&
      formData.end_date
    ) {
      mutation.mutate({
        team_id: Number(formData.team_id),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      team_id: "",
      name: "",
      description: "",
      start_date: "",
      end_date: "",
    });
    mutation.reset();
    onClose();
  };

  const isFormValid =
    formData.team_id &&
    formData.name.trim() &&
    formData.start_date &&
    formData.end_date &&
    formData.start_date <= formData.end_date;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Competition</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label="Team"
            fullWidth
            variant="outlined"
            value={formData.team_id}
            onChange={(e) =>
              setFormData({ ...formData, team_id: e.target.value })
            }
            required
          >
            {teams?.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            autoFocus={!!teams && teams.length > 0}
            margin="dense"
            label="Competition Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., Spring League 2024"
            inputProps={{ maxLength: 100 }}
            required
          />

          <TextField
            margin="dense"
            label="Description (optional)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Add details about this competition"
          />

          <TextField
            margin="dense"
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            margin="dense"
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
            required
            error={
              !!formData.start_date &&
              !!formData.end_date &&
              formData.end_date < formData.start_date
            }
            helperText={
              formData.start_date &&
              formData.end_date &&
              formData.end_date < formData.start_date
                ? "End date must be after start date"
                : ""
            }
          />

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error creating competition. Please try again.
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
            disabled={mutation.isPending || !isFormValid}
          >
            {mutation.isPending ? "Creating..." : "Create Competition"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
