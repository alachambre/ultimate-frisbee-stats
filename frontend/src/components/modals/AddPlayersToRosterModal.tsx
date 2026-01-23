import { addPlayersToRoster, getTeamPlayers } from "../../services";
import AddPlayersModal from "./AddPlayersModal";

interface AddPlayersToRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: number;
  teamId: number;
  currentRosterIds: number[];
}

export default function AddPlayersToRosterModal({
  isOpen,
  onClose,
  competitionId,
  teamId,
  currentRosterIds,
}: AddPlayersToRosterModalProps) {
  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Players to Roster"
      currentPlayerIds={currentRosterIds}
      fetchPlayers={() => getTeamPlayers(teamId)}
      addPlayers={(playerIds) => addPlayersToRoster(competitionId, playerIds)}
      invalidateQueries={[["competition", String(competitionId)]]}
      emptyMessage="All team players are already in the roster"
    />
  );
}
