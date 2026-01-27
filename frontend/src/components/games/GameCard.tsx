import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Chip,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import { useTranslation } from "react-i18next";
import type { GameWithScore } from "../../types";

interface GameCardProps {
  game: GameWithScore;
}

export default function GameCard({ game }: GameCardProps) {
  const { t } = useTranslation(['games', 'common']);
  return (
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
      <CardActionArea
        component={Link}
        to={`/games/${game.id}`}
        sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}
      >
        <CardContent sx={{ width: "100%", flexGrow: 1, textAlign: "center", py: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
            <ScoreboardIcon sx={{ fontSize: 36, color: "secondary.main" }} />
            <Typography variant="h5" component="h2" fontWeight="bold">
              {game.opponent_name}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="center" gap={0.5} mb={1.5}>
            <EmojiEventsIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {game.competition_name}
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="h5" fontWeight="bold">
              {game.our_score} - {game.opponent_score}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            <CalendarTodayIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {game.date
                ? new Date(game.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : t('common:labels.date')}
            </Typography>
          </Box>

          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
            <Chip
              label={
                game.status === "started"
                  ? t('games:status.started')
                  : game.status === "ended"
                    ? game.our_score > game.opponent_score
                      ? t('points:dialog.finish.won')
                      : game.our_score < game.opponent_score
                        ? t('points:dialog.finish.lost')
                        : "Tie"
                    : t('games:status.ready')
              }
              color={
                game.status === "started"
                  ? "primary"
                  : game.status === "ended"
                    ? game.our_score > game.opponent_score
                      ? "success"
                      : game.our_score < game.opponent_score
                        ? "error"
                        : "warning"
                    : "info"
              }
              size="small"
            />
            <Chip label={game.team_name} variant="outlined" size="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
