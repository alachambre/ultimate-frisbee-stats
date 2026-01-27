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
import { useTranslation } from "react-i18next";
import { createLine } from "../../services/lines";
import { getTeams } from "../../services/teams";
import type { LineCreate } from "../../types";

interface CreateLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId?: number; // Optional: pre-select team
}

export default function CreateLineModal({
  isOpen,
  onClose,
  teamId,
}: CreateLineModalProps) {
  const { t } = useTranslation(['lines', 'common']);
  const [formData, setFormData] = useState({
    team_id: teamId?.toString() || "",
    name: "",
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
    enabled: isOpen && !teamId,
  });

  const mutation = useMutation({
    mutationFn: (data: LineCreate) => createLine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lines"] });
      handleClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.team_id && formData.name.trim()) {
      mutation.mutate({
        team_id: Number(formData.team_id),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
    }
  };

  const handleClose = () => {
    setFormData({
      team_id: teamId?.toString() || "",
      name: "",
      description: "",
    });
    mutation.reset();
    onClose();
  };

  const isFormValid = formData.team_id && formData.name.trim();

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t('lines:modal.create.title')}</DialogTitle>
        <DialogContent>
          {!teamId && (
            <TextField
              select
              margin="dense"
              label={t('common:team')}
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
          )}

          <TextField
            autoFocus
            margin="dense"
            label={t('lines:form.name')}
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder={t('lines:form.namePlaceholder')}
            inputProps={{ maxLength: 100 }}
            required
          />

          <TextField
            margin="dense"
            label={t('common:labels.description')}
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder={t('lines:form.namePlaceholder')}
          />

          {mutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {t('common:error.generic')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t('common:action.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !isFormValid}
          >
            {mutation.isPending ? t('common:action.saving') : t('lines:modal.create.submit')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
