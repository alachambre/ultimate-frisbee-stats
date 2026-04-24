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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createStoppage } from '../../services/stoppages';
import type { PointWithPlayers, StoppageCreate, StoppageType } from '../../types';
import { queryKeys } from '../../utils/queryKeys';
import { STOPPAGE_TYPES, getStoppageTypeLabel } from '../../utils/stoppageTypes';

interface RecordStoppageDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  gameId?: number;
}

export const RecordStoppageDialog = ({ open, onClose, point, gameId }: RecordStoppageDialogProps) => {
  const { t } = useTranslation('points');
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');
  const [stoppageType, setStoppageType] = useState<StoppageType>('call');

  const mutation = useMutation({
    mutationFn: (newStoppage: StoppageCreate) => createStoppage(newStoppage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stoppages(point.id) });
      if (gameId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.gameLiveState(gameId) });
      }
      setComments('');
      setStoppageType('call');
      onClose();
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      point_id: point.id,
      stoppage_type: stoppageType,
      call_timestamp: new Date().toISOString(), // Generate timestamp when stoppage is recorded
      comments: comments.trim() || null,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setComments('');
      setStoppageType('call');
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

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('stoppageType')}
            </Typography>
            <ToggleButtonGroup
              value={stoppageType}
              exclusive
              fullWidth
              onChange={(_, newValue: StoppageType | null) => {
                if (newValue !== null) {
                  setStoppageType(newValue);
                }
              }}
              disabled={mutation.isPending}
              aria-label={t('stoppageType')}
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
                gap: 1,
                '& .MuiToggleButtonGroup-grouped': {
                  m: 0,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider} !important`,
                },
                '& .MuiToggleButton-root': {
                  minHeight: 38,
                  px: 1,
                  py: 0.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                },
                '& .MuiToggleButton-root.Mui-selected': {
                  color: theme.palette.common.white,
                  backgroundColor: theme.palette.primary.main,
                  borderColor: `${theme.palette.primary.main} !important`,
                },
                '& .MuiToggleButton-root.Mui-selected:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              })}
            >
              {STOPPAGE_TYPES.map((type) => (
                <ToggleButton
                  key={type}
                  value={type}
                  aria-label={getStoppageTypeLabel(t, type)}
                >
                  {getStoppageTypeLabel(t, type)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

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
