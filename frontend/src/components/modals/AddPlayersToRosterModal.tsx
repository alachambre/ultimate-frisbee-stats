import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('competitions');

  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('competitions:modal.addPlayers.title')}
      currentPlayerIds={currentRosterIds}
      fetchPlayers={() => getTeamPlayers(teamId)}
      addPlayers={(playerIds) => addPlayersToRoster(competitionId, playerIds)}
      invalidateQueries={[["competition", String(competitionId)]]}
      emptyMessage={t('competitions:modal.addPlayers.allInRoster')}
    />
  );
}
