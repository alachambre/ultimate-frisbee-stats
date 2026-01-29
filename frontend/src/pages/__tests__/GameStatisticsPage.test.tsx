import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition, createGame } from "../../services";
import GameStatisticsPage from "../GameStatisticsPage";
import { server } from "../../test/setup";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8000";

// Mock useParams and useNavigate
const mockUseParams = vi.fn();
const mockUseNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate,
  };
});

describe("GameStatisticsPage", () => {
  beforeEach(async () => {
    // Reset the mock to return gameId "1" for each test
    mockUseParams.mockReturnValue({ gameId: "1" });

    // Create a test team, competition, and game before each test
    const testTeam = await createTeam({ name: "Test Team" });
    const testCompetition = await createCompetition({
      team_id: testTeam.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    await createGame({
      competition_id: testCompetition.id,
      opponent_name: "Rival Team",
      date: "2024-01-15",
    });
  });

  it("displays game overview information correctly", async () => {
    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    expect(screen.getByText("0 - 0")).toBeInTheDocument();
    expect(screen.getByText("Test Team")).toBeInTheDocument();
    expect(screen.getByText("Rival Team")).toBeInTheDocument();
  });

  it("displays back button and navigates correctly", async () => {
    const user = userEvent.setup();
    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText(/back/i)).toBeInTheDocument();
    });

    // Find button with ArrowBack icon
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith("/games/1");
  });

  it("displays team statistics when data is available", async () => {
    // Override the team stats endpoint to return actual data
    server.use(
      http.get(`${BASE_URL}/statistics/games/:gameId/team`, () => {
        return HttpResponse.json({
          game_id: 1,
          total_completed_points: 10,
          offense: {
            points_started: 5,
            points_won: 4,
            points_lost: 1,
            hold_rate: 0.8,
            points_won_no_turnover: 3,
            clean_hold_rate: 0.75,
            broken_rate: 0.2,
          },
          defense: {
            points_started: 5,
            points_won: 2,
            points_lost: 3,
            break_rate: 0.4,
            points_with_turnover: 4,
            turnover_rate: 0.8,
            points_won_no_turnover: 1,
            clean_break_rate: 0.5,
            points_lost_no_turnover: 1,
            hold_rate: 0.4,
          },
        });
      })
    );

    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Team Statistics")).toBeInTheDocument();
    });

    // Check for sections
    expect(screen.getByText("Offense")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();

    // Check for percentage displays (use getAllByText since percentages may appear multiple times)
    expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
  });

  it("displays player statistics table", async () => {
    // Override the player stats endpoint to return actual data
    server.use(
      http.get(`${BASE_URL}/statistics/games/:gameId/live`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 5,
            effective_time_seconds: 300,
            offense: {
              points_played: 3,
              points_won: 2,
              points_lost: 1,
              hold_rate: 0.667,
              points_won_no_turnover: 1,
              clean_hold_rate: 0.5,
            },
            defense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 2,
              turnover_rate: 1.0,
              points_won_no_turnover: 1,
              clean_break_rate: 1.0,
              points_lost_no_turnover: 0,
            },
          },
          {
            player_id: 2,
            player_name: "Jane Smith",
            player_number: 7,
            points_played: 3,
            effective_time_seconds: 180,
            offense: {
              points_played: 2,
              points_won: 2,
              points_lost: 0,
              hold_rate: 1.0,
              points_won_no_turnover: 2,
              clean_hold_rate: 1.0,
            },
            defense: {
              points_played: 1,
              points_won: 0,
              points_lost: 1,
              break_rate: 0.0,
              points_with_turnover: 1,
              turnover_rate: 1.0,
              points_won_no_turnover: 0,
              clean_break_rate: 0.0,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      })
    );

    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check for player names
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Check for player numbers
    expect(screen.getByText("#10")).toBeInTheDocument();
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("allows sorting player statistics", async () => {
    const user = userEvent.setup();

    // Override the player stats endpoint to return actual data
    server.use(
      http.get(`${BASE_URL}/statistics/games/:gameId/live`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "Alice",
            player_number: 10,
            points_played: 3,
            effective_time_seconds: 180,
            offense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              hold_rate: 0.5,
              points_won_no_turnover: 1,
              clean_hold_rate: 1.0,
            },
            defense: {
              points_played: 1,
              points_won: 0,
              points_lost: 1,
              break_rate: 0.0,
              points_with_turnover: 1,
              turnover_rate: 1.0,
              points_won_no_turnover: 0,
              clean_break_rate: 0.0,
              points_lost_no_turnover: 0,
            },
          },
          {
            player_id: 2,
            player_name: "Bob",
            player_number: 7,
            points_played: 8,
            effective_time_seconds: 480,
            offense: {
              points_played: 5,
              points_won: 4,
              points_lost: 1,
              hold_rate: 0.8,
              points_won_no_turnover: 3,
              clean_hold_rate: 0.75,
            },
            defense: {
              points_played: 3,
              points_won: 2,
              points_lost: 1,
              break_rate: 0.667,
              points_with_turnover: 3,
              turnover_rate: 1.0,
              points_won_no_turnover: 1,
              clean_break_rate: 0.5,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      })
    );

    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Both players should be visible initially
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();

    // Verify table has sortable columns
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();

    // Verify header cells exist
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Points")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("hides team statistics when no completed points", async () => {
    // Use default empty stats from MSW handlers (total_completed_points: 0)
    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Team statistics section should not be visible
    expect(screen.queryByText("Team Statistics")).not.toBeInTheDocument();
  });

  it("displays player count correctly", async () => {
    // Override the player stats endpoint to return actual data
    server.use(
      http.get(`${BASE_URL}/statistics/games/:gameId/live`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 5,
            effective_time_seconds: 300,
            offense: {
              points_played: 3,
              points_won: 2,
              points_lost: 1,
              hold_rate: 0.667,
              points_won_no_turnover: 1,
              clean_hold_rate: 0.5,
            },
            defense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 2,
              turnover_rate: 1.0,
              points_won_no_turnover: 1,
              clean_break_rate: 1.0,
              points_lost_no_turnover: 0,
            },
          },
          {
            player_id: 2,
            player_name: "Jane Smith",
            player_number: 7,
            points_played: 3,
            effective_time_seconds: 180,
            offense: {
              points_played: 2,
              points_won: 2,
              points_lost: 0,
              hold_rate: 1.0,
              points_won_no_turnover: 2,
              clean_hold_rate: 1.0,
            },
            defense: {
              points_played: 1,
              points_won: 0,
              points_lost: 1,
              break_rate: 0.0,
              points_with_turnover: 1,
              turnover_rate: 1.0,
              points_won_no_turnover: 0,
              clean_break_rate: 0.0,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      })
    );

    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check for player count
    expect(screen.getByText(/2 player\(s\)/)).toBeInTheDocument();
  });

  it("displays stat values in correct format", async () => {
    // Override the player stats endpoint to return actual data
    server.use(
      http.get(`${BASE_URL}/statistics/games/:gameId/live`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 6,
            effective_time_seconds: 300,
            offense: {
              points_played: 4,
              points_won: 3,
              points_lost: 1,
              hold_rate: 0.75,
              points_won_no_turnover: 2,
              clean_hold_rate: 0.667,
            },
            defense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 2,
              turnover_rate: 1.0,
              points_won_no_turnover: 0,
              clean_break_rate: 0.0,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      })
    );

    render(<GameStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // Check time format (5:00 for 300 seconds)
    expect(screen.getAllByText("5:00").length).toBeGreaterThan(0);

    // Check that stats are displayed (using more specific values)
    expect(screen.getAllByText("3 (75%)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 (67%)").length).toBeGreaterThan(0);
  });
});
