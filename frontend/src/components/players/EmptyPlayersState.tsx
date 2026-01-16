import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface EmptyPlayersStateProps {
  onAddClick: () => void;
}

export default function EmptyPlayersState({
  onAddClick,
}: EmptyPlayersStateProps) {
  return (
    <Box textAlign="center" py={4}>
      <Typography variant="body1" color="text.secondary" mb={2}>
        No players yet
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddClick}
      >
        Add First Player
      </Button>
    </Box>
  );
}
