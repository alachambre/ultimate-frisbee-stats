function normalizePlayerIds(playerIds?: number[]): string {
  if (!playerIds || playerIds.length === 0) {
    return "all";
  }

  return Array.from(new Set(playerIds))
    .sort((a, b) => a - b)
    .join(",");
}

export const queryKeys = {
  competitions: ["competitions"] as const,
  competition: (competitionId: number) => ["competition", competitionId] as const,
  competitionPlayers: (competitionId: number) =>
    ["competition-players", competitionId] as const,
  competitionGames: (competitionId: number) =>
    ["competition-games", competitionId] as const,
  games: ["games"] as const,
  game: (gameId: number) => ["game", gameId] as const,
  halftime: (gameId: number) => ["halftime", gameId] as const,
  activePoint: (gameId: number) => ["activePoint", gameId] as const,
  liveStats: (gameId: number, playerIds?: number[]) =>
    ["liveStats", gameId, normalizePlayerIds(playerIds)] as const,
  gameTeamStatistics: (gameId: number, playerIds?: number[]) =>
    ["gameTeamStatistics", gameId, normalizePlayerIds(playerIds)] as const,
  gameStrategyStatistics: (gameId: number, playerIds?: number[]) =>
    ["gameStrategyStatistics", gameId, normalizePlayerIds(playerIds)] as const,
  competitionPlayerStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionPlayerStatistics", competitionId, normalizePlayerIds(playerIds)] as const,
  competitionTeamStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionTeamStatistics", competitionId, normalizePlayerIds(playerIds)] as const,
  competitionStrategyStatistics: (competitionId: number, playerIds?: number[]) =>
    ["competitionStrategyStatistics", competitionId, normalizePlayerIds(playerIds)] as const,
  teamPlayerStatistics: (teamId: number, playerIds?: number[]) =>
    ["teamPlayerStatistics", teamId, normalizePlayerIds(playerIds)] as const,
  teamTeamStatistics: (teamId: number, playerIds?: number[]) =>
    ["teamTeamStatistics", teamId, normalizePlayerIds(playerIds)] as const,
  teamStrategyStatistics: (teamId: number, playerIds?: number[]) =>
    ["teamStrategyStatistics", teamId, normalizePlayerIds(playerIds)] as const,
  teams: ["teams"] as const,
  team: (teamId: number) => ["team", teamId] as const,
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
