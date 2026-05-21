import { Link } from "react-router-dom";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
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

interface NewRecordGameCardProps {
  game: GameWithScore;
}

function getActionLabel(
  status: GameWithScore["status"],
  t: ReturnType<typeof useTranslation<["navigation"]>>["t"]
) {
  if (status === "started") {
    return t("newUiPages.recordGame.actions.continue", {
      defaultValue: "Continue recording",
    });
  }

  return t("newUiPages.recordGame.actions.prepare", {
    defaultValue: "Prepare game",
  });
}

export default function NewRecordGameCard({ game }: NewRecordGameCardProps) {
  const { t, i18n } = useTranslation(["games", "navigation"]);
  const actionLabel = getActionLabel(game.status, t);

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
        to={`/record/${game.id}`}
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
            minHeight: { xs: 176, sm: 196 },
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
              opponentScore={game.opponent_score}
              ourScore={game.our_score}
              status={game.status}
            />
            <Chip icon={<PlayArrowIcon />} label={actionLabel} variant="outlined" />
          </Stack>

          <Box>
            <Typography component="h3" fontWeight={800} variant="h6">
              {game.opponent_name}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {game.competition_name}
            </Typography>
          </Box>

          <Typography component="p" fontWeight={900} variant="h4">
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
