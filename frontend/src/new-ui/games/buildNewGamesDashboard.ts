import type { CompetitionWithTeam, GameWithScore } from "../../types";

interface BuildNewGamesDashboardArgs {
  games: GameWithScore[];
  selectedTeamId?: number;
  teamCompetitions?: CompetitionWithTeam[];
  opponentSearch?: string;
}

export interface NewGamesDashboardSummary {
  totalGames: number;
  liveGames: number;
  upcomingGames: number;
  completedGames: number;
  competitions: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface NewGamesCompetitionGroupSummary {
  live: number;
  upcoming: number;
  completed: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface NewGamesCompetitionGroup {
  competitionId: number;
  competitionName: string;
  competition: CompetitionWithTeam | null;
  startDate: string | null;
  endDate: string | null;
  nextRelevantDate: string | null;
  mostRecentDate: string | null;
  isInitiallyExpanded: boolean;
  games: GameWithScore[];
  summary: NewGamesCompetitionGroupSummary;
}

export interface NewGamesDashboardView {
  allGames: GameWithScore[];
  liveGames: GameWithScore[];
  upcomingGames: GameWithScore[];
  recentGames: GameWithScore[];
  competitionGroups: NewGamesCompetitionGroup[];
  summary: NewGamesDashboardSummary;
  hasTeamScope: boolean;
}

function getDateTime(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : Number.POSITIVE_INFINITY;
}

function getGameTime(game: GameWithScore): number {
  return getDateTime(game.date);
}

function sortAscendingByDate(a: GameWithScore, b: GameWithScore): number {
  return getGameTime(a) - getGameTime(b);
}

function sortDescendingByDate(a: GameWithScore, b: GameWithScore): number {
  if (!a.date && !b.date) {
    return 0;
  }

  if (!a.date) {
    return 1;
  }

  if (!b.date) {
    return -1;
  }

  return getGameTime(b) - getGameTime(a);
}

function compareNullableDatesAscending(
  left: string | null,
  right: string | null
): number {
  return getDateTime(left) - getDateTime(right);
}

function compareNullableDatesDescending(
  left: string | null,
  right: string | null
): number {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return getDateTime(right) - getDateTime(left);
}

function isLiveGame(game: GameWithScore): boolean {
  return game.status === "started";
}

function isCompletedGame(game: GameWithScore): boolean {
  return game.status === "ended";
}

function isUpcomingGame(game: GameWithScore): boolean {
  return !isLiveGame(game) && !isCompletedGame(game);
}

function filterByOpponentSearch(
  games: GameWithScore[],
  opponentSearch?: string
): GameWithScore[] {
  const normalizedSearch = normalizeOpponentSearch(opponentSearch);
  if (!normalizedSearch) {
    return games;
  }

  return games.filter((game) =>
    game.opponent_name.toLocaleLowerCase().includes(normalizedSearch)
  );
}

function normalizeOpponentSearch(opponentSearch?: string): string {
  return opponentSearch?.trim().toLocaleLowerCase() ?? "";
}

function buildScopedGames({
  games,
  selectedTeamId,
  teamCompetitions,
}: BuildNewGamesDashboardArgs): GameWithScore[] {
  if (selectedTeamId === undefined) {
    return games;
  }

  const competitionIds = new Set(
    (teamCompetitions ?? []).map((competition) => competition.id)
  );

  return games.filter((game) => competitionIds.has(game.competition_id));
}

function summarizeGames(games: GameWithScore[]): NewGamesCompetitionGroupSummary {
  const completedGames = games.filter(isCompletedGame);
  const wins = completedGames.filter(
    (game) => game.our_score > game.opponent_score
  ).length;
  const losses = completedGames.filter(
    (game) => game.our_score < game.opponent_score
  ).length;

  return {
    live: games.filter(isLiveGame).length,
    upcoming: games.filter(isUpcomingGame).length,
    completed: completedGames.length,
    wins,
    losses,
    draws: completedGames.length - wins - losses,
  };
}

function sortGamesForCompetition(games: GameWithScore[]): GameWithScore[] {
  return [
    ...games.filter(isLiveGame).sort(sortAscendingByDate),
    ...games.filter(isUpcomingGame).sort(sortAscendingByDate),
    ...games.filter(isCompletedGame).sort(sortDescendingByDate),
  ];
}

function sortCompetitionGroups(
  left: NewGamesCompetitionGroup,
  right: NewGamesCompetitionGroup
): number {
  if (left.isInitiallyExpanded !== right.isInitiallyExpanded) {
    return left.isInitiallyExpanded ? -1 : 1;
  }

  if (left.isInitiallyExpanded) {
    return (
      compareNullableDatesAscending(
        left.nextRelevantDate,
        right.nextRelevantDate
      ) || left.competitionName.localeCompare(right.competitionName)
    );
  }

  return (
    compareNullableDatesDescending(left.mostRecentDate, right.mostRecentDate) ||
    left.competitionName.localeCompare(right.competitionName)
  );
}

function buildCompetitionGroups({
  games,
  teamCompetitions,
  includeEmptyCompetitions,
}: {
  games: GameWithScore[];
  teamCompetitions?: CompetitionWithTeam[];
  includeEmptyCompetitions: boolean;
}): NewGamesCompetitionGroup[] {
  const competitionById = new Map(
    (teamCompetitions ?? []).map((competition) => [competition.id, competition])
  );
  const gamesByCompetitionId = new Map<number, GameWithScore[]>();

  if (includeEmptyCompetitions) {
    competitionById.forEach((_, competitionId) => {
      gamesByCompetitionId.set(competitionId, []);
    });
  }

  games.forEach((game) => {
    const competitionGames = gamesByCompetitionId.get(game.competition_id) ?? [];
    competitionGames.push(game);
    gamesByCompetitionId.set(game.competition_id, competitionGames);
  });

  return Array.from(gamesByCompetitionId.entries())
    .map(([competitionId, competitionGames]) => {
      const sortedGames = sortGamesForCompetition(competitionGames);
      const liveAndUpcomingGames = sortedGames.filter(
        (game) => isLiveGame(game) || isUpcomingGame(game)
      );
      const completedGames = sortedGames.filter(isCompletedGame);
      const competition = competitionById.get(competitionId);
      const summary = summarizeGames(sortedGames);

      return {
        competitionId,
        competition: competition ?? null,
        competitionName:
          competition?.name ?? sortedGames[0]?.competition_name ?? "Competition",
        startDate: competition?.start_date ?? null,
        endDate: competition?.end_date ?? null,
        nextRelevantDate: liveAndUpcomingGames[0]?.date ?? null,
        mostRecentDate: completedGames[0]?.date ?? null,
        isInitiallyExpanded: summary.live > 0 || summary.upcoming > 0,
        games: sortedGames,
        summary,
      };
    })
    .sort(sortCompetitionGroups);
}

export function buildNewGamesDashboard(
  args: BuildNewGamesDashboardArgs
): NewGamesDashboardView {
  const { selectedTeamId, teamCompetitions } = args;
  const hasOpponentSearch = Boolean(normalizeOpponentSearch(args.opponentSearch));
  const scopedGames = filterByOpponentSearch(
    buildScopedGames(args),
    args.opponentSearch
  );
  const liveGames = scopedGames
    .filter(isLiveGame)
    .sort(sortAscendingByDate);
  const upcomingGames = scopedGames
    .filter(isUpcomingGame)
    .sort(sortAscendingByDate);
  const recentGames = scopedGames
    .filter(isCompletedGame)
    .sort(sortDescendingByDate);
  const competitionGroups = buildCompetitionGroups({
    games: scopedGames,
    teamCompetitions,
    includeEmptyCompetitions: selectedTeamId !== undefined && !hasOpponentSearch,
  });

  const wins = recentGames.filter(
    (game) => game.our_score > game.opponent_score
  ).length;
  const losses = recentGames.filter(
    (game) => game.our_score < game.opponent_score
  ).length;
  const draws = recentGames.length - wins - losses;

  return {
    allGames: [...liveGames, ...upcomingGames, ...recentGames],
    liveGames,
    upcomingGames,
    recentGames,
    competitionGroups,
    hasTeamScope: selectedTeamId !== undefined,
    summary: {
      totalGames: scopedGames.length,
      liveGames: liveGames.length,
      upcomingGames: upcomingGames.length,
      completedGames: recentGames.length,
      competitions: competitionGroups.length,
      wins,
      losses,
      draws,
    },
  };
}
