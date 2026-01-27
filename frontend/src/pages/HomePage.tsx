import { Link } from "react-router-dom";
import { Container, Typography, Grid, Card, CardActionArea, CardContent, Box } from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t } = useTranslation('common');
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
          🥏 {t('home.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          {t('home.subtitle')}
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
                  {t('home.cards.teams.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('home.cards.teams.description')}
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
                  {t('home.cards.competitions.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('home.cards.competitions.description')}
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
                  {t('home.cards.games.title')}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {t('home.cards.games.description')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
