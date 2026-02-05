export const queryKeys = {
  competitions: ["competitions"] as const,
  competition: (competitionId: number) => ["competition", competitionId] as const,
  competitionGames: (competitionId: number) =>
    ["competition-games", competitionId] as const,
  games: ["games"] as const,
};
