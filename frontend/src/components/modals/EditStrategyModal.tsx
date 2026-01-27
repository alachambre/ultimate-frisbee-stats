import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { updateStrategy } from "../../services/strategies";
import StrategyForm from "../strategies/StrategyForm";
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
  const { t } = useTranslation(['strategies', 'common']);
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
        <DialogTitle>{t('strategies:modal.edit.title')}</DialogTitle>
        <DialogContent>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {t('common:error.generic')}
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
            {t('common:action.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid || mutation.isPending}
          >
            {mutation.isPending ? t('common:action.saving') : t('common:action.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
