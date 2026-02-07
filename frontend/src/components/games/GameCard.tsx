import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CardActionArea,
  Chip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import { useTranslation } from "react-i18next";
import type { GameWithScore } from "../../types";
import StatusChip from "../shared/StatusChip";
import { formatDate } from "../../utils/dateFormatting";

interface GameCardProps {
  game: GameWithScore;
}

export default function GameCard({ game }: GameCardProps) {
  const { t, i18n } = useTranslation(["games", "common"]);
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
                ? formatDate(game.date, i18n.resolvedLanguage)
                : t("games:detail.dateNotSet")}
            </Typography>
          </Box>

          <Box display="flex" gap={1} justifyContent="center" flexWrap="wrap">
            <StatusChip
              kind="game"
              status={game.status}
              ourScore={game.our_score}
              opponentScore={game.opponent_score}
              size="small"
            />
            <Chip label={game.team_name} variant="outlined" size="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
