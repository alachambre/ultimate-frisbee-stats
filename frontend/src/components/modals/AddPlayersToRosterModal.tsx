import { useTranslation } from "react-i18next";
import { addPlayersToRoster, getTeamPlayers, removePlayersFromRoster } from "../../services";
import AddPlayersModal from "./AddPlayersModal";
import { queryKeys } from "../../utils/queryKeys";

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
      playersQueryKey={["manage-roster-players", "competition", competitionId, "team", teamId]}
      addPlayers={(playerIds) => addPlayersToRoster(competitionId, playerIds)}
      removePlayers={(playerIds) => removePlayersFromRoster(competitionId, playerIds)}
      invalidateQueries={[
        queryKeys.competition(competitionId),
        queryKeys.competitionPlayers(competitionId),
      ]}
      loadingMessage={t('competitions:modal.addPlayers.loading')}
      emptyMessage={t('competitions:modal.addPlayers.allInRoster')}
    />
  );
}
