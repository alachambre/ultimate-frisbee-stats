import { useState, type FormEvent } from "react";
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
} from "@mui/material";
import { updateLine } from "../../services/lines";
import type { LineWithPlayers, LineUpdate } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

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
  const { t } = useTranslation(["lines", "common"]);
  const [formData, setFormData] = useState(() => ({
    name: line?.name ?? "",
    description: line?.description || "",
  }));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ lineId, data }: { lineId: number; data: LineUpdate }) =>
      updateLine(lineId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lines });
      queryClient.invalidateQueries({ queryKey: queryKeys.line(variables.lineId) });
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
    setFormData({
      name: line?.name ?? "",
      description: line?.description || "",
    });
    mutation.reset();
    onClose();
  };

  const isFormValid = formData.name.trim();

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("lines:modal.edit.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("lines:form.name")}
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
