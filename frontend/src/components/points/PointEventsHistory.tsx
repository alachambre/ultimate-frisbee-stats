import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import {
  PauseCircle as PauseCircleIcon,
  SwapHoriz as SwapHorizIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getCallsByPoint } from '../../services/calls';
import { getTurnoversByPoint } from '../../services/turnovers';
import type { Call, TurnoverWithPlayer } from '../../types';
import { queryKeys } from '../../utils/queryKeys';
import { getStoppageTypeLabel } from '../../utils/stoppageTypes';

interface PointEventsHistoryProps {
  pointId: number;
  startingOnOffense: boolean;
  pointStartTime: string | null;
  strategy?: { id: number; name: string; category: string } | null;
  pull?: boolean | null;
  pointStatus?: string;
  endDateTime?: string | null;
  won?: boolean | null;
}

// Union type for point events
type PointEvent =
  | { type: 'call'; data: Call; timestamp: string }
  | { type: 'turnover'; data: TurnoverWithPlayer; timestamp: string; sequenceNumber: number }
  | { type: 'point-start'; timestamp: string }
  | { type: 'point-scored'; timestamp: string; won: boolean };

// Helper function to format elapsed time from point start
const formatElapsedTime = (startTime: string | null, timestamp: string): string => {
  if (!startTime) return new Date(timestamp).toLocaleTimeString();

  const start = new Date(startTime);
  const event = new Date(timestamp);
  const elapsedSeconds = Math.floor((event.getTime() - start.getTime()) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const PointEventsHistory = ({ pointId, startingOnOffense, pointStartTime, strategy, pull, pointStatus, endDateTime, won }: PointEventsHistoryProps) => {
  const { t } = useTranslation('points');

  const { data: calls = [], isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: queryKeys.calls(pointId),
    queryFn: () => getCallsByPoint(pointId),
  });

  const { data: turnovers = [], isLoading: turnoversLoading, error: turnoversError } = useQuery({
    queryKey: queryKeys.turnovers(pointId),
    queryFn: () => getTurnoversByPoint(pointId),
  });

  if (callsLoading || turnoversLoading) {
    return null; // Don't show loading state for this optional component
  }

  const error = callsError || turnoversError;
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error instanceof Error ? error.message : t('common:error')}
      </Alert>
    );
  }

  // Merge and sort events by timestamp (most recent first)
  const events: PointEvent[] = [
    // Add point start event if we have a start time
    ...(pointStartTime ? [{
      type: 'point-start' as const,
      timestamp: pointStartTime,
    }] : []),
    // Add point scored event if point is scored or completed
    ...((pointStatus === 'scored' || pointStatus === 'completed') && endDateTime && won !== null && won !== undefined ? [{
      type: 'point-scored' as const,
      timestamp: endDateTime,
      won: won,
    }] : []),
    ...calls.map((call): PointEvent => ({
      type: 'call',
      data: call,
      timestamp: call.call_timestamp,
    })),
    ...turnovers.map((turnover, index): PointEvent => ({
      type: 'turnover',
      data: turnover,
      timestamp: turnover.timestamp,
      sequenceNumber: index + 1,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (events.length === 0) {
    return null; // Don't show anything if no events
  }

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('pointEvents')} ({events.length})
        </Typography>
        <Stack spacing={1}>
          {events.map((event) => {
            if (event.type === 'call') {
              const call = event.data;
              const callTime = new Date(call.call_timestamp);
              const isResolved = call.resume_timestamp !== null;
              let durationText = '';
              const stoppageTypeLabel = getStoppageTypeLabel(t, call.stoppage_type);

              if (isResolved) {
                const resumeTime = new Date(call.resume_timestamp!);
                const durationSeconds = Math.floor((resumeTime.getTime() - callTime.getTime()) / 1000);
                const minutes = Math.floor(durationSeconds / 60);
                const seconds = durationSeconds % 60;
                durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }

              return (
                <Card key={`call-${call.id}`} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PauseCircleIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight="medium">
                          {stoppageTypeLabel}
                          {isResolved && (
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                              ({t('callDuration')}: {durationText})
                            </Typography>
                          )}
                        </Typography>
                        {!isResolved && (
                          <Chip
                            label={t('callPending')}
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        {formatElapsedTime(pointStartTime, call.call_timestamp)}
                      </Typography>
                    </Box>
                    {call.comments && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                        {call.comments}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            } else if (event.type === 'turnover') {
              // Turnover event
              const turnover = event.data;
              const sequenceNumber = event.sequenceNumber;
              // Calculate possession before this turnover
              const possessionBeforeTurnover = (sequenceNumber - 1) % 2 === 0 ? startingOnOffense : !startingOnOffense;
              // If we had possession, this is our turnover (lost disc)
              const isOurTurnover = possessionBeforeTurnover;

              return (
                <Card
                  key={`turnover-${turnover.id}`}
                  variant="outlined"
                  sx={{
                    bgcolor: isOurTurnover ? 'error.lighter' : 'success.lighter',
                    borderColor: isOurTurnover ? 'error.light' : 'success.light',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SwapHorizIcon fontSize="small" color="action" />
                        <Chip
                          label={t('turnoverSequence', { number: sequenceNumber })}
                          size="small"
                          color={isOurTurnover ? 'error' : 'success'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        {formatElapsedTime(pointStartTime, turnover.timestamp)}
                      </Typography>
                    </Box>
                    {turnover.player && (
                      <Typography variant="body2" sx={{ ml: 3 }}>
                        {t('turnoverBy')}: <strong>{turnover.player.name}</strong>
                      </Typography>
                    )}
                    {turnover.comments && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: '0.875rem', mt: 0.5, whiteSpace: 'pre-wrap' }}>
                        {turnover.comments}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            } else if (event.type === 'point-scored') {
              // Point scored event
              const weScored = event.won;

              return (
                <Card
                  key="point-scored"
                  variant="outlined"
                  sx={{
                    bgcolor: weScored ? 'success.lighter' : 'error.lighter',
                    borderColor: weScored ? 'success.light' : 'error.light',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {weScored ? (
                          <CheckCircleIcon fontSize="small" color="success" />
                        ) : (
                          <CancelIcon fontSize="small" color="error" />
                        )}
                        <Typography variant="body2" fontWeight="medium">
                          {weScored ? t('history.weScored') : t('history.theyScored')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        {formatElapsedTime(pointStartTime, event.timestamp)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            } else {
              // Point start event
              const hasInfo = strategy || (pull !== null && pull !== undefined && !startingOnOffense);

              return (
                <Card
                  key="point-start"
                  variant="outlined"
                  sx={{
                    bgcolor: 'primary.lighter',
                    borderColor: 'primary.light',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: hasInfo ? 0.5 : 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PlayArrowIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight="medium">
                          {t('pointStart')} {startingOnOffense ? t('tracker.inOffense') : t('tracker.inDefense')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight="medium">
                        0:00
                      </Typography>
                    </Box>
                    {hasInfo && (
                      <Box sx={{ ml: 3 }}>
                        {strategy && (
                          <Typography variant="body2" color="text.secondary">
                            {t('events.strategy')}: <strong>{strategy.name}</strong>
                          </Typography>
                        )}
                        {pull !== null && pull !== undefined && !startingOnOffense && (
                          <Typography variant="body2" color="text.secondary">
                            {t('events.pullPrefix')}<strong>{pull ? t('dialog.start.inbounds') : t('dialog.start.outOfBounds')}</strong>
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            }
          })}
        </Stack>
      </Box>
    </>
  );
};
