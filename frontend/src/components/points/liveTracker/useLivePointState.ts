import { useMemo } from "react";
import type { GameDetail, PointWithPlayers, Stoppage } from "../../../types";
import { hasValidPointPlayerComposition } from "../../../utils/playerComposition";

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

  return {
    scoredPoint,
    currentPoint,
    hasPendingStoppage,
    pendingStoppage,
    hasValidPlayerComposition,
  };
}
