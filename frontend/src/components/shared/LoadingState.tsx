import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message,
}: LoadingStateProps) {
  const { t } = useTranslation('common');
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
    </Box>
  );
}
