const DENSE_TIMELINE_POINT_THRESHOLD = 12;

export function usesScrollableGameTrendsLayout(pointCount: number): boolean {
  return pointCount > DENSE_TIMELINE_POINT_THRESHOLD;
}

export function getGameTrendsTickStep(pointCount: number): number {
  if (pointCount <= 12) {
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

export function getGameTrendsChartWidth(pointCount: number): number | null {
  if (!usesScrollableGameTrendsLayout(pointCount)) {
    return null;
  }

  return Math.max(560, pointCount * 36);
}

export function shouldShowGameTrendMark(index: number, pointCount: number): boolean {
  if (!usesScrollableGameTrendsLayout(pointCount)) {
    return true;
  }

  const tickStep = getGameTrendsTickStep(pointCount);

  return index === 0 || index === pointCount - 1 || index % tickStep === 0;
}
