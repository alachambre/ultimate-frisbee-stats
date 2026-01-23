import { addPlayersToGame } from "../../services/games";
import { getCompetition } from "../../services/competitions";
import AddPlayersModal from "./AddPlayersModal";

interface AddPlayersToGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  competitionId: number;
  currentPlayerIds: number[];
}

export default function AddPlayersToGameModal({
  isOpen,
  onClose,
  gameId,
  competitionId,
  currentPlayerIds,
}: AddPlayersToGameModalProps) {
  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Players to Game"
      currentPlayerIds={currentPlayerIds}
      fetchPlayers={async () => {
        const competition = await getCompetition(competitionId);
        return competition.players;
      }}
      addPlayers={(playerIds) => addPlayersToGame(gameId, playerIds)}
      invalidateQueries={[["game", String(gameId)]]}
      emptyMessage="All competition players are already in the game"
    />
  );
}
