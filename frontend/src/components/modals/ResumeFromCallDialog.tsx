import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { updateCall } from '../../services/calls';
import type { Call, CallUpdate } from '../../types';

interface ResumeFromCallDialogProps {
  open: boolean;
  onClose: () => void;
  call: Call;
}

export const ResumeFromCallDialog = ({ open, onClose, call }: ResumeFromCallDialogProps) => {
  const { t } = useTranslation('points');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (callUpdate: CallUpdate) => updateCall(call.id, callUpdate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calls', call.point_id] });
      onClose();
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      resume_timestamp: new Date().toISOString(), // Generate timestamp when resuming
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      mutation.reset();
      onClose();
    }
  };

  // Calculate duration using current time for display
  const callTime = new Date(call.call_timestamp);
  const resumeTime = new Date(); // Use current time for duration display
  const durationSeconds = Math.floor((resumeTime.getTime() - callTime.getTime()) / 1000);
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('resumeFromCallTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : t('common:error')}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('callStarted')}: {callTime.toLocaleTimeString()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t('callResumed')}: {resumeTime.toLocaleTimeString()}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('callDuration')}: {minutes}:{seconds.toString().padStart(2, '0')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={mutation.isPending}>
          {t('common:cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          {mutation.isPending ? t('common:saving') : t('common:confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
