import { describe, it, expect } from "vitest";
import {
  PLAYER_HIGHLIGHT_MIN_COMPLETED_POINTS,
  PLAYER_HIGHLIGHT_TIER_RATIO,
  estimateCompletedPointCountFromPlayerStats,
  getGenderScopedPlayerHighlight,
  getPlayerHighlight,
} from "../playerHighlighting";
import type { Player, PlayerGameStats } from "../../types";

describe("getPlayerHighlight", () => {
  // Helper to create mock player stats
  const createPlayerStats = (
    playerId: number,
    effectiveTime: number,
    pointsPlayed = Math.floor(effectiveTime / 300)
  ): PlayerGameStats => ({
    player_id: playerId,
    player_name: `Player ${playerId}`,
    player_number: playerId, // Just use playerId as the number
    points_played: pointsPlayed,
    effective_time_seconds: effectiveTime,
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
  });

  const createPlayer = (playerId: number, gender: "M" | "W"): Player => ({
    id: playerId,
    name: `Player ${playerId}`,
    number: playerId,
    gender,
    team_id: 1,
    created_at: "2024-01-01",
  });

  it("uses a 20% highlight tier ratio", () => {
    expect(PLAYER_HIGHLIGHT_TIER_RATIO).toBe(0.2);
  });

  it("requires at least 4 completed points when point count is provided", () => {
    expect(PLAYER_HIGHLIGHT_MIN_COMPLETED_POINTS).toBe(4);
  });

  describe("Edge Cases", () => {
    it("returns null when fewer than 5 players", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 400),
        createPlayerStats(3, 200),
        createPlayerStats(4, 100),
      ];

      expect(getPlayerHighlight(stats[0], stats)).toBeNull();
      expect(getPlayerHighlight(stats[1], stats)).toBeNull();
      expect(getPlayerHighlight(stats[2], stats)).toBeNull();
      expect(getPlayerHighlight(stats[3], stats)).toBeNull();
    });

    it("evaluates player against provided stats even if not in array", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 200),
      ];
      const outsidePlayer = createPlayerStats(999, 450);

      // The function evaluates against the thresholds from stats array
      // With quintileSize=1, top=600, bottom=200
      // Player with 450 doesn't meet either threshold
      const result = getPlayerHighlight(outsidePlayer, stats);
      expect(result).toBeNull();
    });

    it("returns null before enough completed points have been played", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 100),
      ];

      expect(getPlayerHighlight(stats[0], stats, { completedPointsPlayed: 3 })).toBeNull();
      expect(getPlayerHighlight(stats[4], stats, { completedPointsPlayed: 3 })).toBeNull();
    });

    it("allows highlighting once the fourth completed point has been played", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 100),
      ];

      expect(getPlayerHighlight(stats[0], stats, { completedPointsPlayed: 4 })).toBe("high");
      expect(getPlayerHighlight(stats[4], stats, { completedPointsPlayed: 4 })).toBe("low");
    });
  });

  describe("Quintile Calculation with 5 Players", () => {
    // With 5 players, quintile size = floor(5/5) = 1
    // So top 1 and bottom 1 should be highlighted
    const stats = [
      createPlayerStats(1, 600), // Top 20%
      createPlayerStats(2, 500), // Middle 60%
      createPlayerStats(3, 400), // Middle 60%
      createPlayerStats(4, 300), // Middle 60%
      createPlayerStats(5, 100), // Bottom 20%
    ];

    it("highlights player with most playing time as high", () => {
      expect(getPlayerHighlight(stats[0], stats)).toBe("high");
    });

    it("does not highlight middle players", () => {
      expect(getPlayerHighlight(stats[1], stats)).toBeNull();
      expect(getPlayerHighlight(stats[2], stats)).toBeNull();
      expect(getPlayerHighlight(stats[3], stats)).toBeNull();
    });

    it("highlights player with least playing time as low", () => {
      expect(getPlayerHighlight(stats[4], stats)).toBe("low");
    });
  });

  describe("Quintile Calculation with 10 Players", () => {
    // With 10 players, quintile size = floor(10/5) = 2
    // So top 2 and bottom 2 should be highlighted
    const stats = [
      createPlayerStats(1, 1000), // Top 20%
      createPlayerStats(2, 900),  // Top 20%
      createPlayerStats(3, 800),  // Middle 60%
      createPlayerStats(4, 700),  // Middle 60%
      createPlayerStats(5, 600),  // Middle 60%
      createPlayerStats(6, 500),  // Middle 60%
      createPlayerStats(7, 400),  // Middle 60%
      createPlayerStats(8, 300),  // Middle 60%
      createPlayerStats(9, 200),  // Bottom 20%
      createPlayerStats(10, 100), // Bottom 20%
    ];

    it("highlights top 2 players as high", () => {
      expect(getPlayerHighlight(stats[0], stats)).toBe("high");
      expect(getPlayerHighlight(stats[1], stats)).toBe("high");
    });

    it("does not highlight middle 6 players", () => {
      expect(getPlayerHighlight(stats[2], stats)).toBeNull();
      expect(getPlayerHighlight(stats[3], stats)).toBeNull();
      expect(getPlayerHighlight(stats[4], stats)).toBeNull();
      expect(getPlayerHighlight(stats[5], stats)).toBeNull();
      expect(getPlayerHighlight(stats[6], stats)).toBeNull();
      expect(getPlayerHighlight(stats[7], stats)).toBeNull();
    });

    it("highlights bottom 2 players as low", () => {
      expect(getPlayerHighlight(stats[8], stats)).toBe("low");
      expect(getPlayerHighlight(stats[9], stats)).toBe("low");
    });
  });

  describe("Players with Zero Playing Time", () => {
    it("highlights players with 0 time as low when they are in bottom 20%", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 0), // Should be bottom 20%
      ];

      expect(getPlayerHighlight(stats[4], stats)).toBe("low");
    });

    it("does not highlight players when everyone has 0 time", () => {
      const stats = [
        createPlayerStats(1, 0),
        createPlayerStats(2, 0),
        createPlayerStats(3, 0),
        createPlayerStats(4, 0),
        createPlayerStats(5, 0),
      ];

      expect(getPlayerHighlight(stats[0], stats)).toBeNull();
      expect(getPlayerHighlight(stats[1], stats)).toBeNull();
      expect(getPlayerHighlight(stats[2], stats)).toBeNull();
      expect(getPlayerHighlight(stats[3], stats)).toBeNull();
      expect(getPlayerHighlight(stats[4], stats)).toBeNull();
    });
  });

  describe("Players with Equal Playing Time", () => {
    it("handles equal times in top tier correctly", () => {
      const stats = [
        createPlayerStats(1, 600), // Top (tied)
        createPlayerStats(2, 600), // Top (tied)
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 100),
      ];

      // Both players with 600 should be in top 20%
      expect(getPlayerHighlight(stats[0], stats)).toBe("high");
      expect(getPlayerHighlight(stats[1], stats)).toBe("high");
    });

    it("handles equal times in bottom tier correctly", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 100), // Bottom (tied)
        createPlayerStats(5, 100), // Bottom (tied)
      ];

      // Both players with 100 should be in bottom 20%
      expect(getPlayerHighlight(stats[3], stats)).toBe("low");
      expect(getPlayerHighlight(stats[4], stats)).toBe("low");
    });

    it("handles all players with equal time", () => {
      const stats = [
        createPlayerStats(1, 500),
        createPlayerStats(2, 500),
        createPlayerStats(3, 500),
        createPlayerStats(4, 500),
        createPlayerStats(5, 500),
      ];

      stats.forEach(stat => {
        expect(getPlayerHighlight(stat, stats)).toBeNull();
      });
    });
  });

  describe("Completed point count estimation", () => {
    it("estimates completed points from total player appearances", () => {
      const stats = [
        createPlayerStats(1, 600, 4),
        createPlayerStats(2, 500, 4),
        createPlayerStats(3, 400, 4),
        createPlayerStats(4, 300, 4),
        createPlayerStats(5, 200, 4),
        createPlayerStats(6, 100, 4),
        createPlayerStats(7, 50, 4),
      ];

      expect(estimateCompletedPointCountFromPlayerStats(stats)).toBe(4);
    });

    it("rounds down partial appearance totals", () => {
      const stats = [
        createPlayerStats(1, 600, 1),
        createPlayerStats(2, 500, 1),
        createPlayerStats(3, 400, 1),
        createPlayerStats(4, 300, 1),
        createPlayerStats(5, 200, 1),
        createPlayerStats(6, 100, 1),
      ];

      expect(estimateCompletedPointCountFromPlayerStats(stats)).toBe(0);
    });
  });

  describe("Large Player Set (20 Players)", () => {
    // With 20 players, quintile size = floor(20/5) = 4
    // So top 4 and bottom 4 should be highlighted
    const stats = Array.from({ length: 20 }, (_, i) =>
      createPlayerStats(i + 1, (20 - i) * 100)
    );

    it("highlights top 4 players as high", () => {
      expect(getPlayerHighlight(stats[0], stats)).toBe("high");
      expect(getPlayerHighlight(stats[1], stats)).toBe("high");
      expect(getPlayerHighlight(stats[2], stats)).toBe("high");
      expect(getPlayerHighlight(stats[3], stats)).toBe("high");
    });

    it("does not highlight middle 12 players", () => {
      for (let i = 4; i < 16; i++) {
        expect(getPlayerHighlight(stats[i], stats)).toBeNull();
      }
    });

    it("highlights bottom 4 players as low", () => {
      expect(getPlayerHighlight(stats[16], stats)).toBe("low");
      expect(getPlayerHighlight(stats[17], stats)).toBe("low");
      expect(getPlayerHighlight(stats[18], stats)).toBe("low");
      expect(getPlayerHighlight(stats[19], stats)).toBe("low");
    });
  });

  describe("Boundary Conditions", () => {
    it("correctly identifies player at top quintile boundary", () => {
      // With 5 players, quintileSize=1, so topThreshold is the highest time (600)
      const stats = [
        createPlayerStats(1, 600), // This is at the top threshold
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 200),
      ];

      // Player at top threshold (600) should be "high"
      // Must be >= topThreshold (600) AND > bottomThreshold (200)
      expect(getPlayerHighlight(stats[0], stats)).toBe("high");
    });

    it("correctly identifies player at bottom quintile boundary", () => {
      // With 5 players, quintileSize=1, so bottomThreshold is the lowest time (200)
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 300),
        createPlayerStats(5, 200), // This is at the bottom threshold
      ];

      // Player at bottom threshold (200) should be "low"
      // Must be <= bottomThreshold (200)
      expect(getPlayerHighlight(stats[4], stats)).toBe("low");
    });

    it("correctly handles player just above bottom threshold", () => {
      const stats = [
        createPlayerStats(1, 600),
        createPlayerStats(2, 500),
        createPlayerStats(3, 400),
        createPlayerStats(4, 201), // Just above bottom threshold (200)
        createPlayerStats(5, 200),
      ];

      // Player with 201 is > bottomThreshold, so not "low"
      // But not >= topThreshold (600), so not "high"
      expect(getPlayerHighlight(stats[3], stats)).toBeNull();
    });
  });

  describe("Gender-scoped highlighting", () => {
    it("compares players only against teammates of the same gender", () => {
      const players: Player[] = [
        createPlayer(1, "M"),
        createPlayer(2, "M"),
        createPlayer(3, "M"),
        createPlayer(4, "M"),
        createPlayer(5, "M"),
        createPlayer(6, "W"),
        createPlayer(7, "W"),
        createPlayer(8, "W"),
        createPlayer(9, "W"),
        createPlayer(10, "W"),
      ];
      const statsByPlayerId = new Map<number, PlayerGameStats>([
        [1, createPlayerStats(1, 1000)],
        [2, createPlayerStats(2, 900)],
        [3, createPlayerStats(3, 800)],
        [4, createPlayerStats(4, 700)],
        [5, createPlayerStats(5, 600)],
        [6, createPlayerStats(6, 400)],
        [7, createPlayerStats(7, 350)],
        [8, createPlayerStats(8, 300)],
        [9, createPlayerStats(9, 250)],
        [10, createPlayerStats(10, 200)],
      ]);

      expect(getGenderScopedPlayerHighlight(1, players, statsByPlayerId)).toBe("high");
      expect(getGenderScopedPlayerHighlight(6, players, statsByPlayerId)).toBe("high");
      expect(getGenderScopedPlayerHighlight(5, players, statsByPlayerId)).toBe("low");
      expect(getGenderScopedPlayerHighlight(10, players, statsByPlayerId)).toBe("low");
    });

    it("treats missing stats as zero-time players inside the same gender group", () => {
      const players: Player[] = [
        createPlayer(1, "W"),
        createPlayer(2, "W"),
        createPlayer(3, "W"),
        createPlayer(4, "W"),
        createPlayer(5, "W"),
      ];
      const statsByPlayerId = new Map<number, PlayerGameStats>([
        [1, createPlayerStats(1, 500)],
        [2, createPlayerStats(2, 400)],
        [3, createPlayerStats(3, 300)],
        [4, createPlayerStats(4, 200)],
      ]);

      expect(getGenderScopedPlayerHighlight(5, players, statsByPlayerId)).toBe("low");
    });
  });
});
