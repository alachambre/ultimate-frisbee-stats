import type { PointWithPlayers } from "../../types";

type FieldSideKey = "table_left" | "table_right";

interface FieldSideMetricSnapshot {
  pointsWon: number;
  pointsStarted: number;
  rate: number;
}

interface TurnoverSplitSnapshot {
  ourTurnovers: number;
  opponentTurnovers: number;
}

export interface HistorySummarySnapshot {
  ourScore: number;
  opponentScore: number;
  elapsedSeconds: number | null;
  offenseElapsedSeconds: number;
  defenseElapsedSeconds: number;
  offenseTurnovers: TurnoverSplitSnapshot;
  defenseTurnovers: TurnoverSplitSnapshot;
  holdByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot>;
  breakByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot>;
}

function getPointTimestamp(point: PointWithPlayers): number {
  const reference = point.start_datetime ?? point.end_datetime ?? point.created_at;
  const parsed = new Date(reference).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function createEmptyMetricSnapshot(): FieldSideMetricSnapshot {
  return {
    pointsWon: 0,
    pointsStarted: 0,
    rate: 0,
  };
}

function getPointDurationSeconds(point: PointWithPlayers): number {
  if (typeof point.duration_seconds === "number" && Number.isFinite(point.duration_seconds)) {
    return Math.max(0, Math.floor(point.duration_seconds));
  }

  if (!point.start_datetime || !point.end_datetime) {
    return 0;
  }

  const startMs = new Date(point.start_datetime).getTime();
  const endMs = new Date(point.end_datetime).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - startMs) / 1000));
}

export function buildHistorySummarySnapshot(
  points: PointWithPlayers[],
  snapshotTimestamp: string
): HistorySummarySnapshot {
  const snapshotMs = new Date(snapshotTimestamp).getTime();
  const completedPoints = points.filter(
    (point) => point.status === "completed" && getPointTimestamp(point) <= snapshotMs
  );

  const earliestPointMs =
    completedPoints.length > 0
      ? Math.min(
          ...completedPoints.map((point) =>
            new Date(point.start_datetime ?? point.end_datetime ?? point.created_at).getTime()
          )
        )
      : Number.NaN;

  const holdByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot> = {
    table_left: createEmptyMetricSnapshot(),
    table_right: createEmptyMetricSnapshot(),
  };
  const breakByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot> = {
    table_left: createEmptyMetricSnapshot(),
    table_right: createEmptyMetricSnapshot(),
  };

  let ourScore = 0;
  let opponentScore = 0;
  let offenseElapsedSeconds = 0;
  let defenseElapsedSeconds = 0;
  const offenseTurnovers: TurnoverSplitSnapshot = {
    ourTurnovers: 0,
    opponentTurnovers: 0,
  };
  const defenseTurnovers: TurnoverSplitSnapshot = {
    ourTurnovers: 0,
    opponentTurnovers: 0,
  };

  completedPoints.forEach((point) => {
    if (point.won === true) {
      ourScore += 1;
    } else {
      opponentScore += 1;
    }

    const pointDurationSeconds = getPointDurationSeconds(point);

    const targetTurnovers = point.starting_on_offense ? offenseTurnovers : defenseTurnovers;
    targetTurnovers.ourTurnovers += point.our_turnovers ?? 0;
    targetTurnovers.opponentTurnovers += point.opponent_turnovers ?? 0;

    if (point.starting_on_offense) {
      offenseElapsedSeconds += pointDurationSeconds;
    } else {
      defenseElapsedSeconds += pointDurationSeconds;
    }

    if (!point.field_side) {
      return;
    }

    if (point.starting_on_offense) {
      const metric = holdByFieldSide[point.field_side];
      metric.pointsStarted += 1;
      if (point.won === true) {
        metric.pointsWon += 1;
      }
      metric.rate = metric.pointsStarted > 0 ? metric.pointsWon / metric.pointsStarted : 0;
      return;
    }

    const metric = breakByFieldSide[point.field_side];
    metric.pointsStarted += 1;
    if (point.won === true) {
      metric.pointsWon += 1;
    }
    metric.rate = metric.pointsStarted > 0 ? metric.pointsWon / metric.pointsStarted : 0;
  });

  return {
    ourScore,
    opponentScore,
    elapsedSeconds:
      completedPoints.length > 0 && Number.isFinite(earliestPointMs)
        ? Math.max(0, Math.floor((snapshotMs - earliestPointMs) / 1000))
        : null,
    offenseElapsedSeconds,
    defenseElapsedSeconds,
    offenseTurnovers,
    defenseTurnovers,
    holdByFieldSide,
    breakByFieldSide,
  };
}
