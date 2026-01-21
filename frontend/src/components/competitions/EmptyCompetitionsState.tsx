import { Box, Typography, Button, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AddIcon from "@mui/icons-material/Add";

interface EmptyCompetitionsStateProps {
  onCreateClick: () => void;
}

export default function EmptyCompetitionsState({
  onCreateClick,
}: EmptyCompetitionsStateProps) {
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
        <EmojiEventsIcon sx={{ fontSize: 32, color: "primary.main" }} />
      </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        No Competitions Yet
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, maxWidth: 500, mx: "auto" }}
      >
        Create a competition to organize games, manage rosters, and track your
        team's performance
      </Typography>

      <Button
        variant="contained"
        size="large"
        startIcon={<AddIcon />}
        onClick={onCreateClick}
      >
        Create Your First Competition
      </Button>
    </Paper>
  );
}
