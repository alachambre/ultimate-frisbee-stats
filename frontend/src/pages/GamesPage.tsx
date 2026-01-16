import { Container, Box, Typography, Button, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function GamesPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold">
          Games
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Game
        </Button>
      </Box>

      <Paper sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="body1" color="text.secondary">
          Games page coming soon
        </Typography>
      </Paper>
    </Container>
  );
}
