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
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { updateStrategy } from "../../services/strategies";
import type { Strategy, StrategyUpdate, StrategyCategory } from "../../types";

interface EditStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: Strategy | null;
}

export default function EditStrategyModal({
  isOpen,
  onClose,
  strategy,
}: EditStrategyModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "" as StrategyCategory | "",
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (strategy && isOpen) {
      setFormData({
        name: strategy.name,
        description: strategy.description || "",
        category: strategy.category,
      });
    }
  }, [strategy, isOpen]);

  const mutation = useMutation({
    mutationFn: (data: StrategyUpdate) =>
      updateStrategy(strategy!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      handleClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.category) {
      mutation.mutate({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
    });
    mutation.reset();
    onClose();
  };

  const isFormValid = formData.name.trim() && formData.category;

  if (!strategy) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Strategy</DialogTitle>
        <DialogContent>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to update strategy. Please try again.
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Strategy Name"
            type="text"
            fullWidth
            required
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., Vertical Stack, Zone Defense"
          />

          <FormControl fullWidth margin="dense" required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={formData.category}
              label="Category"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as StrategyCategory,
                })
              }
            >
              <MenuItem value="offense">Offense</MenuItem>
              <MenuItem value="defense">Defense</MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Description (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the strategy..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
