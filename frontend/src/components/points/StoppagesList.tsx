import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import { PauseCircle as PauseCircleIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getStoppagesByPoint } from '../../services/stoppages';
import type { Stoppage } from '../../types';
import { ResumeFromStoppageDialog } from '../modals/ResumeFromStoppageDialog';
import { queryKeys } from '../../utils/queryKeys';
import { getStoppageTypeLabel } from '../../utils/stoppageTypes';

interface StoppagesListProps {
  pointId: number;
  pointStartTime: string | null;
}

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

export const StoppagesList = ({ pointId, pointStartTime }: StoppagesListProps) => {
  const { t } = useTranslation(["points", "common"]);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [selectedStoppage, setSelectedStoppage] = useState<Stoppage | null>(null);

  const { data: stoppages = [], isLoading, error } = useQuery({
    queryKey: queryKeys.stoppages(pointId),
    queryFn: () => getStoppagesByPoint(pointId),
  });

  const handleResumeClick = (stoppage: Stoppage) => {
    setSelectedStoppage(stoppage);
    setResumeDialogOpen(true);
  };

  if (isLoading) {
    return null; // Don't show loading state for this optional component
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error instanceof Error ? error.message : t("common:messages.error")}
      </Alert>
    );
  }

  if (stoppages.length === 0) {
    return null; // Don't show anything if no stoppages
  }

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t("points:callsTitle", { count: stoppages.length })}
        </Typography>
        <Stack spacing={1}>
          {stoppages.map((stoppage) => {
            const callTime = new Date(stoppage.call_timestamp);
            const isResolved = stoppage.resume_timestamp !== null;
            let durationText = '';
            const stoppageTypeLabel = getStoppageTypeLabel(t, stoppage.stoppage_type);

            if (isResolved) {
              const resumeTime = new Date(stoppage.resume_timestamp!);
              const durationSeconds = Math.floor((resumeTime.getTime() - callTime.getTime()) / 1000);
              const minutes = Math.floor(durationSeconds / 60);
              const seconds = durationSeconds % 60;
              durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }

            return (
              <Card key={stoppage.id} variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PauseCircleIcon fontSize="small" color="action" />
                    <Chip label={stoppageTypeLabel} size="small" variant="outlined" />
                    <Typography variant="body2">
                      {formatElapsedTime(pointStartTime, stoppage.call_timestamp)}
                    </Typography>
                    {isResolved ? (
                      <Chip
                        label={`${t('callDuration')}: ${durationText}`}
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={t('callPending')}
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>
                  {stoppage.comments && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 3, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                      {stoppage.comments}
                    </Typography>
                  )}
                  {!isResolved && (
                    <Box sx={{ mt: 1, ml: 3 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleResumeClick(stoppage)}
                      >
                        {t('resumeFromCall')}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>

      {selectedStoppage && (
        <ResumeFromStoppageDialog
          open={resumeDialogOpen}
          onClose={() => {
            setResumeDialogOpen(false);
            setSelectedStoppage(null);
          }}
          stoppage={selectedStoppage}
        />
      )}
    </>
  );
};
