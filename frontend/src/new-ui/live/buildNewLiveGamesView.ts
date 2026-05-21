import type { GameWithScore } from "../../types";

interface BuildNewLiveGamesViewInput {
  games: GameWithScore[];
  selectedGameId?: number;
}

export interface NewLiveGamesView {
  liveGames: GameWithScore[];
  selectedGame: GameWithScore | null;
}

function compareNullableDatesAsc(
  leftDate?: string | null,
  rightDate?: string | null
) {
  if (!leftDate && !rightDate) {
    return 0;
  }
  if (!leftDate) {
    return 1;
  }
  if (!rightDate) {
    return -1;
  }

  return new Date(leftDate).getTime() - new Date(rightDate).getTime();
}

export function buildNewLiveGamesView({
  games,
  selectedGameId,
}: BuildNewLiveGamesViewInput): NewLiveGamesView {
  const liveGames = games
    .filter((game) => game.status === "started")
    .slice()
    .sort((left, right) => compareNullableDatesAsc(left.date, right.date));

  return {
    liveGames,
    selectedGame:
      liveGames.find((game) => game.id === selectedGameId) ??
      liveGames[0] ??
      null,
  };
}
