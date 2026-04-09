import type { GamePointTimelinePoint } from "../../types";

const DENSE_TIMELINE_POINT_THRESHOLD = 12;

export function prependChartOrigin(values: number[], originValue = 0): number[] {
  return [originValue, ...values];
}

export function getGameTrendsTickStep(pointCount: number): number {
  if (pointCount <= DENSE_TIMELINE_POINT_THRESHOLD) {
    return 1;
  }

  if (pointCount <= 20) {
    return 2;
  }

  if (pointCount <= 32) {
    return 3;
  }

  if (pointCount <= 44) {
    return 4;
  }

  return 5;
}

export interface BreakMarkerFlags {
  ourBreaks: boolean[];
  opponentBreaks: boolean[];
}

export function getBreakMarkerFlags(points: Pick<GamePointTimelinePoint, "starting_on_offense" | "won">[]): BreakMarkerFlags {
  return {
    ourBreaks: [false, ...points.map((point) => !point.starting_on_offense && point.won)],
    opponentBreaks: [false, ...points.map((point) => point.starting_on_offense && !point.won)],
  };
}
