import { describe, it, expect, beforeEach, vi } from "vitest";
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
      expect(screen.getAllByRole("heading", { name: "John Doe" }).length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Offense")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("Hold")).toBeInTheDocument();
    expect(screen.getByText("Break")).toBeInTheDocument();
  });

  it("splits player selection by gender in player flow", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    await createPlayer({
      team_id: team.id,
      name: "Bob",
      number: 10,
      gender: "M",
    });
    await createPlayer({
      team_id: team.id,
      name: "Alice",
      number: 11,
      gender: "W",
    });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}&mode=player`);

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Men (1)")).toBeInTheDocument();
      expect(screen.getByText("Women (1)")).toBeInTheDocument();
    });

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Women (1)" }));

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("renders competition statistics in tabs to reduce scrolling", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Windmill",
      start_date: "2026-01-24",
      end_date: "2026-01-25",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&mode=competition&competitionId=${competition.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Players" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Players" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Players statistics" })).toBeInTheDocument();
    });
  });

  it("renders the same tabs on team overview in competition flow", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}&mode=competition`);

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Players" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Players" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Players statistics" })).toBeInTheDocument();
    });
  });

  it("renders the same tabs on game scope in competition flow", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals",
      date: "2026-03-15",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&mode=competition&competitionId=${competition.id}&gameId=${game.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Players" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Players" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Players statistics" })).toBeInTheDocument();
    });
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

    const competitionBreadcrumb = screen.getAllByRole("button", {
      name: /spring cup/i,
    })[0];
    await user.click(competitionBreadcrumb);

    await waitFor(() => {
      expect(window.location.search).toContain(`teamId=${team.id}`);
      expect(window.location.search).toContain(`competitionId=${competition.id}`);
      expect(window.location.search).not.toContain("gameId=");
    });
  });

  it("collapses configuration on mobile when selecting a player", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const player = await createPlayer({
      team_id: team.id,
      name: "Bob",
      number: 10,
      gender: "M",
    });

    const originalMatchMedia = window.matchMedia;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoViewMock = vi.fn();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(max-width:600px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    try {
      window.history.pushState({}, "", `/statistics?teamId=${team.id}&mode=player`);

      render(<StatisticsPage />);

      const playerCard = await screen.findByRole("button", { name: player.name });
      await user.click(playerCard);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /show/i })).toBeInTheDocument();
      });

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    } finally {
      window.matchMedia = originalMatchMedia;
      Element.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it("supports selecting multiple players for shared cohort statistics", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const player1 = await createPlayer({
      team_id: team.id,
      name: "Bob",
      number: 10,
      gender: "M",
    });
    const player2 = await createPlayer({
      team_id: team.id,
      name: "Tom",
      number: 11,
      gender: "M",
    });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}&mode=player`);

    render(<StatisticsPage />);

    const player1Card = await screen.findByRole("button", { name: "Bob" });
    const player2Card = await screen.findByRole("button", { name: "Tom" });

    await user.click(player1Card);
    await user.click(player2Card);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: /2 player/i }).length).toBeGreaterThan(0);
    });

    expect(screen.getByText("Players: Bob, Tom")).toBeInTheDocument();
    expect(
      screen.getByText(
        "These statistics are computed from points where all selected players were on the line together."
      )
    ).toBeInTheDocument();
    expect(window.location.search).toContain(`playerIds=${player1.id}%2C${player2.id}`);
  });
});
