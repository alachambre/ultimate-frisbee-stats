import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import StatusChip from "../../components/shared/StatusChip";
import type { GameWithScore } from "../../types";
import { formatDateTime } from "../../utils/dateFormatting";

interface NewLiveGamesListProps {
  emptyLabel: string;
  games: GameWithScore[];
  selectedGameId?: number;
}

export default function NewLiveGamesList({
  emptyLabel,
  games,
  selectedGameId,
}: NewLiveGamesListProps) {
  const { i18n } = useTranslation();

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
        return (
          <Paper
            component={Link}
            elevation={0}
            key={game.id}
            to={`/live/${game.id}`}
            sx={(theme) => ({
              bgcolor: isSelected
                ? alpha(theme.palette.primary.main, 0.1)
                : "background.paper",
              border: `1px solid ${
                isSelected ? theme.palette.primary.main : theme.palette.divider
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
                <StatusChip
                  kind="game"
                  opponentScore={game.opponent_score}
                  ourScore={game.our_score}
                  status={game.status}
                />
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
