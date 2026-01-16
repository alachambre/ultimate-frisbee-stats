import { Grid } from "@mui/material";
import type { Player } from "../../types";
import PlayerCard from "./PlayerCard";

interface PlayersGridProps {
  players: Player[];
  onEditPlayer: (player: Player) => void;
}

export default function PlayersGrid({
  players,
  onEditPlayer,
}: PlayersGridProps) {
  return (
    <Grid container spacing={2}>
      {players.map((player) => (
        <Grid item xs={12} sm={6} key={player.id}>
          <PlayerCard player={player} onEdit={() => onEditPlayer(player)} />
        </Grid>
      ))}
    </Grid>
  );
}
