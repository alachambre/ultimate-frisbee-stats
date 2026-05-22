import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import type { GameWithScore } from "../../types";
import NewGameCard from "./NewGameCard";

interface NewGamesSectionProps {
  title: string;
  emptyLabel: string;
  games: GameWithScore[];
}

export default function NewGamesSection({
  title,
  emptyLabel,
  games,
}: NewGamesSectionProps) {
  return (
    <Box component="section">
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1, mb: 2 }}>
        <Typography component="h2" fontWeight={800} variant="h6">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {games.length}
        </Typography>
      </Box>

      {games.length === 0 ? (
        <Box
          sx={(theme) => ({
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            color: "text.secondary",
            p: 3,
          })}
        >
          <Typography variant="body2">{emptyLabel}</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {games.map((game) => (
            <Grid key={game.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <NewGameCard game={game} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
