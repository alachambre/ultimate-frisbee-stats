import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GroupIcon from "@mui/icons-material/Group";
import { useTranslation } from "react-i18next";
import type { TeamWithPlayers } from "../../types";

interface TeamCardProps {
  team: TeamWithPlayers;
}

export default function TeamCard({ team }: TeamCardProps) {
  const { t } = useTranslation(['teams', 'common']);
  const menCount = team.players.filter(p => p.gender === "M").length;
  const womenCount = team.players.filter(p => p.gender === "W").length;

  return (
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
      <CardActionArea
        component={Link}
        to={`/teams/${team.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1, textAlign: "center", py: 6 }}>
          <GroupIcon sx={{ fontSize: 72, color: "primary.main", mb: 3 }} />

          <Typography variant="h4" component="h2" fontWeight="bold" mb={2}>
            {team.name}
          </Typography>

          <Typography variant="body1" color="text.secondary" mb={2}>
            {menCount} {menCount === 1 ? t('common:labels.male') : t('points:dialog.start.men')}, {womenCount} {womenCount === 1 ? t('common:labels.female') : t('points:dialog.start.women')}
          </Typography>

          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(team.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
