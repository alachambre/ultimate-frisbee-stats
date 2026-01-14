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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          onEdit={() => onEditPlayer(player)}
        />
      ))}
    </div>
  );
}
