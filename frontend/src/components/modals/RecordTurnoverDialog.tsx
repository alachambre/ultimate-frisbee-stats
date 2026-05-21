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
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createTurnover } from '../../services/turnovers';
import type { PointWithPlayers, TurnoverType, TurnoverWithPlayer, TurnoverCreate } from '../../types';
import { invalidateGameAfterPointMutation } from '../../utils/queryInvalidation';
import { queryKeys } from '../../utils/queryKeys';
import { TURNOVER_TYPES, getTurnoverTypeLabel } from '../../utils/turnoverTypes';

interface RecordTurnoverDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  existingTurnovers: TurnoverWithPlayer[];
}

export const RecordTurnoverDialog = ({ open, onClose, point, existingTurnovers }: RecordTurnoverDialogProps) => {
  const { t } = useTranslation('points');
  const queryClient = useQueryClient();
  const [comments, setComments] = useState('');
  const [turnoverType, setTurnoverType] = useState<TurnoverType | null>('other');

  // Calculate current possession
  // Start with starting_on_offense, then toggle with each turnover
  const weHavePossession = existingTurnovers.reduce(
    (possession) => !possession,
    point.starting_on_offense
  );

  const mutation = useMutation({
    mutationFn: (newTurnover: TurnoverCreate) => createTurnover(newTurnover),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.turnovers(point.id) });
      await invalidateGameAfterPointMutation(queryClient, point.game_id);
      setComments('');
      setTurnoverType('other');
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!turnoverType) {
      return;
    }

    mutation.mutate({
      point_id: point.id,
      player_id: null, // Player designation removed from UI
      turnover_type: turnoverType,
      timestamp: new Date().toISOString(), // Generate timestamp when turnover is recorded
      comments: comments.trim() || null,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setComments('');
      setTurnoverType('other');
      mutation.reset();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('recordTurnoverTitle')}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {mutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {mutation.error instanceof Error ? mutation.error.message : t('common:error')}
            </Alert>
          )}

          {/* Possession indicator */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('possession')}:
            </Typography>
            <Chip
              label={weHavePossession ? t('weHaveDisc') : t('theyHaveDisc')}
              color={weHavePossession ? 'primary' : 'default'}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('turnoverType')}
            </Typography>
            <ToggleButtonGroup
              value={turnoverType}
              exclusive
              fullWidth
              onChange={(_, newValue: TurnoverType | null) => {
                setTurnoverType(newValue);
              }}
              disabled={mutation.isPending}
              aria-label={t('turnoverType')}
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
              {TURNOVER_TYPES.map((type) => (
                <ToggleButton
                  key={type}
                  value={type}
                  aria-label={getTurnoverTypeLabel(t, type)}
                >
                  {getTurnoverTypeLabel(t, type)}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Comments */}
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
          disabled={mutation.isPending || turnoverType === null}
          startIcon={mutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          {mutation.isPending ? t('common:action.saving') : t('common:action.record')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
