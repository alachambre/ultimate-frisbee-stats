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
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewGameCardProps {
  canEditData?: boolean;
  game: GameWithScore;
  variant?: "card" | "row";
}

function getActionLabel(
  status: GameWithScore["status"],
  t: ReturnType<typeof useTranslation<"games">>["t"]
) {
  if (status !== "ended") {
    return t("games:dashboard.actions.go", {
      defaultValue: "Go",
    });
  }

  return t("games:dashboard.actions.review", {
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
  t: ReturnType<typeof useTranslation<"games">>["t"]
): Pick<ChipProps, "color" | "label"> {
  if (game.status === "started") {
    return {
      label: t("games:dashboard.status.live"),
    };
  }

  if (game.status === "ready") {
    return {
      label: t("games:dashboard.status.ready"),
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
    label: t(`games:dashboard.status.${outcome}`),
  };
}

export default function NewGameCard({
  canEditData = true,
  game,
  variant = "card",
}: NewGameCardProps) {
  const { t, i18n } = useTranslation("games");
  const actionLabel = getActionLabel(game.status, t);
  const actionPath =
    game.status === "ended" || !canEditData
      ? `/games/${game.id}`
      : `/live/${game.id}`;
  const statusChipProps = getStatusChipProps(game, t);
  const isRow = variant === "row";

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        bgcolor: "background.paper",
        border: {
          xs: isRow ? 0 : `1px solid ${theme.palette.divider}`,
          sm: `1px solid ${theme.palette.divider}`,
        },
        borderRadius: { xs: isRow ? 0 : 1, sm: 1 },
      })}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: { xs: isRow ? "row" : "column", sm: "row" },
          gap: { xs: isRow ? 1.25 : 2, sm: 2 },
          p: { xs: isRow ? 1.5 : 2, sm: 2.5 },
          "&:last-child": { pb: { xs: isRow ? 1.5 : 2, sm: 2.5 } },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            alignItems={{ xs: isRow ? "center" : "flex-start", sm: "center" }}
            direction={{ xs: isRow ? "row" : "column", sm: "row" }}
            spacing={1}
            sx={{ mb: isRow ? 0.5 : 1, minWidth: 0 }}
          >
            <Chip
              {...statusChipProps}
              size="small"
              sx={(theme) =>
                game.status === "started"
                  ? {
                      bgcolor: theme.colors.newUi.primary,
                      color: theme.palette.common.white,
                      fontWeight: 800,
                    }
                  : game.status === "ready"
                    ? {
                        bgcolor: theme.colors.newUi.primarySoft,
                        color: theme.colors.newUi.primary,
                        fontWeight: 800,
                      }
                    : {}
              }
            />
            <Stack
              alignItems="center"
              direction="row"
              spacing={0.75}
              sx={{ minWidth: 0 }}
            >
              <CalendarTodayIcon color="action" sx={{ fontSize: 16 }} />
              <Typography
                color="text.secondary"
                noWrap={isRow}
                variant="body2"
              >
                {game.date
                  ? formatDateTime(game.date, i18n.resolvedLanguage)
                  : t("games:detail.dateNotSet")}
              </Typography>
            </Stack>
          </Stack>

          <Typography
            component="h3"
            fontWeight={800}
            noWrap={isRow}
            variant="subtitle1"
          >
            {game.opponent_name}
          </Typography>
          <Stack
            alignItems="center"
            direction="row"
            spacing={0.75}
            sx={{ display: isRow ? { xs: "none", sm: "flex" } : "flex" }}
          >
            <EmojiEventsIcon color="action" sx={{ fontSize: 16 }} />
            <Typography color="text.secondary" variant="body2">
              {game.competition_name}
            </Typography>
          </Stack>
        </Box>

        <Stack
          alignItems={{ xs: isRow ? "flex-end" : "stretch", sm: "center" }}
          direction={{ xs: isRow ? "column" : "column", sm: "row" }}
          spacing={{ xs: isRow ? 0.75 : 1.5, sm: 1.5 }}
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
            variant={isRow ? "subtitle1" : "h5"}
          >
            {game.our_score} - {game.opponent_score}
          </Typography>
          <Button
            component={Link}
            size={isRow ? "small" : "medium"}
            to={actionPath}
            variant={game.status === "ended" ? "outlined" : "contained"}
            sx={(theme) => ({
              bgcolor:
                game.status === "ended"
                  ? "transparent"
                  : theme.colors.newUi.primaryAction,
              borderColor: theme.colors.newUi.primaryBorder,
              color:
                game.status === "ended"
                  ? theme.colors.newUi.primary
                  : theme.colors.newUi.primaryActionText,
              minWidth: { xs: isRow ? 72 : "100%", sm: 96 },
              px: { xs: isRow ? 1.5 : 2, sm: 2 },
              "&:hover": {
                bgcolor:
                  game.status === "ended"
                    ? alpha(theme.colors.newUi.primary, 0.08)
                    : theme.colors.newUi.primaryActionHover,
                borderColor: theme.colors.newUi.primary,
              },
            })}
          >
            {actionLabel}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
