import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createPlayer, createCompetition, addPlayersToRoster } from "../../services";
import PlayerStatisticsPage from "../PlayerStatisticsPage";
import { server } from "../../test/setup";
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:8000";

const mockUseParams = vi.fn();
const mockUseNavigate = vi.fn();
const mockUseSearchParams = vi.fn();
const mockSetSearchParams = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

describe("PlayerStatisticsPage", () => {
  beforeEach(async () => {
    mockUseNavigate.mockClear();
    mockSetSearchParams.mockClear();
    mockUseParams.mockReturnValue({ playerId: "1" });

    const team = await createTeam({ name: "Monkey" });
    await createPlayer({
      team_id: team.id,
      name: "John Doe",
      number: 10,
      gender: "M",
    });
  });

  it("renders team-scoped player statistics and navigates back", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams("scope=team&teamId=1"),
      mockSetSearchParams,
    ]);

    server.use(
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
              clean_break_rate: 0.333,
              points_lost_no_turnover: 1,
            },
          },
        ]);
      })
    );

    render(<PlayerStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("John Doe - Player Statistics")).toBeInTheDocument();
    });

    expect(screen.getAllByText("8:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("#10").length).toBeGreaterThan(0);

    const backButton = screen.getByRole("button", { name: /back to team statistics/i });
    await user.click(backButton);

    expect(mockUseNavigate).toHaveBeenCalledWith("/statistics/teams/1");
  });

  it("switches between scopes using query params", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue([
      new URLSearchParams("scope=competition&competitionId=1"),
      mockSetSearchParams,
    ]);

    const competition = await createCompetition({
      team_id: 1,
      name: "Spring Tour",
      start_date: "2025-03-01",
      end_date: "2025-03-31",
    });
    await addPlayersToRoster(competition.id, [1]);

    server.use(
      http.get(`${BASE_URL}/statistics/competitions/:competitionId/players`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 4,
            effective_time_seconds: 300,
            offense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              hold_rate: 0.5,
              points_won_no_turnover: 1,
              clean_hold_rate: 0.5,
            },
            defense: {
              points_played: 2,
              points_won: 1,
              points_lost: 1,
              break_rate: 0.5,
              points_with_turnover: 1,
              turnover_rate: 0.5,
              points_won_no_turnover: 1,
              clean_break_rate: 0.5,
              points_lost_no_turnover: 0,
            },
          },
        ]);
      }),
      http.get(`${BASE_URL}/statistics/teams/:teamId/players`, () => {
        return HttpResponse.json([
          {
            player_id: 1,
            player_name: "John Doe",
            player_number: 10,
            points_played: 8,
            effective_time_seconds: 600,
            offense: {
              points_played: 4,
              points_won: 3,
              points_lost: 1,
              hold_rate: 0.75,
              points_won_no_turnover: 2,
              clean_hold_rate: 0.5,
            },
            defense: {
              points_played: 4,
              points_won: 2,
              points_lost: 2,
              break_rate: 0.5,
              points_with_turnover: 2,
              turnover_rate: 0.5,
              points_won_no_turnover: 1,
              clean_break_rate: 0.25,
              points_lost_no_turnover: 1,
            },
          },
        ]);
      })
    );

    render(<PlayerStatisticsPage />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /scope/i })).toBeInTheDocument();
    });

    const scopeSelect = screen.getByRole("combobox", { name: /scope/i });
    await user.click(scopeSelect);
    await user.click(screen.getByRole("option", { name: "Team" }));

    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
    const nextSearchParams = mockSetSearchParams.mock.calls[0][0] as URLSearchParams;
    expect(nextSearchParams.get("scope")).toBe("team");
    expect(nextSearchParams.get("competitionId")).toBe("1");
  });
});
