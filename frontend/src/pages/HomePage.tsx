import { Link } from "react-router-dom";
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import SportsIcon from "@mui/icons-material/Sports";

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center" mb={8}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Ultimate Frisbee Stats Tracker
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Track your team's performance, game by game, point by point
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea component={Link} to="/teams" sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <GroupIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Manage Teams
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Create and manage your team roster
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardActionArea component={Link} to="/games" sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <SportsIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Track Games
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Record games and track point-by-point stats
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
