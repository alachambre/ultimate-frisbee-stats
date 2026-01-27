import { useState, useEffect, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["competitions", "common"]);
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
        <DialogTitle>{t("competitions:modal.edit.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("competitions:form.name")}
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
            label={t("common:labels.description")}
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
            label={t("competitions:form.startDate")}
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
            label={t("competitions:form.endDate")}
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
                ? t("common:validation.endDateAfterStart")
                : ""
            }
          />

          <TextField
            select
            margin="dense"
            label={t("common:status.label")}
            fullWidth
            variant="outlined"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as CompetitionStatus })
            }
          >
            <MenuItem value="ongoing">{t("common:status.active")}</MenuItem>
            <MenuItem value="completed">{t("common:status.completed")}</MenuItem>
          </TextField>

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t("common:messages.error")}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !isFormValid}
          >
            {mutation.isPending ? t("common:action.loading") : t("common:action.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
