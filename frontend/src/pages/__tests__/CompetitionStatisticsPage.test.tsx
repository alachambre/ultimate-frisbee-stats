import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition } from "../../services";
import CompetitionStatisticsPage from "../CompetitionStatisticsPage";
import { server } from "../../test/setup";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8000";

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

describe("CompetitionStatisticsPage", () => {
  beforeEach(async () => {
    mockUseNavigate.mockClear();
    mockUseParams.mockReturnValue({ competitionId: "1" });

    const team = await createTeam({ name: "Monkey" });
    await createCompetition({
      team_id: team.id,
      name: "Spring Tour",
      start_date: "2025-03-01",
      end_date: "2025-03-31",
    });
  });

  it("renders competition stats page header and back navigation", async () => {
    const user = userEvent.setup();
    render(<CompetitionStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Spring Tour - Competition Statistics")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back to competition/i });
    await user.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith("/competitions/1");
  });

  it("renders team, strategy and player stats sections", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE_URL}/statistics/competitions/:competitionId/team`, () => {
        return HttpResponse.json({
          competition_id: 1,
          total_completed_points: 4,
          offense: {
            points_started: 2,
            points_won: 1,
            points_lost: 1,
            hold_rate: 0.5,
            points_won_no_turnover: 1,
            clean_hold_rate: 1.0,
            broken_rate: 0.5,
          },
          defense: {
            points_started: 2,
            points_won: 1,
            points_lost: 1,
            break_rate: 0.5,
            points_with_turnover: 1,
            turnover_rate: 0.5,
            points_won_no_turnover: 1,
            clean_break_rate: 1.0,
            points_lost_no_turnover: 0,
            hold_rate: 0.5,
            pull_stats: {
              total_pulls: 2,
              inbound_pulls: 1,
              out_of_bounds_pulls: 1,
              inbound_rate: 0.5,
            },
          },
        });
      }),
      http.get(`${BASE_URL}/statistics/competitions/:competitionId/players`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "Jane Smith",
            player_number: 7,
            points_played: 4,
            effective_time_seconds: 320,
            offense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              hold_rate: 0.5,
              points_won_no_turnover: 1,
              clean_hold_rate: 1.0,
            },
            defense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 1,
              turnover_rate: 0.5,
              points_won_no_turnover: 1,
              clean_break_rate: 1.0,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      }),
      http.get(`${BASE_URL}/statistics/competitions/:competitionId/strategies`, () => {
        return HttpResponse.json({
          competition_id: 1,
          offense_strategies: [
            {
              strategy_id: 11,
              strategy_name: "Horizontal Stack",
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              hold_rate: 0.5,
              clean_holds: 1,
              clean_hold_rate: 0.5,
              quick_scores: 1,
              quick_score_rate: 0.5,
            },
          ],
          defense_strategies: [
            {
              strategy_id: 12,
              strategy_name: "Person Defense",
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 1,
              turnover_rate: 0.5,
            },
          ],
        });
      })
    );

    render(<CompetitionStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Team Statistics")).toBeInTheDocument();
    });

    expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    expect(screen.getByText("Strategy Statistics")).toBeInTheDocument();
    expect(screen.getAllByText("Jane Smith").length).toBeGreaterThan(0);
    expect(screen.getByText("Horizontal Stack")).toBeInTheDocument();
    expect(screen.getByText("Person Defense")).toBeInTheDocument();

    const playerStatsButton = screen.getByRole("button", {
      name: /view statistics for jane smith/i,
    });
    await user.click(playerStatsButton);

    expect(mockUseNavigate).toHaveBeenCalledWith(
      "/statistics/players/1?scope=competition&competitionId=1"
    );
  });
});
