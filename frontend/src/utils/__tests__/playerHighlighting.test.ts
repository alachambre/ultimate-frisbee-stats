import { describe, it, expect } from "vitest";
import { getPlayerHighlight } from "../playerHighlighting";
import type { PlayerGameStats } from "../../types";

describe("getPlayerHighlight", () => {
  // Helper to create mock player stats
  const createPlayerStats = (playerId: number, effectiveTime: number): PlayerGameStats => ({
    player_id: playerId,
    player_name: `Player ${playerId}`,
    player_number: playerId, // Just use playerId as the number
    points_played: Math.floor(effectiveTime / 300), // Rough estimate
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
      points_won_no_turnover: 0,
      clean_break_rate: 0,
      points_lost_no_turnover: 0,
    },
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

    it("does not highlight player with 0 time as high even if in top quintile", () => {
      const stats = [
        createPlayerStats(1, 0), // Has 0 time, so can't be "high"
        createPlayerStats(2, 0),
        createPlayerStats(3, 0),
        createPlayerStats(4, 0),
        createPlayerStats(5, 0),
      ];

      // All have 0 time, none should be highlighted as "high"
      expect(getPlayerHighlight(stats[0], stats)).toBe("low");
      expect(getPlayerHighlight(stats[1], stats)).toBe("low");
      expect(getPlayerHighlight(stats[2], stats)).toBe("low");
      expect(getPlayerHighlight(stats[3], stats)).toBe("low");
      expect(getPlayerHighlight(stats[4], stats)).toBe("low");
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

      // When all equal, topThreshold and bottomThreshold are the same
      // Players can't be both > bottomThreshold and >= topThreshold with strict conditions
      // Actually, let me check the logic: effective_time_seconds > bottomThreshold would fail
      // So they'd all be considered "low" (<=bottomThreshold)
      stats.forEach(stat => {
        expect(getPlayerHighlight(stat, stats)).toBe("low");
      });
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
});
