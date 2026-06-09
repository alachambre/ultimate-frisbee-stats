import type { GamePointTimeline, Halftime, PointWithPlayers } from "../types";

function getPointTimestamp(point: PointWithPlayers): number {
  const reference = point.end_datetime ?? point.start_datetime ?? point.created_at;
  const parsed = new Date(reference).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPointDurationSeconds(point: PointWithPlayers): number {
  if (typeof point.duration_seconds === "number") {
    return point.duration_seconds;
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

export function buildGamePointTimelineFromPoints(
  gameId: number,
  points: PointWithPlayers[],
  halftime?: Halftime | null
): GamePointTimeline {
  const completedPoints = points
    .filter((point) => point.status === "completed")
    .slice()
    .sort(
      (left, right) =>
        left.point_number - right.point_number || getPointTimestamp(left) - getPointTimestamp(right)
    );

  let ourScore = 0;
  let opponentScore = 0;
  const halftimeTimestamp = halftime ? new Date(halftime.halftime_timestamp).getTime() : null;
  const pointsBeforeHalftime =
    halftimeTimestamp == null
      ? []
      : completedPoints.filter((point) => getPointTimestamp(point) <= halftimeTimestamp);

  return {
    game_id: gameId,
    halftime_after_point_number:
      pointsBeforeHalftime.length > 0
        ? pointsBeforeHalftime[pointsBeforeHalftime.length - 1].point_number
        : null,
    key_moments: [],
    points: completedPoints.map((point) => {
      if (point.won) {
        ourScore += 1;
      } else {
        opponentScore += 1;
      }

      return {
        point_id: point.id,
        point_number: point.point_number,
        starting_on_offense: point.starting_on_offense,
        won: Boolean(point.won),
        field_side: point.field_side ?? null,
        duration_seconds: getPointDurationSeconds(point),
        our_turnovers: point.our_turnovers ?? 0,
        opponent_turnovers: point.opponent_turnovers ?? 0,
        our_score_after: ourScore,
        opponent_score_after: opponentScore,
        markers: [],
      };
    }),
  };
}
