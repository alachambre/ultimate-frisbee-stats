import { useMemo } from "react";
import type { GameDetail, PointWithPlayers, Stoppage } from "../../../types";
import {
  countPlayersByGender,
  hasValidPointPlayerComposition,
  isValidMixity,
  type GenderRatio,
} from "../../../utils/playerComposition";

interface UseLivePointStateParams {
  game: GameDetail;
  activePoint: PointWithPlayers | null;
  stoppages: Stoppage[];
}

export function useLivePointState({
  game,
  activePoint,
  stoppages,
}: UseLivePointStateParams) {
  const scoredPoint = useMemo(() => {
    return game.points
      .filter((point) => point.status === "scored")
      .sort((a, b) => b.point_number - a.point_number)[0];
  }, [game.points]);

  const currentPoint = activePoint || scoredPoint;
  const hasPendingStoppage = stoppages.some((stoppage) => stoppage.resume_timestamp === null);
  const pendingStoppage = stoppages.find((stoppage) => stoppage.resume_timestamp === null);

  const hasValidPlayerComposition = useMemo(
    () => hasValidPointPlayerComposition(currentPoint, game.points),
    [currentPoint, game.points]
  );
  const expectedGenderRatio = useMemo<GenderRatio | null>(() => {
    const targetPointNumber = currentPoint?.point_number
      ?? (game.points.reduce((maxPointNumber, point) => Math.max(maxPointNumber, point.point_number), 0) + 1);

    if (targetPointNumber <= 1) {
      return null;
    }

    const previousPoint = [...game.points]
      .filter((point) => point.point_number < targetPointNumber)
      .sort((a, b) => b.point_number - a.point_number)[0];

    if (!previousPoint) {
      return null;
    }

    const previousCounts = countPlayersByGender(previousPoint.players);
    if (!isValidMixity(previousCounts)) {
      return null;
    }

    if (targetPointNumber % 2 === 1) {
      return { men: previousCounts.men, women: previousCounts.women };
    }

    return { men: previousCounts.women, women: previousCounts.men };
  }, [currentPoint?.point_number, game.points]);

  return {
    scoredPoint,
    currentPoint,
    hasPendingStoppage,
    pendingStoppage,
    hasValidPlayerComposition,
    expectedGenderRatio,
  };
}
