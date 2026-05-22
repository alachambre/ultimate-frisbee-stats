import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import type { GameWithScore } from "../../types";
import NewRecordGameCard from "./NewRecordGameCard";

interface NewRecordGamesSectionProps {
  emptyLabel: string;
  games: GameWithScore[];
  title: string;
}

export default function NewRecordGamesSection({
  emptyLabel,
  games,
  title,
}: NewRecordGamesSectionProps) {
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
            <Grid key={game.id} size={{ xs: 12, sm: 6 }}>
              <NewRecordGameCard game={game} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
