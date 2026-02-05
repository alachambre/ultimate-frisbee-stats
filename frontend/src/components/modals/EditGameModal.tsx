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
  Box,
} from "@mui/material";
import { updateGame } from "../../services";
import type { Game } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export default function EditGameModal({
  isOpen,
  onClose,
  game,
}: EditGameModalProps) {
  const { t } = useTranslation(["games", "common"]);
  const [opponentName, setOpponentName] = useState(game.opponent_name);
  const [date, setDate] = useState(
    game.date ? new Date(game.date).toISOString().split("T")[0] : ""
  );
  const [comments, setComments] = useState(game.comments || "");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { opponent_name: string; comments: string | null }) =>
      updateGame(game.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(game.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.games });
      onClose();
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (opponentName.trim()) {
      mutation.mutate({
        opponent_name: opponentName.trim(),
        comments: comments.trim() || null,
      });
    }
  };

  const handleClose = () => {
    setOpponentName(game.opponent_name);
    setDate(game.date ? new Date(game.date).toISOString().split("T")[0] : "");
    setComments(game.comments || "");
    mutation.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{t("games:modal.edit.title")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label={t("games:form.opponent")}
              type="text"
              fullWidth
              variant="outlined"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder={t("games:form.opponentPlaceholder")}
              inputProps={{ maxLength: 100 }}
              required
            />
            <TextField
              label={t("games:form.date")}
              type="date"
              fullWidth
              variant="outlined"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              disabled
              helperText={t("games:form.date")}
            />
            <TextField
              label={t("common:labels.comments")}
              type="text"
              fullWidth
              variant="outlined"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t("common:labels.comments")}
              multiline
              rows={3}
            />
            {mutation.isError && (
              <Alert severity="error">
                {t("common:messages.error")}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t("common:action.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !opponentName.trim()}
          >
            {mutation.isPending ? t("common:action.loading") : t("common:action.save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
