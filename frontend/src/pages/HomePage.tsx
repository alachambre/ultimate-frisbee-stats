import { Link } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Box,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import GroupIcon from "@mui/icons-material/Group";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import { useTranslation } from "react-i18next";

import { shouldEnforcePermissions, useAuth } from "../auth";
import { APP_MONKEY_EMOJI } from "../constants/branding";

export default function HomePage() {
  const auth = useAuth();
  const { t } = useTranslation("common");
  const shouldProtectUi = shouldEnforcePermissions(auth.enforcementMode, auth.isLoading);
  const cards = [
    ...((!shouldProtectUi || auth.capabilities.canEditData)
      ? [
          {
            title: t("home.cards.teams.title"),
            description: t("home.cards.teams.description"),
            path: "/teams",
            icon: <GroupIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />,
          },
        ]
      : []),
    {
      title: t("home.cards.competitions.title"),
      description: t("home.cards.competitions.description"),
      path: "/competitions",
      icon: (
        <EmojiEventsIcon
          sx={{ fontSize: 60, color: (theme) => theme.gradients.middle, mb: 2 }}
        />
      ),
    },
    ...((!shouldProtectUi || auth.capabilities.canViewStatistics)
      ? [
          {
            title: t("home.cards.statistics.title"),
            description: t("home.cards.statistics.description"),
            path: "/statistics",
            icon: (
              <QueryStatsIcon
                sx={{ fontSize: 60, color: (theme) => theme.colors.pull.main, mb: 2 }}
              />
            ),
          },
        ]
      : []),
  ];

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
          {APP_MONKEY_EMOJI} {t("app.name")}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          {t("home.subtitle")}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {t("home.byline")}
        </Typography>
      </Box>

      <Grid
        container
        spacing={4}
        justifyContent={cards.length === 1 ? "center" : "flex-start"}
        data-testid="home-cards-grid"
      >
        {cards.map((card) => (
          <Grid key={card.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "2px solid transparent",
                background: (theme) =>
                  `linear-gradient(${theme.palette.common.white}, ${theme.palette.common.white}) padding-box, ${theme.gradients.primary} border-box`,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: (theme) =>
                    `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            >
              <CardActionArea component={Link} to={card.path} sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  {card.icon}
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
