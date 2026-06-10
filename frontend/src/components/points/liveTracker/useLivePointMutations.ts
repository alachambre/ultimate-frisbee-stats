import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createHalftime } from "../../../services/halftimes";
import { deletePoint, updatePoint } from "../../../services/points";
import type { PointWithPlayers } from "../../../types";
import {
  invalidateGameAfterPointMutation,
  invalidateGameLiveState,
} from "../../../utils/queryInvalidation";
import { queryKeys } from "../../../utils/queryKeys";

interface UseLivePointMutationsParams {
  gameId: number;
  activePoint: PointWithPlayers | null;
  currentPoint?: PointWithPlayers | null;
  scoredPoint?: PointWithPlayers;
  onPointUpdated?: () => void;
  onHalftimeCreated?: () => void;
}

export function useLivePointMutations({
  gameId,
  activePoint,
  currentPoint,
  scoredPoint,
  onPointUpdated,
  onHalftimeCreated,
}: UseLivePointMutationsParams) {
  const queryClient = useQueryClient();

  const updatePullMutation = useMutation({
    mutationFn: (pull: boolean) => {
      if (!activePoint) throw new Error("No active point");
      return updatePoint(activePoint.id, { pull });
    },
    onSuccess: async () => {
      await invalidateGameAfterPointMutation(queryClient, gameId);
      onPointUpdated?.();
    },
  });

  const launchPullMutation = useMutation({
    mutationFn: () => {
      if (!activePoint) throw new Error("No active point");
      return updatePoint(activePoint.id, { status: "running" });
    },
    onSuccess: async () => {
      await invalidateGameLiveState(queryClient, gameId);
      onPointUpdated?.();
    },
  });

  const restartPointMutation = useMutation({
    mutationFn: () => {
      if (!scoredPoint) throw new Error("No scored point");
      return updatePoint(scoredPoint.id, {
        status: "running",
        won: null,
        end_datetime: null,
      });
    },
    onSuccess: async (updatedPoint) => {
      queryClient.setQueryData(queryKeys.activePoint(gameId), updatedPoint);
      queryClient.setQueryData(queryKeys.game(gameId), (oldData: unknown) => {
        if (!oldData || typeof oldData !== "object") return oldData;
        const gameData = oldData as { points: PointWithPlayers[] };
        return {
          ...gameData,
          points: gameData.points.map((point) =>
            point.id === updatedPoint.id ? updatedPoint : point
          ),
        };
      });

      await invalidateGameAfterPointMutation(queryClient, gameId);
      onPointUpdated?.();
    },
  });

  const createHalftimeMutation = useMutation({
    mutationFn: () =>
      createHalftime({
        game_id: gameId,
        halftime_timestamp: new Date().toISOString(),
      }),
    onSuccess: async () => {
      onHalftimeCreated?.();
      await invalidateGameAfterPointMutation(queryClient, gameId);
      onPointUpdated?.();
    },
  });

  const deleteCurrentPointMutation = useMutation({
    mutationFn: () => {
      if (!currentPoint) throw new Error("No current point");
      return deletePoint(currentPoint.id);
    },
    onSuccess: async () => {
      await invalidateGameAfterPointMutation(queryClient, gameId);
      onPointUpdated?.();
    },
  });

  return {
    updatePullMutation,
    launchPullMutation,
    restartPointMutation,
    createHalftimeMutation,
    deleteCurrentPointMutation,
  };
}
