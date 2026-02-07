import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface EmptyPlayersStateProps {
  onAddClick: () => void;
  emptyMessage?: string;
  buttonLabel?: string;
}

export default function EmptyPlayersState({
  onAddClick,
  emptyMessage = "No players yet",
  buttonLabel = "Add First Player",
}: EmptyPlayersStateProps) {
  return (
    <Box textAlign="center" py={4}>
      <Typography variant="body1" color="text.secondary" mb={2}>
        {emptyMessage}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddClick}
      >
        {buttonLabel}
      </Button>
    </Box>
  );
}
