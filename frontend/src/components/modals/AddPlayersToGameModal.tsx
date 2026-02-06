import { useTranslation } from "react-i18next";
import { addPlayersToGame } from "../../services/games";
import { getCompetitionPlayers } from "../../services/competitions";
import AddPlayersModal from "./AddPlayersModal";
import { queryKeys } from "../../utils/queryKeys";

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
  const { t } = useTranslation('games');

  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('games:modal.addPlayers.title')}
      currentPlayerIds={currentPlayerIds}
      fetchPlayers={() => getCompetitionPlayers(competitionId)}
      addPlayers={(playerIds) => addPlayersToGame(gameId, playerIds)}
      invalidateQueries={[queryKeys.game(gameId)]}
      loadingMessage={t('games:modal.addPlayers.loading')}
      emptyMessage={t('games:modal.addPlayers.empty')}
    />
  );
}
