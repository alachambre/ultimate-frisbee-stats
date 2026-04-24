import type { Player, PlayerGameStats } from "../types";

export const PLAYER_HIGHLIGHT_TIER_RATIO = 0.2;
export const PLAYER_HIGHLIGHT_MIN_GROUP_SIZE = 5;
export const PLAYER_HIGHLIGHT_MIN_COMPLETED_POINTS = 4;
export const PLAYERS_PER_POINT = 7;

interface PlayerHighlightOptions {
  completedPointsPlayed?: number | null;
}

export function estimateCompletedPointCountFromPlayerStats(
  allStats: PlayerGameStats[]
): number {
  const totalPlayerPointAppearances = allStats.reduce(
    (total, stats) => total + stats.points_played,
    0
  );

  return Math.floor(totalPlayerPointAppearances / PLAYERS_PER_POINT);
}

/**
 * Determines if a player should be highlighted based on their playing time
 * relative to other players. Uses top/bottom percentile buckets to identify
 * players with the most and least playing time.
 *
 * @param playerStats - The stats for the player to evaluate
 * @param allStats - All player stats for comparison
 * @returns "high" for top 20%, "low" for bottom 20%, or null for middle 60%
 */
export function getPlayerHighlight(
  playerStats: PlayerGameStats,
  allStats: PlayerGameStats[],
  options: PlayerHighlightOptions = {}
): "high" | "low" | null {
  if (allStats.length < PLAYER_HIGHLIGHT_MIN_GROUP_SIZE) return null;
  if (
    typeof options.completedPointsPlayed === "number" &&
    options.completedPointsPlayed < PLAYER_HIGHLIGHT_MIN_COMPLETED_POINTS
  ) {
    return null;
  }

  // Sort ALL players by time (descending) - includes players with 0 time
  const sortedByTime = [...allStats].sort((a, b) => b.effective_time_seconds - a.effective_time_seconds);

  const highlightBucketSize = Math.max(
    1,
    Math.floor(sortedByTime.length * PLAYER_HIGHLIGHT_TIER_RATIO)
  );

  const topThreshold = sortedByTime[highlightBucketSize - 1]?.effective_time_seconds || 0;
  const bottomThreshold =
    sortedByTime[sortedByTime.length - highlightBucketSize]?.effective_time_seconds || 0;

  if (topThreshold <= bottomThreshold) {
    return null;
  }

  // Highlight top bucket players (most playing time)
  // Must have actual playing time to be in top tier
  if (
    playerStats.effective_time_seconds > 0 &&
    playerStats.effective_time_seconds >= topThreshold &&
    playerStats.effective_time_seconds > bottomThreshold
  ) {
    return "high";
  }

  // Highlight bottom 20% players (least playing time, including 0)
  if (playerStats.effective_time_seconds <= bottomThreshold) {
    return "low";
  }

  return null;
}

function buildFallbackPlayerStats(player: Player): PlayerGameStats {
  return {
    player_id: player.id,
    player_name: player.name,
    player_number: player.number ?? null,
    points_played: 0,
    effective_time_seconds: 0,
    offense: {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      hold_rate: 0,
      points_won_no_turnover: 0,
      clean_hold_rate: 0,
    },
    defense: {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      break_rate: 0,
      points_with_turnover: 0,
      turnover_rate: 0,
      conversion_rate: 0,
      points_won_no_turnover: 0,
      clean_break_rate: 0,
      clean_conversion_rate: 0,
      points_lost_no_turnover: 0,
    },
  };
}

export function getGenderScopedPlayerHighlight(
  playerId: number,
  players: Player[],
  statsByPlayerId: Map<number, PlayerGameStats>,
  options: PlayerHighlightOptions = {}
): "high" | "low" | null {
  const targetPlayer = players.find((player) => player.id === playerId);
  if (!targetPlayer) {
    return null;
  }

  const genderScopedStats = players
    .filter((player) => player.gender === targetPlayer.gender)
    .map((player) => statsByPlayerId.get(player.id) ?? buildFallbackPlayerStats(player));
  const targetStats =
    statsByPlayerId.get(playerId) ?? buildFallbackPlayerStats(targetPlayer);

  return getPlayerHighlight(targetStats, genderScopedStats, options);
}
