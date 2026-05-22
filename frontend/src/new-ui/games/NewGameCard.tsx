import { Link } from "react-router-dom";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewGameCardProps {
  game: GameWithScore;
}

function getActionLabel(
  status: GameWithScore["status"],
  t: ReturnType<typeof useTranslation<["games", "navigation"]>>["t"]
) {
  if (status !== "ended") {
    return t("navigation:newUiPages.allGames.actions.go", {
      defaultValue: "Go",
    });
  }

  return t("navigation:newUiPages.allGames.actions.review", {
    defaultValue: "Review",
  });
}

function getGameOutcome(
  ourScore: number | undefined,
  opponentScore: number | undefined
): "won" | "lost" | "draw" {
  if (ourScore === opponentScore) {
    return "draw";
  }

  return (ourScore ?? 0) > (opponentScore ?? 0) ? "won" : "lost";
}

function getStatusChipProps(
  game: GameWithScore,
  t: ReturnType<typeof useTranslation<["games", "navigation"]>>["t"]
): Pick<ChipProps, "color" | "label"> {
  if (game.status === "started") {
    return {
      color: "primary",
      label: t("navigation:newUiPages.allGames.status.live"),
    };
  }

  if (game.status === "ready") {
    return {
      color: "info",
      label: t("navigation:newUiPages.allGames.status.ready"),
    };
  }

  const outcome = getGameOutcome(game.our_score, game.opponent_score);
  const outcomeColors: Record<typeof outcome, ChipProps["color"]> = {
    draw: "warning",
    lost: "error",
    won: "success",
  };

  return {
    color: outcomeColors[outcome],
    label: t(`navigation:newUiPages.allGames.status.${outcome}`),
  };
}

export default function NewGameCard({ game }: NewGameCardProps) {
  const { t, i18n } = useTranslation(["games", "navigation"]);
  const actionLabel = getActionLabel(game.status, t);
  const actionPath =
    game.status === "ended" ? `/games/${game.id}` : `/live/${game.id}`;
  const statusChipProps = getStatusChipProps(game, t);

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
      })}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          p: { xs: 2, sm: 2.5 },
          "&:last-child": { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            alignItems={{ xs: "flex-start", sm: "center" }}
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Chip {...statusChipProps} size="small" />
            <Stack alignItems="center" direction="row" spacing={0.75}>
              <CalendarTodayIcon color="action" sx={{ fontSize: 16 }} />
              <Typography color="text.secondary" variant="body2">
                {game.date
                  ? formatDateTime(game.date, i18n.resolvedLanguage)
                  : t("games:detail.dateNotSet")}
              </Typography>
            </Stack>
          </Stack>

          <Typography component="h3" fontWeight={800} variant="subtitle1">
            {game.opponent_name}
          </Typography>
          <Stack alignItems="center" direction="row" spacing={0.75}>
            <EmojiEventsIcon color="action" sx={{ fontSize: 16 }} />
            <Typography color="text.secondary" variant="body2">
              {game.competition_name}
            </Typography>
          </Stack>
        </Box>

        <Stack
          alignItems={{ xs: "stretch", sm: "center" }}
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{
            flexShrink: 0,
            justifyContent: "space-between",
            minWidth: { sm: 180 },
          }}
        >
          <Typography
            component="p"
            fontWeight={800}
            textAlign={{ xs: "left", sm: "right" }}
            variant="h5"
          >
            {game.our_score} - {game.opponent_score}
          </Typography>
          <Button
            component={Link}
            to={actionPath}
            variant={game.status === "ended" ? "outlined" : "contained"}
            sx={{ minWidth: { xs: "100%", sm: 96 } }}
          >
            {actionLabel}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
