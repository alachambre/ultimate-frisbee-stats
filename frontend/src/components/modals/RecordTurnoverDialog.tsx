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
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { createTurnover } from '../../services/turnovers';
import type { PointWithPlayers, TurnoverWithPlayer, TurnoverCreate } from '../../types';
import PlayerSelector from '../points/PlayerSelector';

interface RecordTurnoverDialogProps {
  open: boolean;
  onClose: () => void;
  point: PointWithPlayers;
  existingTurnovers: TurnoverWithPlayer[];
}

export const RecordTurnoverDialog = ({ open, onClose, point, existingTurnovers }: RecordTurnoverDialogProps) => {
  const { t } = useTranslation('points');
  const queryClient = useQueryClient();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  // Calculate current possession
  // Start with starting_on_offense, then toggle with each turnover
  const weHavePossession = existingTurnovers.reduce(
    (possession, _) => !possession,
    point.starting_on_offense
  );

  const mutation = useMutation({
    mutationFn: (newTurnover: TurnoverCreate) => createTurnover(newTurnover),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['turnovers', point.id] });
      setSelectedPlayerId(null);
      setComments('');
      onClose();
    },
  });

  const handleSubmit = () => {
    mutation.mutate({
      point_id: point.id,
      player_id: weHavePossession ? selectedPlayerId : null,
      timestamp: new Date().toISOString(), // Generate timestamp when turnover is recorded
      comments: comments.trim() || null,
    });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      setSelectedPlayerId(null);
      setComments('');
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

          {/* Player selection - only if we have possession */}
          {weHavePossession && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {t('selectPlayerResponsible')}
              </Typography>
              <PlayerSelector
                players={point.players}
                selectedIds={selectedPlayerId ? [selectedPlayerId] : []}
                onChange={(ids) => setSelectedPlayerId(ids[0] || null)}
                required={false}
              />
            </Box>
          )}

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
          {t('common:cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} /> : undefined}
        >
          {mutation.isPending ? t('common:saving') : t('common:record')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
