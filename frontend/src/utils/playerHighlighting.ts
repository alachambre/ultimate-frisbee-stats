import type { PlayerGameStats } from "../types";

/**
 * Determines if a player should be highlighted based on their playing time
 * relative to other players. Uses quintiles (20% thresholds) to identify
 * players with the most and least playing time.
 *
 * @param playerStats - The stats for the player to evaluate
 * @param allStats - All player stats for comparison
 * @returns "high" for top 20%, "low" for bottom 20%, or null for middle 60%
 */
export function getPlayerHighlight(
  playerStats: PlayerGameStats,
  allStats: PlayerGameStats[]
): "high" | "low" | null {
  // Need at least 5 players total to create meaningful quintiles
  if (allStats.length < 5) return null;

  // Sort ALL players by time (descending) - includes players with 0 time
  const sortedByTime = [...allStats].sort((a, b) => b.effective_time_seconds - a.effective_time_seconds);

  // Calculate top/bottom 20% (quintiles)
  // With ~20 players, this means ~4 players on each end will be highlighted
  const quintileSize = Math.max(1, Math.floor(sortedByTime.length / 5));

  const topThreshold = sortedByTime[quintileSize - 1]?.effective_time_seconds || 0;
  const bottomThreshold = sortedByTime[sortedByTime.length - quintileSize]?.effective_time_seconds || 0;

  // Highlight top 20% players (most playing time)
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
