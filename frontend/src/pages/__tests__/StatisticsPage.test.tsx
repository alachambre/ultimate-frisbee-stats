import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import {
  addPlayersToGame,
  addPlayersToRoster,
  createCompetition,
  createGame,
  createPlayer,
  createTeam,
} from "../../services";
import StatisticsPage from "../StatisticsPage";

describe("StatisticsPage", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/statistics");
  });

  it("shows a prompt when no team is selected", async () => {
    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Statistics")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/select a team to start exploring statistics/i)
    ).toBeInTheDocument();
  });

  it("renders player-focused statistics with circular charts", async () => {
    const team = await createTeam({ name: "Monkey" });
    const player = await createPlayer({
      team_id: team.id,
      name: "John Doe",
      number: 10,
      gender: "M",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&mode=player&playerId=${player.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "John Doe" })
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Offense")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("Hold")).toBeInTheDocument();
    expect(screen.getByText("Break")).toBeInTheDocument();
  });

  it("navigates from game back to competition using the breadcrumb", async () => {
    const user = userEvent.setup();

    const team = await createTeam({ name: "Monkey" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2025-03-01",
      end_date: "2025-03-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals",
      date: "2025-03-15",
    });

    const player = await createPlayer({
      team_id: team.id,
      name: "Alex",
      number: 7,
      gender: "W",
    });
    await addPlayersToRoster(competition.id, [player.id]);
    await addPlayersToGame(game.id, [player.id]);

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&mode=competition&competitionId=${competition.id}&gameId=${game.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Monkey vs Rivals/i).length).toBeGreaterThan(0);
    });

    const competitionBreadcrumb = screen.getByRole("button", {
      name: /spring cup/i,
    });
    await user.click(competitionBreadcrumb);

    await waitFor(() => {
      expect(window.location.search).toContain(`teamId=${team.id}`);
      expect(window.location.search).toContain(`competitionId=${competition.id}`);
      expect(window.location.search).not.toContain("gameId=");
    });
  });
});
