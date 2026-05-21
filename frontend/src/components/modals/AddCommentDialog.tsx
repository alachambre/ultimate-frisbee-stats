import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { updatePoint } from "../../services/points";
import type { PointWithPlayers } from "../../types";
import { invalidateGameLiveState } from "../../utils/queryInvalidation";

interface AddCommentDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  gameId: number;
  onSuccess?: () => void;
}

export default function AddCommentDialog({
  open,
  onClose,
  point,
  gameId,
  onSuccess,
}: AddCommentDialogProps) {
  const { t } = useTranslation(["points", "common"]);
  // Initialize from point.comments - component will remount when point changes (via key prop)
  const [comments, setComments] = useState<string>(point.comments || "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => {
      return updatePoint(point.id, { comments: comments || null });
    },
    onSuccess: async () => {
      // Close dialog first before triggering query invalidations
      // to prevent race conditions with re-renders
      handleClose();
      await invalidateGameLiveState(queryClient, gameId);
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setComments(point.comments || "");
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {point.comments ? t("points:tracker.editComment") : t("points:dialog.addComment.title")}
      </DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
              t("common:error.generic")}
          </Alert>
        )}

        <TextField
          autoFocus
          fullWidth
          label={t("points:history.comment")}
          placeholder={t("points:dialog.addComment.commentPlaceholder")}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          multiline
          rows={4}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          {t("common:action.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? t("common:action.saving") : t("common:action.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
