import { Box, Typography, Alert } from "@mui/material";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  message: string;
  title?: string;
}

export default function ErrorState({
  message,
  title,
}: ErrorStateProps) {
  const { t } = useTranslation('common');
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="256px"
    >
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          {title || t('common:messages.error')}
        </Typography>
        <Typography variant="body2">{message}</Typography>
      </Alert>
    </Box>
  );
}
