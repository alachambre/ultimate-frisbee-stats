import { addPlayersToLine } from "../../services/lines";
import { getTeam } from "../../services";
import AddPlayersModal from "./AddPlayersModal";

interface AddPlayersToLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineId: number;
  teamId: number;
  currentPlayerIds: number[];
}

export default function AddPlayersToLineModal({
  isOpen,
  onClose,
  lineId,
  teamId,
  currentPlayerIds,
}: AddPlayersToLineModalProps) {
  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Players to Line"
      currentPlayerIds={currentPlayerIds}
      fetchPlayers={async () => {
        const team = await getTeam(teamId);
        return team.players;
      }}
      addPlayers={(playerIds) => addPlayersToLine(lineId, playerIds)}
      invalidateQueries={[["line", String(lineId)]]}
      emptyMessage="All team players are already in the line"
    />
  );
}
