import type { Player, PointWithPlayers } from "../types";

const REQUIRED_PLAYERS_COUNT = 7;

export interface GenderRatio {
  men: number;
  women: number;
}

export interface GenderCounts extends GenderRatio {
  total: number;
}

type PointWithPlayersLike = Pick<PointWithPlayers, "point_number" | "status" | "players">;
type PointPlayersOnly = Pick<PointWithPlayers, "point_number" | "players">;

export function countPlayersByGender(players: Array<Pick<Player, "gender">>): GenderCounts {
  const counts = players.reduce(
    (acc, player) => {
      if (player.gender === "M") {
        acc.men += 1;
      } else if (player.gender === "W") {
        acc.women += 1;
      }
      return acc;
    },
    { men: 0, women: 0 }
  );

  return { ...counts, total: players.length };
}

export function countSelectedPlayersByGender(
  selectedIds: number[],
  players: Array<Pick<Player, "id" | "gender">>
): GenderCounts {
  const genderByPlayerId = new Map(players.map((player) => [player.id, player.gender]));
  const counts = selectedIds.reduce(
    (acc, playerId) => {
      const gender = genderByPlayerId.get(playerId);
      if (gender === "M") {
        acc.men += 1;
      } else if (gender === "W") {
        acc.women += 1;
      }
      return acc;
    },
    { men: 0, women: 0 }
  );

  return { ...counts, total: selectedIds.length };
}

export function isValidMixity({ men, women }: GenderRatio): boolean {
  return (men === 4 && women === 3) || (men === 3 && women === 4);
}

export function matchesRequiredGenderRatio(
  counts: GenderRatio,
  requiredGenderRatio: GenderRatio | null
): boolean {
  if (!requiredGenderRatio) {
    return isValidMixity(counts);
  }
  return counts.men === requiredGenderRatio.men && counts.women === requiredGenderRatio.women;
}

export function hasValidPointSelection(
  selectedIds: number[],
  players: Array<Pick<Player, "id" | "gender">>,
  requiredGenderRatio: GenderRatio | null
): boolean {
  if (selectedIds.length !== REQUIRED_PLAYERS_COUNT) {
    return false;
  }

  const selectedCounts = countSelectedPlayersByGender(selectedIds, players);
  return matchesRequiredGenderRatio(selectedCounts, requiredGenderRatio);
}

export function getCompletedPoints(points: PointWithPlayersLike[]): PointWithPlayersLike[] {
  return points
    .filter((point) => point.status === "completed")
    .sort((a, b) => a.point_number - b.point_number);
}

export function getRequiredGenderRatioForPoint(
  pointNumber: number,
  points: PointWithPlayersLike[]
): GenderRatio | null {
  const completedPoints = getCompletedPoints(points);

  if (completedPoints.length === 0) {
    return null;
  }

  const firstCompletedPoint = completedPoints[0];
  const firstCompletedCounts = countPlayersByGender(firstCompletedPoint.players);
  const patternAIsFourMen = firstCompletedCounts.men === 4;

  // ABBA pattern: A-B-B-A-A-B-B-A...
  const positionInCycle = (pointNumber - 1) % 4;
  const isPatternA = positionInCycle === 0 || positionInCycle === 3;

  if (isPatternA) {
    return patternAIsFourMen ? { men: 4, women: 3 } : { men: 3, women: 4 };
  }

  return patternAIsFourMen ? { men: 3, women: 4 } : { men: 4, women: 3 };
}

export function hasValidPointPlayerComposition(
  point: PointPlayersOnly | null,
  points: PointWithPlayersLike[]
): boolean {
  if (!point || point.players.length !== REQUIRED_PLAYERS_COUNT) {
    return false;
  }

  const counts = countPlayersByGender(point.players);
  const requiredRatio = getRequiredGenderRatioForPoint(point.point_number, points);

  return matchesRequiredGenderRatio(counts, requiredRatio);
}
