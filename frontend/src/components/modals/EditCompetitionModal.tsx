import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { updateCompetition } from "../../services";
import type { Competition, CompetitionUpdate, CompetitionStatus } from "../../types";

interface EditCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  competition: Competition;
}

export default function EditCompetitionModal({
  isOpen,
  onClose,
  competition,
}: EditCompetitionModalProps) {
  const [formData, setFormData] = useState({
    name: competition.name,
    description: competition.description || "",
    start_date: competition.start_date,
    end_date: competition.end_date,
    status: competition.status as CompetitionStatus,
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: competition.name,
        description: competition.description || "",
        start_date: competition.start_date,
        end_date: competition.end_date,
        status: competition.status as CompetitionStatus,
      });
    }
  }, [isOpen, competition]);

  const mutation = useMutation({
    mutationFn: (data: CompetitionUpdate) =>
      updateCompetition(competition.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition", String(competition.id)] });
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.start_date && formData.end_date) {
      mutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
      });
    }
  };

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const isFormValid =
    formData.name.trim() &&
    formData.start_date &&
    formData.end_date &&
    formData.start_date <= formData.end_date;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Competition</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Competition Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
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

          <TextField
            select
            margin="dense"
            label="Status"
            fullWidth
            variant="outlined"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as CompetitionStatus })
            }
          >
            <MenuItem value="ongoing">Ongoing</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating competition. Please try again.
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
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
