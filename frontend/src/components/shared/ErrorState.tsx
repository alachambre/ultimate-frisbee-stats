import { Box, Typography, Alert } from "@mui/material";

interface ErrorStateProps {
  message: string;
  title?: string;
}

export default function ErrorState({
  message,
  title = "Error",
}: ErrorStateProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="256px"
    >
      <Alert severity="error" sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2">{message}</Typography>
      </Alert>
    </Box>
  );
}
