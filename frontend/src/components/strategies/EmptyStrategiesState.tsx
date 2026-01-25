import { Box, Typography, Button, Paper } from "@mui/material";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import AddIcon from "@mui/icons-material/Add";

interface EmptyStrategiesStateProps {
  onCreateClick: () => void;
}

export default function EmptyStrategiesState({
  onCreateClick,
}: EmptyStrategiesStateProps) {
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
        <EmojiObjectsIcon sx={{ fontSize: 32, color: "primary.main" }} />
      </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        No Strategies Yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: "auto" }}>
        Create offensive and defensive strategies to assign to points during live tracking
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        Create Your First Strategy
      </Button>
    </Paper>
  );
}
