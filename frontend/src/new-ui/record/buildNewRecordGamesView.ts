import type { Competition, GameWithScore } from "../../types";

interface BuildNewRecordGamesViewInput {
  games: GameWithScore[];
  selectedTeamId?: number;
  teamCompetitions?: Competition[];
}

export interface NewRecordGamesView {
  startedGames: GameWithScore[];
  readyGames: GameWithScore[];
  allRecordableGames: GameWithScore[];
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

export function buildNewRecordGamesView({
  games,
  selectedTeamId,
  teamCompetitions,
}: BuildNewRecordGamesViewInput): NewRecordGamesView {
  const selectedCompetitionIds =
    selectedTeamId === undefined || teamCompetitions === undefined
      ? undefined
      : new Set(teamCompetitions.map((competition) => competition.id));
  const scopedGames =
    selectedCompetitionIds === undefined
      ? games
      : games.filter((game) => selectedCompetitionIds.has(game.competition_id));

  const startedGames = scopedGames
    .filter((game) => game.status === "started")
    .slice()
    .sort((left, right) => compareNullableDatesAsc(left.date, right.date));
  const readyGames = scopedGames
    .filter((game) => game.status === "ready")
    .slice()
    .sort((left, right) => compareNullableDatesAsc(left.date, right.date));

  return {
    startedGames,
    readyGames,
    allRecordableGames: [...startedGames, ...readyGames],
  };
}
