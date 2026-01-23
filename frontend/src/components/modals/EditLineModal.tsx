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
} from "@mui/material";
import { updateLine } from "../../services/lines";
import type { LineWithPlayers, LineUpdate } from "../../types";

interface EditLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineWithPlayers | null;
}

export default function EditLineModal({
  isOpen,
  onClose,
  line,
}: EditLineModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (line) {
      setFormData({
        name: line.name,
        description: line.description || "",
      });
    }
  }, [line]);

  const mutation = useMutation({
    mutationFn: ({ lineId, data }: { lineId: number; data: LineUpdate }) =>
      updateLine(lineId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lines"] });
      queryClient.invalidateQueries({ queryKey: ["line", String(variables.lineId)] });
      handleClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (line && formData.name.trim()) {
      mutation.mutate({
        lineId: line.id,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        },
      });
    }
  };

  const handleClose = () => {
    mutation.reset();
    onClose();
  };

  const isFormValid = formData.name.trim();

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Line</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Line Name"
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

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Error updating line. Please try again.
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
