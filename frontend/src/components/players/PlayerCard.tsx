import type { Player } from "../../types";

interface PlayerCardProps {
  player: Player;
  onEdit: () => void;
}

export default function PlayerCard({ player, onEdit }: PlayerCardProps) {
  return (
    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300">
      <div>
        <p className="font-medium text-gray-900">{player.name}</p>
        {player.number !== null && (
          <p className="text-sm text-gray-500">#{player.number}</p>
        )}
      </div>
      <button
        onClick={onEdit}
        className="text-blue-600 hover:text-blue-700 text-sm"
      >
        Edit
      </button>
    </div>
  );
}
