import type { CompetitionWithTeam, GameWithScore } from "../../types";

interface BuildNewGamesDashboardArgs {
  games: GameWithScore[];
  selectedTeamId?: number;
  teamCompetitions?: CompetitionWithTeam[];
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

export interface NewGamesDashboardView {
  allGames: GameWithScore[];
  liveGames: GameWithScore[];
  upcomingGames: GameWithScore[];
  recentGames: GameWithScore[];
  summary: NewGamesDashboardSummary;
  hasTeamScope: boolean;
}

function getGameTime(game: GameWithScore): number {
  return game.date ? new Date(game.date).getTime() : Number.POSITIVE_INFINITY;
}

function sortAscendingByDate(a: GameWithScore, b: GameWithScore): number {
  return getGameTime(a) - getGameTime(b);
}

function sortDescendingByDate(a: GameWithScore, b: GameWithScore): number {
  return getGameTime(b) - getGameTime(a);
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

export function buildNewGamesDashboard(
  args: BuildNewGamesDashboardArgs
): NewGamesDashboardView {
  const { selectedTeamId, teamCompetitions } = args;
  const scopedGames = buildScopedGames(args);
  const liveGames = scopedGames
    .filter((game) => game.status === "started")
    .sort(sortAscendingByDate);
  const upcomingGames = scopedGames
    .filter((game) => game.status !== "started" && game.status !== "ended")
    .sort(sortAscendingByDate);
  const recentGames = scopedGames
    .filter((game) => game.status === "ended")
    .sort(sortDescendingByDate);

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
    hasTeamScope: selectedTeamId !== undefined,
    summary: {
      totalGames: scopedGames.length,
      liveGames: liveGames.length,
      upcomingGames: upcomingGames.length,
      completedGames: recentGames.length,
      competitions:
        selectedTeamId === undefined
          ? new Set(scopedGames.map((game) => game.competition_id)).size
          : teamCompetitions?.length ?? 0,
      wins,
      losses,
      draws,
    },
  };
}
