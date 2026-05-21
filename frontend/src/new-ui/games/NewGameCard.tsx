import { Link } from "react-router-dom";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import StatusChip from "../../components/shared/StatusChip";
import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewGameCardProps {
  game: GameWithScore;
}

function getActionLabel(
  status: GameWithScore["status"],
  t: ReturnType<typeof useTranslation<["games", "navigation"]>>["t"]
) {
  if (status === "started") {
    return t("navigation:newUiPages.allGames.actions.openLive", {
      defaultValue: "Open live",
    });
  }

  if (status === "ended") {
    return t("navigation:newUiPages.allGames.actions.review", {
      defaultValue: "Review",
    });
  }

  return t("navigation:newUiPages.allGames.actions.prepare", {
    defaultValue: "Prepare",
  });
}

export default function NewGameCard({ game }: NewGameCardProps) {
  const { t, i18n } = useTranslation(["games", "navigation"]);
  const actionLabel = getActionLabel(game.status, t);
  const cardPath = game.status === "started" ? `/live/${game.id}` : `/games/${game.id}`;

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        height: "100%",
      })}
    >
      <CardActionArea
        component={Link}
        to={cardPath}
        sx={{
          alignItems: "stretch",
          display: "flex",
          height: "100%",
          textAlign: "left",
        }}
      >
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            width: "100%",
          }}
        >
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            spacing={1}
          >
            <StatusChip
              kind="game"
              status={game.status}
              ourScore={game.our_score}
              opponentScore={game.opponent_score}
              size="small"
            />
            <Chip label={actionLabel} size="small" variant="outlined" />
          </Stack>

          <Box>
            <Typography component="h3" fontWeight={800} variant="h6">
              {game.opponent_name}
            </Typography>
            <Stack alignItems="center" direction="row" spacing={0.75}>
              <EmojiEventsIcon color="action" sx={{ fontSize: 16 }} />
              <Typography color="text.secondary" variant="body2">
                {game.competition_name}
              </Typography>
            </Stack>
          </Box>

          <Typography component="p" fontWeight={800} variant="h4">
            {game.our_score} - {game.opponent_score}
          </Typography>

          <Stack
            alignItems="center"
            direction="row"
            spacing={0.75}
            sx={{ mt: "auto" }}
          >
            <CalendarTodayIcon color="action" sx={{ fontSize: 16 }} />
            <Typography color="text.secondary" variant="body2">
              {game.date
                ? formatDateTime(game.date, i18n.resolvedLanguage)
                : t("games:detail.dateNotSet")}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
