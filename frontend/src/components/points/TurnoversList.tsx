import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import { SwapHoriz as SwapHorizIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getTurnoversByPoint } from '../../services/turnovers';

interface TurnoversListProps {
  pointId: number;
  startingOnOffense: boolean;
}

export const TurnoversList = ({ pointId, startingOnOffense }: TurnoversListProps) => {
  const { t } = useTranslation('points');

  const { data: turnovers = [], isLoading, error } = useQuery({
    queryKey: ['turnovers', pointId],
    queryFn: () => getTurnoversByPoint(pointId),
  });

  if (isLoading) {
    return null; // Don't show loading state for this optional component
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error instanceof Error ? error.message : t('common:error')}
      </Alert>
    );
  }

  if (turnovers.length === 0) {
    return null; // Don't show anything if no turnovers
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Turnovers ({turnovers.length})
      </Typography>
      <Stack spacing={1}>
        {turnovers.map((turnover, index) => {
          const timestamp = new Date(turnover.timestamp);
          // Calculate possession before this turnover
          const possessionBeforeTurnover = index % 2 === 0 ? startingOnOffense : !startingOnOffense;
          // If we had possession, this is our turnover (lost disc)
          const isOurTurnover = possessionBeforeTurnover;

          return (
            <Card
              key={turnover.id}
              variant="outlined"
              sx={{
                bgcolor: isOurTurnover ? 'error.lighter' : 'success.lighter',
                borderColor: isOurTurnover ? 'error.light' : 'success.light',
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <SwapHorizIcon fontSize="small" color="action" />
                  <Chip
                    label={t('turnoverSequence', { number: index + 1 })}
                    size="small"
                    color={isOurTurnover ? 'error' : 'success'}
                  />
                  <ArrowForwardIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
                {turnover.player && (
                  <Typography variant="body2" sx={{ ml: 3 }}>
                    {t('turnoverBy')}: <strong>{turnover.player.name}</strong>
                    {turnover.player.number && ` #${turnover.player.number}`}
                  </Typography>
                )}
                {!turnover.player && isOurTurnover && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontStyle: 'italic' }}>
                    {t('teamTurnover')}
                  </Typography>
                )}
                {turnover.comments && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: '0.875rem', mt: 0.5 }}>
                    {turnover.comments}
                  </Typography>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};
