import { Box, Typography, Button, Paper } from "@mui/material";
import SportsIcon from "@mui/icons-material/Sports";
import AddIcon from "@mui/icons-material/Add";

interface EmptyGamesStateProps {
  onCreateClick: () => void;
}

export default function EmptyGamesState({
  onCreateClick,
}: EmptyGamesStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: "center",
        py: 10,
        px: 4,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          bgcolor: "primary.light",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 3,
        }}
      >
        <SportsIcon sx={{ fontSize: 32, color: "primary.main" }} />
      </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        No Games Yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
        Get started by creating your first game to track stats and points
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        Create Your First Game
      </Button>
    </Paper>
  );
}
