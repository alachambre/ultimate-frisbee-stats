import { Link } from "react-router-dom";
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center" mb={8}>
        <Typography
          variant="h2"
          fontWeight="bold"
          gutterBottom
          sx={{
            background: (theme) => theme.gradients.primary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: { xs: "2rem", sm: "3rem" },
          }}
        >
          🥏 Ultimate Frisbee Stats
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Track your team's performance, game by game, point by point
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "2px solid transparent",
              background: (theme) =>
                `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: (theme) =>
                  `0 8px 24px ${theme.palette.primary.main}4D`,
              },
            }}
          >
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

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "2px solid transparent",
              background: (theme) =>
                `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: (theme) =>
                  `0 8px 24px ${theme.palette.primary.main}4D`,
              },
            }}
          >
            <CardActionArea component={Link} to="/competitions" sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <EmojiEventsIcon sx={{ fontSize: 60, color: (theme) => theme.gradients.middle, mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Competitions
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Organize tournaments and track results
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            elevation={0}
            sx={{
              height: "100%",
              border: "2px solid transparent",
              background: (theme) =>
                `linear-gradient(white, white) padding-box, ${theme.gradients.primary} border-box`,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: (theme) =>
                  `0 8px 24px ${theme.palette.primary.main}4D`,
              },
            }}
          >
            <CardActionArea component={Link} to="/games" sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <ScoreboardIcon sx={{ fontSize: 60, color: "secondary.main", mb: 2 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Games
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
