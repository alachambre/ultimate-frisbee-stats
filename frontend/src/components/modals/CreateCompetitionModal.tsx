import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { createCompetition, getTeams } from "../../services";
import type { CompetitionCreate } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface CreateCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCompetitionModal({
  isOpen,
  onClose,
}: CreateCompetitionModalProps) {
  const { t } = useTranslation(["competitions", "common"]);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions });
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
        <DialogTitle>{t("competitions:modal.create.title")}</DialogTitle>
        <DialogContent>
          <TextField
            select
            margin="dense"
            label={t("competitions:form.team")}
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
            label={t("competitions:form.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder={t("competitions:form.namePlaceholder")}
            inputProps={{ maxLength: 100 }}
            required
          />

          <TextField
            margin="dense"
            label={`${t("common:labels.description")} (${t("common:labels.optional")})`}
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={t("competitions:form.namePlaceholder")}
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
            {mutation.isPending ? `${t("competitions:modal.create.submit")}...` : t("competitions:modal.create.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
