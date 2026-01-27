import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { createStrategy } from "../../services/strategies";
import StrategyForm from "../strategies/StrategyForm";
import type { StrategyCreate, StrategyCategory } from "../../types";

interface CreateStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStrategyModal({
  isOpen,
  onClose,
}: CreateStrategyModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "" as StrategyCategory | "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: StrategyCreate) => createStrategy(data),
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
        description: formData.description.trim() || undefined,
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

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Strategy</DialogTitle>
        <DialogContent>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to create strategy. Please try again.
            </Alert>
          )}

          <StrategyForm
            strategyName={formData.name}
            onStrategyNameChange={(name) =>
              setFormData({ ...formData, name })
            }
            category={formData.category}
            onCategoryChange={(category) =>
              setFormData({ ...formData, category })
            }
            description={formData.description}
            onDescriptionChange={(description) =>
              setFormData({ ...formData, description })
            }
            autoFocus={true}
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
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
