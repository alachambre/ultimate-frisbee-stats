import { useTranslation } from "react-i18next";
import { addPlayersToLine } from "../../services/lines";
import { getTeam } from "../../services";
import AddPlayersModal from "./AddPlayersModal";
import { queryKeys } from "../../utils/queryKeys";

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
  const { t } = useTranslation('lines');

  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lines:modal.addPlayers.title')}
      currentPlayerIds={currentPlayerIds}
      fetchPlayers={async () => {
        const team = await getTeam(teamId);
        return team.players;
      }}
      addPlayers={(playerIds) => addPlayersToLine(lineId, playerIds)}
      invalidateQueries={[queryKeys.line(lineId)]}
      loadingMessage={t('lines:modal.addPlayers.loading')}
      emptyMessage={t('lines:modal.addPlayers.empty')}
    />
  );
}
