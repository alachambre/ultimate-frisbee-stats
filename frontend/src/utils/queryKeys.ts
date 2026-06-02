function normalizeIds(ids?: number[]): string {
  if (!ids || ids.length === 0) {
    return "all";
  }

  return Array.from(new Set(ids))
    .sort((a, b) => a - b)
    .join(",");
}

export const queryKeys = {
  health: ["health"] as const,
  competitions: ["competitions"] as const,
  competition: (competitionId: number) => ["competition", competitionId] as const,
  competitionsByTeam: (teamId: number) => ["competitions", "team", teamId] as const,
  competitionPlayers: (competitionId: number) =>
    ["competition-players", competitionId] as const,
  competitionGames: (competitionId: number) =>
    ["competition-games", competitionId] as const,
  games: ["games"] as const,
  game: (gameId: number) => ["game", gameId] as const,
  gameLiveState: (gameId: number) => ["gameLiveState", gameId] as const,
  gameTurnovers: (gameId: number) => ["gameTurnovers", gameId] as const,
  halftime: (gameId: number) => ["halftime", gameId] as const,
  activePoint: (gameId: number) => ["activePoint", gameId] as const,
  liveStats: (gameId: number, playerIds?: number[]) =>
    ["liveStats", gameId, normalizeIds(playerIds)] as const,
  gamePointTimeline: (gameId: number, playerIds?: number[]) =>
    ["gamePointTimeline", gameId, normalizeIds(playerIds)] as const,
  gameTeamStatistics: (gameId: number, playerIds?: number[]) =>
    ["gameTeamStatistics", gameId, normalizeIds(playerIds)] as const,
  gameStrategyStatistics: (gameId: number, playerIds?: number[]) =>
    ["gameStrategyStatistics", gameId, normalizeIds(playerIds)] as const,
  competitionPlayerStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionPlayerStatistics", competitionId, normalizeIds(playerIds)] as const,
  competitionTeamStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionTeamStatistics", competitionId, normalizeIds(playerIds)] as const,
  competitionStrategyStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionStrategyStatistics", competitionId, normalizeIds(playerIds)] as const,
  teamPlayerStatistics: (
    teamId: number,
    competitionIds?: number[],
    gameIds?: number[],
    playerIds?: number[]
  ) =>
    [
      "teamPlayerStatistics",
      teamId,
      normalizeIds(competitionIds),
      normalizeIds(gameIds),
      normalizeIds(playerIds),
    ] as const,
  teamTeamStatistics: (
    teamId: number,
    competitionIds?: number[],
    gameIds?: number[],
    playerIds?: number[]
  ) =>
    [
      "teamTeamStatistics",
      teamId,
      normalizeIds(competitionIds),
      normalizeIds(gameIds),
      normalizeIds(playerIds),
    ] as const,
  teamEvolutionStatistics: (
    teamId: number,
    competitionIds?: number[],
    gameIds?: number[],
    playerIds?: number[]
  ) =>
    [
      "teamEvolutionStatistics",
      teamId,
      normalizeIds(competitionIds),
      normalizeIds(gameIds),
      normalizeIds(playerIds),
    ] as const,
  teamStrategyStatistics: (
    teamId: number,
    competitionIds?: number[],
    gameIds?: number[],
    playerIds?: number[]
  ) =>
    [
      "teamStrategyStatistics",
      teamId,
      normalizeIds(competitionIds),
      normalizeIds(gameIds),
      normalizeIds(playerIds),
    ] as const,
  teams: ["teams"] as const,
  publicTeams: ["teams", "public"] as const,
  team: (teamId: number) => ["team", teamId] as const,
  users: ["users"] as const,
  player: (playerId: number) => ["player", playerId] as const,
  teamLines: (teamId: number) => ["lines", "team", teamId] as const,
  lines: ["lines"] as const,
  line: (lineId: number) => ["line", lineId] as const,
  strategies: ["strategies"] as const,
  strategy: (strategyId: number) => ["strategy", strategyId] as const,
  strategiesByCategory: (category: string) => ["strategies", category] as const,
  stoppages: (pointId: number) => ["stoppages", pointId] as const,
  turnovers: (pointId: number) => ["turnovers", pointId] as const,
  availablePlayers: (isOpen: boolean) => ["available-players", isOpen] as const,
};
