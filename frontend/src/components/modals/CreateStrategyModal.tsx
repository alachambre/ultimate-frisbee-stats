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
import { useTranslation } from "react-i18next";
import { createStrategy } from "../../services/strategies";
import StrategyForm from "../strategies/StrategyForm";
import type { StrategyCreate, StrategyCategory } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface CreateStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStrategyModal({
  isOpen,
  onClose,
}: CreateStrategyModalProps) {
  const { t } = useTranslation(['strategies', 'common']);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "" as StrategyCategory | "",
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: StrategyCreate) => createStrategy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.strategies });
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
        <DialogTitle>{t('strategies:modal.create.title')}</DialogTitle>
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
            {mutation.isPending ? t('common:action.saving') : t('strategies:modal.create.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
