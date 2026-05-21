import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  invalidateGameAfterPointMutation,
  invalidateGameLiveState,
  invalidateGameStatistics,
  invalidateQueryKeys,
} from "../queryInvalidation";
import { queryKeys } from "../queryKeys";

function createQueryClient() {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  } as unknown as Pick<QueryClient, "invalidateQueries">;
}

describe("queryInvalidation", () => {
  it("invalidates explicit keys and preserves exact matching", async () => {
    const queryClient = createQueryClient();
    const keys: QueryKey[] = [queryKeys.teams, queryKeys.games];

    await invalidateQueryKeys(queryClient, keys, { exact: true });

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2);
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.teams,
      exact: true,
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: queryKeys.games,
      exact: true,
    });
  });

  it("invalidates the live game state queries together", async () => {
    const queryClient = createQueryClient();

    await invalidateGameLiveState(queryClient, 7);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(3);
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: queryKeys.game(7),
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: queryKeys.activePoint(7),
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: queryKeys.gameLiveState(7),
    });
  });

  it("invalidates all filtered game statistics variants by query family", async () => {
    const queryClient = createQueryClient();

    await invalidateGameStatistics(queryClient, 9);

    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(4);
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: ["liveStats", 9],
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(2, {
      queryKey: ["gameTeamStatistics", 9],
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(3, {
      queryKey: ["gameStrategyStatistics", 9],
    });
    expect(queryClient.invalidateQueries).toHaveBeenNthCalledWith(4, {
      queryKey: ["gamePointTimeline", 9],
    });
  });

  it("invalidates game history and statistics after point mutations", async () => {
    const queryClient = createQueryClient();

    await invalidateGameAfterPointMutation(queryClient, 11);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.game(11),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.gameTurnovers(11),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.activePoint(11),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.gameLiveState(11),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["liveStats", 11],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["gameTeamStatistics", 11],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["gameStrategyStatistics", 11],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["gamePointTimeline", 11],
    });
  });
});
