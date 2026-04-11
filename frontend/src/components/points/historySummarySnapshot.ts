import type {
  PointWithPlayers,
  TurnoverType,
  TurnoverTypeBucket,
  TurnoverTypePhaseStats,
  TurnoverWithPlayer,
} from "../../types";
import { TURNOVER_TYPES, normalizeTurnoverType } from "../../utils/turnoverTypes";

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
  offensePointsPlayed: number;
  defensePointsPlayed: number;
  offenseElapsedSeconds: number;
  defenseElapsedSeconds: number;
  offenseTurnovers: TurnoverSplitSnapshot;
  defenseTurnovers: TurnoverSplitSnapshot;
  offenseTurnoverTypeStats: TurnoverTypePhaseStats;
  defenseTurnoverTypeStats: TurnoverTypePhaseStats;
  holdByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot>;
  breakByFieldSide: Record<FieldSideKey, FieldSideMetricSnapshot>;
}

function getPointTimestamp(point: PointWithPlayers): number {
  const reference = point.start_datetime ?? point.end_datetime ?? point.created_at;
  const parsed = new Date(reference).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTurnoverTimestamp(turnover: TurnoverWithPlayer): number {
  const parsed = new Date(turnover.timestamp).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function createEmptyMetricSnapshot(): FieldSideMetricSnapshot {
  return {
    pointsWon: 0,
    pointsStarted: 0,
    rate: 0,
  };
}

function createEmptyTurnoverTypeBucket(): TurnoverTypeBucket {
  return {
    total_turnovers: 0,
    by_type: Object.fromEntries(
      TURNOVER_TYPES.map((turnoverType) => [turnoverType, { count: 0, percentage: 0 }]),
    ) as Record<TurnoverType, { count: number; percentage: number }>,
  };
}

function createEmptyTurnoverTypePhaseStats(): TurnoverTypePhaseStats {
  return {
    our_possession_turnovers: createEmptyTurnoverTypeBucket(),
    opponent_possession_turnovers: createEmptyTurnoverTypeBucket(),
  };
}

function finalizeTurnoverTypeBucket(bucket: TurnoverTypeBucket): void {
  const total = bucket.total_turnovers;
  TURNOVER_TYPES.forEach((turnoverType) => {
    const stats = bucket.by_type[turnoverType];
    stats.percentage = total > 0 ? stats.count / total : 0;
  });
}

function finalizeTurnoverTypePhaseStats(phaseStats: TurnoverTypePhaseStats): void {
  finalizeTurnoverTypeBucket(phaseStats.our_possession_turnovers);
  finalizeTurnoverTypeBucket(phaseStats.opponent_possession_turnovers);
}

function getTurnoverPossessionBucketKey(
  startingOnOffense: boolean,
  turnoverIndex: number,
): keyof TurnoverTypePhaseStats {
  if (startingOnOffense) {
    return turnoverIndex % 2 === 0
      ? "our_possession_turnovers"
      : "opponent_possession_turnovers";
  }

  return turnoverIndex % 2 === 0
    ? "opponent_possession_turnovers"
    : "our_possession_turnovers";
}

function accumulateTurnoverTypePhaseStats(
  phaseStats: TurnoverTypePhaseStats,
  startingOnOffense: boolean,
  turnovers: TurnoverWithPlayer[],
): void {
  turnovers.forEach((turnover, turnoverIndex) => {
    const bucketKey = getTurnoverPossessionBucketKey(startingOnOffense, turnoverIndex);
    const bucket = phaseStats[bucketKey];
    const normalizedTurnoverType = normalizeTurnoverType(turnover.turnover_type);

    bucket.total_turnovers += 1;
    bucket.by_type[normalizedTurnoverType].count += 1;
  });
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
  snapshotTimestamp: string,
  turnovers: TurnoverWithPlayer[] = [],
): HistorySummarySnapshot {
  const snapshotMs = new Date(snapshotTimestamp).getTime();
  const completedPoints = points.filter(
    (point) => point.status === "completed" && getPointTimestamp(point) <= snapshotMs
  );

  const completedPointIds = new Set(completedPoints.map((point) => point.id));
  const turnoversByPoint = new Map<number, TurnoverWithPlayer[]>();
  turnovers
    .filter(
      (turnover) =>
        completedPointIds.has(turnover.point_id) && getTurnoverTimestamp(turnover) <= snapshotMs,
    )
    .forEach((turnover) => {
      const pointTurnovers = turnoversByPoint.get(turnover.point_id) ?? [];
      pointTurnovers.push(turnover);
      turnoversByPoint.set(turnover.point_id, pointTurnovers);
    });
  turnoversByPoint.forEach((pointTurnovers) => {
    pointTurnovers.sort(
      (left, right) => getTurnoverTimestamp(left) - getTurnoverTimestamp(right),
    );
  });

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
  let offensePointsPlayed = 0;
  let defensePointsPlayed = 0;
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
  const offenseTurnoverTypeStats = createEmptyTurnoverTypePhaseStats();
  const defenseTurnoverTypeStats = createEmptyTurnoverTypePhaseStats();

  completedPoints.forEach((point) => {
    if (point.won === true) {
      ourScore += 1;
    } else {
      opponentScore += 1;
    }

    const pointDurationSeconds = getPointDurationSeconds(point);
    const pointTurnovers = turnoversByPoint.get(point.id) ?? [];

    const targetTurnovers = point.starting_on_offense ? offenseTurnovers : defenseTurnovers;
    targetTurnovers.ourTurnovers += point.our_turnovers ?? 0;
    targetTurnovers.opponentTurnovers += point.opponent_turnovers ?? 0;

    if (point.starting_on_offense) {
      offensePointsPlayed += 1;
      offenseElapsedSeconds += pointDurationSeconds;
      accumulateTurnoverTypePhaseStats(
        offenseTurnoverTypeStats,
        point.starting_on_offense,
        pointTurnovers,
      );
    } else {
      defensePointsPlayed += 1;
      defenseElapsedSeconds += pointDurationSeconds;
      accumulateTurnoverTypePhaseStats(
        defenseTurnoverTypeStats,
        point.starting_on_offense,
        pointTurnovers,
      );
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

  finalizeTurnoverTypePhaseStats(offenseTurnoverTypeStats);
  finalizeTurnoverTypePhaseStats(defenseTurnoverTypeStats);

  return {
    ourScore,
    opponentScore,
    elapsedSeconds:
      completedPoints.length > 0 && Number.isFinite(earliestPointMs)
        ? Math.max(0, Math.floor((snapshotMs - earliestPointMs) / 1000))
        : null,
    offensePointsPlayed,
    defensePointsPlayed,
    offenseElapsedSeconds,
    defenseElapsedSeconds,
    offenseTurnovers,
    defenseTurnovers,
    offenseTurnoverTypeStats,
    defenseTurnoverTypeStats,
    holdByFieldSide,
    breakByFieldSide,
  };
}
