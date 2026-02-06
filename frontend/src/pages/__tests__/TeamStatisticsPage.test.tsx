import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createPlayer } from "../../services";
import TeamStatisticsPage from "../TeamStatisticsPage";
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

describe("TeamStatisticsPage", () => {
  beforeEach(async () => {
    mockUseParams.mockReturnValue({ teamId: "1" });

    const team = await createTeam({ name: "Monkey" });
    await createPlayer({
      team_id: team.id,
      name: "John Doe",
      number: 10,
      gender: "M",
    });
  });

  it("renders team stats page header and back navigation", async () => {
    const user = userEvent.setup();
    render(<TeamStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Monkey - Team Statistics")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back to team/i });
    await user.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith("/teams/1");
  });

  it("renders team, strategy and player stats sections", async () => {
    server.use(
      http.get(`${BASE_URL}/statistics/teams/:teamId/team`, () => {
        return HttpResponse.json({
          team_id: 1,
          total_completed_points: 6,
          offense: {
            points_started: 3,
            points_won: 2,
            points_lost: 1,
            hold_rate: 0.667,
            points_won_no_turnover: 1,
            clean_hold_rate: 0.5,
            broken_rate: 0.333,
          },
          defense: {
            points_started: 3,
            points_won: 1,
            points_lost: 2,
            break_rate: 0.333,
            points_with_turnover: 2,
            turnover_rate: 0.667,
            points_won_no_turnover: 1,
            clean_break_rate: 1.0,
            points_lost_no_turnover: 1,
            hold_rate: 0.667,
            pull_stats: {
              total_pulls: 3,
              inbound_pulls: 2,
              out_of_bounds_pulls: 1,
              inbound_rate: 0.667,
            },
          },
        });
      }),
      http.get(`${BASE_URL}/statistics/teams/:teamId/players`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 6,
            effective_time_seconds: 480,
            offense: {
              points_played: 3,
              points_won: 2,
              points_lost: 1,
              hold_rate: 0.667,
              points_won_no_turnover: 1,
              clean_hold_rate: 0.5,
            },
            defense: {
              points_played: 3,
              points_won: 1,
              points_lost: 2,
              break_rate: 0.333,
              points_with_turnover: 2,
              turnover_rate: 0.667,
              points_won_no_turnover: 1,
              clean_break_rate: 1.0,
              points_lost_no_turnover: 1,
            },
          },
        ]);
      }),
      http.get(`${BASE_URL}/statistics/teams/:teamId/strategies`, () => {
        return HttpResponse.json({
          team_id: 1,
          offense_strategies: [
            {
              strategy_id: 1,
              strategy_name: "Vertical Stack",
              points_played: 3,
              points_won: 2,
              points_lost: 1,
              hold_rate: 0.667,
              clean_holds: 1,
              clean_hold_rate: 0.333,
              quick_scores: 1,
              quick_score_rate: 0.333,
            },
          ],
          defense_strategies: [
            {
              strategy_id: 2,
              strategy_name: "Zone",
              points_played: 3,
              points_won: 1,
              points_lost: 2,
              break_rate: 0.333,
              points_with_turnover: 2,
              turnover_rate: 0.667,
            },
          ],
        });
      })
    );

    render(<TeamStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Team Statistics")).toBeInTheDocument();
    });

    expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    expect(screen.getByText("Strategy Statistics")).toBeInTheDocument();
    expect(screen.getAllByText("John Doe").length).toBeGreaterThan(0);
    expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    expect(screen.getByText("Zone")).toBeInTheDocument();
  });
});
