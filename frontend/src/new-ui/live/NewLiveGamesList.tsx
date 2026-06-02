import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewLiveGamesListProps {
  emptyLabel: string;
  games: GameWithScore[];
  selectedGameId?: number;
}

function getGameOutcome(game: GameWithScore): "won" | "lost" | "draw" | null {
  if (game.our_score > game.opponent_score) {
    return "won";
  }

  if (game.our_score < game.opponent_score) {
    return "lost";
  }

  return game.status === "ended" ? "draw" : null;
}

function getStatusChipProps(
  game: GameWithScore,
  t: (key: string) => string
): {
  color?: ChipProps["color"];
  label: string;
  sx?: SxProps<Theme>;
  variant?: ChipProps["variant"];
} {
  if (game.status === "started") {
    return {
      label: t("games:status.started"),
      sx: (theme) => ({
        bgcolor: theme.colors.newUi.primarySoft,
        borderColor: theme.colors.newUi.primaryBorder,
        color: theme.colors.newUi.primary,
        fontWeight: 700,
      }),
      variant: "outlined",
    };
  }

  if (game.status === "ready") {
    return {
      label: t("games:status.ready"),
      sx: (theme) => ({
        bgcolor: alpha(theme.colors.newUi.primary, 0.08),
        borderColor: theme.colors.newUi.primaryBorder,
        color: theme.colors.newUi.primary,
        fontWeight: 700,
      }),
      variant: "outlined",
    };
  }

  const outcome = getGameOutcome(game);

  if (outcome === "won") {
    return { color: "success", label: t("games:status.won") };
  }

  if (outcome === "lost") {
    return { color: "error", label: t("games:status.lost") };
  }

  if (outcome === "draw") {
    return { color: "warning", label: t("games:status.draw") };
  }

  return { label: t("games:status.ended") };
}

export default function NewLiveGamesList({
  emptyLabel,
  games,
  selectedGameId,
}: NewLiveGamesListProps) {
  const { t, i18n } = useTranslation(["games"]);

  if (games.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={(theme) => ({
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1,
          color: "text.secondary",
          p: 3,
        })}
      >
        <Typography variant="body2">{emptyLabel}</Typography>
      </Paper>
    );
  }

  return (
    <Stack component="nav" spacing={1}>
      {games.map((game) => {
        const isSelected = game.id === selectedGameId;
        const statusChipProps = getStatusChipProps(game, t);
        return (
          <Paper
            component={Link}
            elevation={0}
            key={game.id}
            to={`/live/${game.id}`}
            sx={(theme) => ({
              bgcolor: isSelected
                ? alpha(theme.colors.newUi.primary, 0.1)
                : "background.paper",
              border: `1px solid ${
                isSelected ? theme.colors.newUi.primary : theme.palette.divider
              }`,
              borderRadius: 1,
              color: "text.primary",
              display: "block",
              p: 1.5,
              textDecoration: "none",
            })}
          >
            <Stack spacing={1}>
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
                spacing={1}
              >
                <Typography fontWeight={800} variant="body1">
                  {game.opponent_name}
                </Typography>
                <Chip size="small" {...statusChipProps} />
              </Stack>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  {game.competition_name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {game.date
                    ? formatDateTime(game.date, i18n.resolvedLanguage)
                    : game.team_name}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
