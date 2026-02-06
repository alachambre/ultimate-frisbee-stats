import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  message?: string;
  showColdStartHint?: boolean;
  coldStartDelayMs?: number;
}

export default function LoadingState({
  message,
  showColdStartHint = true,
  coldStartDelayMs = 5000,
}: LoadingStateProps) {
  const { t } = useTranslation('common');
  const [showColdStart, setShowColdStart] = useState(false);

  useEffect(() => {
    if (!showColdStartHint) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setShowColdStart(true);
    }, coldStartDelayMs);

    return () => window.clearTimeout(timerId);
  }, [coldStartDelayMs, showColdStartHint]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="256px"
    >
      <CircularProgress size={60} sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        {message || t('common:action.loading')}
      </Typography>
      {showColdStart && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 1,
            textAlign: "center",
            maxWidth: 320,
            whiteSpace: "pre-line",
          }}
        >
          {t("common:messages.coldStartHint")}
        </Typography>
      )}
    </Box>
  );
}
