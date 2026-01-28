import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('games');

  return (
    <AddPlayersModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('games:modal.addPlayers.title')}
      currentPlayerIds={currentPlayerIds}
      fetchPlayers={async () => {
        const competition = await getCompetition(competitionId);
        return competition.players;
      }}
      addPlayers={(playerIds) => addPlayersToGame(gameId, playerIds)}
      invalidateQueries={[["game", String(gameId)]]}
      loadingMessage={t('games:modal.addPlayers.loading')}
      emptyMessage={t('games:modal.addPlayers.empty')}
    />
  );
}
