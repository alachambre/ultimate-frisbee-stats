import { Grid } from "@mui/material";
import type { Player } from "../../types";
import PlayerCard from "./PlayerCard";

interface PlayersGridProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
  onEditPlayer?: (player: Player) => void;
  onDeletePlayer?: (player: Player) => void;
}

export default function PlayersGrid({
  players,
  onPlayerClick,
  onEditPlayer,
  onDeletePlayer,
}: PlayersGridProps) {
  return (
    <Grid container spacing={2}>
      {players.map((player) => (
        <Grid size={{ xs: 12, sm: 6 }} key={player.id}>
          <PlayerCard
            player={player}
            onCardClick={onPlayerClick ? () => onPlayerClick(player) : undefined}
            onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
            onDelete={onDeletePlayer ? () => onDeletePlayer(player) : undefined}
          />
        </Grid>
      ))}
    </Grid>
  );
}
