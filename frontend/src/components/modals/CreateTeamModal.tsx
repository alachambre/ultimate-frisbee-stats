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
import { createTeam } from "../../services";
import type { Team } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (team: Team) => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  onCreated,
}: CreateTeamModalProps) {
  const { t } = useTranslation(["teams", "common"]);
  const [teamName, setTeamName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams });
      onCreated?.(team);
      setTeamName("");
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      mutation.mutate({ name: teamName.trim() });
    }
  };

  const handleClose = () => {
    setTeamName("");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("teams:modal.create.title")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t("teams:form.name")}
            type="text"
            fullWidth
            variant="outlined"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder={t("teams:form.namePlaceholder")}
            inputProps={{ maxLength: 100 }}
            required
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
            disabled={mutation.isPending || !teamName.trim()}
          >
            {mutation.isPending ? `${t("teams:modal.create.submit")}...` : t("teams:modal.create.submit")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
