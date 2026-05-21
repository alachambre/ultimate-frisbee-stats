import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { queryKeys } from "./queryKeys";

export type QueryInvalidationClient = Pick<QueryClient, "invalidateQueries">;

interface InvalidateQueryKeysOptions {
  exact?: boolean;
}

function invalidationFilters(
  queryKey: QueryKey,
  options?: InvalidateQueryKeysOptions
) {
  if (options?.exact === undefined) {
    return { queryKey };
  }

  return { queryKey, exact: options.exact };
}

export async function invalidateQueryKeys(
  queryClient: QueryInvalidationClient,
  keys: readonly QueryKey[],
  options?: InvalidateQueryKeysOptions
): Promise<void> {
  await Promise.all(
    keys.map((queryKey) =>
      queryClient.invalidateQueries(invalidationFilters(queryKey, options))
    )
  );
}

function gameStatisticsQueryFamilies(gameId: number): QueryKey[] {
  return [
    ["liveStats", gameId],
    ["gameTeamStatistics", gameId],
    ["gameStrategyStatistics", gameId],
    ["gamePointTimeline", gameId],
  ];
}

export async function invalidateGameLiveState(
  queryClient: QueryInvalidationClient,
  gameId: number
): Promise<void> {
  await invalidateQueryKeys(queryClient, [
    queryKeys.game(gameId),
    queryKeys.activePoint(gameId),
    queryKeys.gameLiveState(gameId),
  ]);
}

export async function invalidateGameHistory(
  queryClient: QueryInvalidationClient,
  gameId: number
): Promise<void> {
  await invalidateQueryKeys(queryClient, [
    queryKeys.game(gameId),
    queryKeys.gameTurnovers(gameId),
    queryKeys.activePoint(gameId),
    queryKeys.gameLiveState(gameId),
  ]);
}

export async function invalidateGameStatistics(
  queryClient: QueryInvalidationClient,
  gameId: number
): Promise<void> {
  await invalidateQueryKeys(queryClient, gameStatisticsQueryFamilies(gameId));
}

export async function invalidateGameAfterPointMutation(
  queryClient: QueryInvalidationClient,
  gameId: number
): Promise<void> {
  await invalidateQueryKeys(queryClient, [
    queryKeys.game(gameId),
    queryKeys.gameTurnovers(gameId),
    queryKeys.activePoint(gameId),
    queryKeys.gameLiveState(gameId),
    ...gameStatisticsQueryFamilies(gameId),
  ]);
}
