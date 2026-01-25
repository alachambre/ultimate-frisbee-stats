import { useState, useEffect } from "react";
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
import { updatePoint } from "../../services/points";
import type { PointWithPlayers } from "../../types";

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
  const [comments, setComments] = useState<string>("");
  const queryClient = useQueryClient();

  // Initialize comments from point when dialog opens
  useEffect(() => {
    if (open) {
      setComments(point.comments || "");
    }
  }, [open, point.comments]);

  const updateMutation = useMutation({
    mutationFn: () => {
      return updatePoint(point.id, { comments: comments || null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game", String(gameId)] });
      queryClient.invalidateQueries({ queryKey: ["runningPoint", gameId] });
      handleClose();
      onSuccess?.();
    },
  });

  const handleClose = () => {
    setComments("");
    updateMutation.reset();
    onClose();
  };

  const handleSubmit = () => {
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {point.comments ? "Edit Comment" : "Add Comment"}
      </DialogTitle>
      <DialogContent>
        {updateMutation.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(updateMutation.error as any)?.response?.data?.detail ||
              "Failed to update comment. Please try again."}
          </Alert>
        )}

        <TextField
          autoFocus
          fullWidth
          label="Comment"
          placeholder="Add notes about this point..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          multiline
          rows={4}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={updateMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
