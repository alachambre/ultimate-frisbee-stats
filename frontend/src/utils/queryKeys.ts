export const queryKeys = {
  competitions: ["competitions"] as const,
  competition: (competitionId: number) => ["competition", competitionId] as const,
  competitionPlayers: (competitionId: number) =>
    ["competition-players", competitionId] as const,
  competitionGames: (competitionId: number) =>
    ["competition-games", competitionId] as const,
  games: ["games"] as const,
  game: (gameId: number) => ["game", gameId] as const,
  activePoint: (gameId: number) => ["activePoint", gameId] as const,
  liveStats: (gameId: number) => ["liveStats", gameId] as const,
  gameTeamStatistics: (gameId: number) => ["gameTeamStatistics", gameId] as const,
  gameStrategyStatistics: (gameId: number) => ["gameStrategyStatistics", gameId] as const,
  competitionPlayerStatistics: (competitionId: number) =>
    ["competitionPlayerStatistics", competitionId] as const,
  competitionTeamStatistics: (competitionId: number) =>
    ["competitionTeamStatistics", competitionId] as const,
  competitionStrategyStatistics: (competitionId: number) =>
    ["competitionStrategyStatistics", competitionId] as const,
  teamPlayerStatistics: (teamId: number) => ["teamPlayerStatistics", teamId] as const,
  teamTeamStatistics: (teamId: number) => ["teamTeamStatistics", teamId] as const,
  teamStrategyStatistics: (teamId: number) => ["teamStrategyStatistics", teamId] as const,
  teams: ["teams"] as const,
  team: (teamId: number) => ["team", teamId] as const,
  player: (playerId: number) => ["player", playerId] as const,
  teamLines: (teamId: number) => ["lines", "team", teamId] as const,
  lines: ["lines"] as const,
  line: (lineId: number) => ["line", lineId] as const,
  strategies: ["strategies"] as const,
  strategy: (strategyId: number) => ["strategy", strategyId] as const,
  strategiesByCategory: (category: string) => ["strategies", category] as const,
  calls: (pointId: number) => ["calls", pointId] as const,
  turnovers: (pointId: number) => ["turnovers", pointId] as const,
  availablePlayers: (isOpen: boolean) => ["available-players", isOpen] as const,
};
