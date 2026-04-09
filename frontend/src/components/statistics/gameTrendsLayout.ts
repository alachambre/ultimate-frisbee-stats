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
