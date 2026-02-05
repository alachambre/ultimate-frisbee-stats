import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createCall } from '../../services/calls';
import type { PointWithPlayers, CallCreate } from '../../types';
import { queryKeys } from '../../utils/queryKeys';

interface RecordCallDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
}

export const RecordCallDialog = ({ open, onClose, point }: RecordCallDialogProps) => {
  const { t } = useTranslation('points');
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');

  const mutation = useMutation({
    mutationFn: (newCall: CallCreate) => createCall(newCall),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls(point.id) });
      setComments('');
      onClose();
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      point_id: point.id,
      call_timestamp: new Date().toISOString(), // Generate timestamp when call is recorded
      comments: comments.trim() || null,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setComments('');
      mutation.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('recordCallTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : t('common:error')}
            </Alert>
          )}

          <TextField
            label={t('addComments')}
            multiline
            rows={3}
            fullWidth
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={mutation.isPending}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          {t('common:action.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          {mutation.isPending ? t('common:action.saving') : t('common:action.record')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
