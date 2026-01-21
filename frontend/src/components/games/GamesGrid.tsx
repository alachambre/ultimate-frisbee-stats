import { GridLegacy as Grid } from "@mui/material";
import type { GameWithScore } from "../../types";
import GameCard from "./GameCard";

interface GamesGridProps {
  games: GameWithScore[];
}

export default function GamesGrid({ games }: GamesGridProps) {
  return (
    <Grid container spacing={3}>
      {games.map((game) => (
        <Grid item xs={12} sm={6} md={4} key={game.id}>
          <GameCard game={game} />
        </Grid>
      ))}
    </Grid>
  );
}
