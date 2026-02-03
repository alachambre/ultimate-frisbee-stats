import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportGameStatisticsToCSV } from "../csvExport";
import type { GameDetail, GameTeamStats, PlayerGameStats, GameStrategyStats } from "../../types";
import { server } from "../../test/setup";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8000";

describe("exportGameStatisticsToCSV", () => {
  beforeEach(() => {
    // Mock API responses for calls and turnovers
    server.use(
      http.get(`${BASE_URL}/calls/points/:pointId/calls`, () => {
        return HttpResponse.json([]);
      }),
      http.get(`${BASE_URL}/turnovers/points/:pointId/turnovers`, () => {
        return HttpResponse.json([]);
      })
    );
  });

  it("exports game data to CSV with all sections", async () => {
    // Mock game data
    const game: GameDetail = {
      id: 1,
      competition_id: 1,
      competition_name: "Test Competition",
      team_name: "Test Team",
      opponent_name: "Rival Team",
      our_score: 2,
      opponent_score: 1,
      status: "started",
      start_datetime: "2024-01-15T10:00:00Z",
      end_datetime: null,
      date: "2024-01-15",
      points: [
        {
          id: 1,
          game_id: 1,
          point_number: 1,
          starting_on_offense: true,
          won: true,
          status: "completed",
          field_side: "home",
          pull: true,
          start_datetime: "2024-01-15T10:05:00Z",
          end_datetime: "2024-01-15T10:08:00Z",
          duration_seconds: 180,
          comments: "Great point",
          created_at: "2024-01-15T10:00:00Z",
          strategy_id: 1,
          players: [
            { id: 1, team_id: 1, name: "John Doe", number: 10, gender: "M", created_at: "2024-01-01T00:00:00Z" },
            { id: 2, team_id: 1, name: "Jane Smith", number: 7, gender: "W", created_at: "2024-01-01T00:00:00Z" },
          ],
          strategy: { id: 1, name: "Ho Stack", category: "offense", description: null, created_at: "2024-01-01T00:00:00Z" },
        },
      ],
      players: [],
      created_at: "2024-01-15T09:00:00Z",
    };

    const teamStats: GameTeamStats = {
      game_id: 1,
      total_completed_points: 2,
      offense: {
        points_started: 1,
        points_won: 1,
        points_lost: 0,
        hold_rate: 1.0,
        points_won_no_turnover: 1,
        clean_hold_rate: 1.0,
        broken_rate: 0.0,
      },
      defense: {
        points_started: 1,
        points_won: 1,
        points_lost: 0,
        break_rate: 1.0,
        points_with_turnover: 1,
        turnover_rate: 1.0,
        points_won_no_turnover: 0,
        clean_break_rate: 0.0,
        points_lost_no_turnover: 0,
        hold_rate: 0.0,
        pull_stats: {
          total_pulls: 1,
          inbound_pulls: 1,
          out_of_bounds_pulls: 0,
          inbound_rate: 1.0,
        },
      },
    };

    const playerStats: PlayerGameStats[] = [
      {
        player_id: 1,
        player_name: "John Doe",
        player_number: 10,
        points_played: 2,
        effective_time_seconds: 360,
        offense: {
          points_played: 1,
          points_won: 1,
          points_lost: 0,
          hold_rate: 1.0,
          points_won_no_turnover: 1,
          clean_hold_rate: 1.0,
        },
        defense: {
          points_played: 1,
          points_won: 1,
          points_lost: 0,
          break_rate: 1.0,
          points_with_turnover: 1,
          turnover_rate: 1.0,
          points_won_no_turnover: 0,
          clean_break_rate: 0.0,
          points_lost_no_turnover: 0,
        },
      },
    ];

    const strategyStats: GameStrategyStats = {
      game_id: 1,
      offense_strategies: [
        {
          strategy_id: 1,
          strategy_name: "Ho Stack",
          points_played: 5,
          points_won: 4,
          points_lost: 1,
          hold_rate: 0.8,
          clean_holds: 3,
          clean_hold_rate: 0.75,
          quick_scores: 2,
          quick_score_rate: 0.5,
        },
      ],
      defense_strategies: [
        {
          strategy_id: 2,
          strategy_name: "Zone",
          points_played: 3,
          points_won: 2,
          points_lost: 1,
          break_rate: 0.667,
          points_with_turnover: 3,
          turnover_rate: 1.0,
        },
      ],
    };

    // Mock URL.createObjectURL to capture the blob
    let capturedBlob: Blob | null = null;
    const originalCreateObjectURL = globalThis.URL.createObjectURL;
    globalThis.URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock-url";
    });

    // Mock link.click to avoid actual download
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tag: string) => {
      const element = originalCreateElement.call(document, tag);
      if (tag === "a") {
        element.click = vi.fn();
      }
      return element;
    }) as typeof document.createElement;

    // Call the export function
    await exportGameStatisticsToCSV(game, teamStats, playerStats, strategyStats);

    // Verify the blob was created
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob).toBeInstanceOf(Blob);

    // TypeScript: assert blob is not null after runtime checks
    const blob = capturedBlob as unknown as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8;");

    // Read and verify CSV content
    const csvContent = await blob.text();
    expect(csvContent).toContain("GAME INFORMATION");
    expect(csvContent).toContain("Test Competition");
    expect(csvContent).toContain("Test Team vs Rival Team");
    expect(csvContent).toContain("TEAM STATISTICS");
    expect(csvContent).toContain("Pull Inbound Rate");
    expect(csvContent).toContain("PLAYER STATISTICS");
    expect(csvContent).toContain("John Doe");
    expect(csvContent).toContain("STRATEGY STATISTICS");
    expect(csvContent).toContain("Offense Strategies");
    expect(csvContent).toContain("Defense Strategies");
    expect(csvContent).toContain("Ho Stack");
    expect(csvContent).toContain("Zone");
    expect(csvContent).toContain("POINTS DETAIL");
    expect(csvContent).toContain("Point 1");

    // Restore mocks
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    document.createElement = originalCreateElement;
  });
});
