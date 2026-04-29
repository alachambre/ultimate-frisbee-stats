import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import {
  addPlayersToGame,
  addPlayersToRoster,
  createCompetition,
  createGame,
  createPlayer,
  createTurnover,
  createTeam,
  finishPoint,
  startPoint,
  updateGame,
  updatePoint,
} from "../../services";
import { server } from "../../test/setup";
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
      screen.getAllByText(/select a team to start exploring statistics/i).length
    ).toBeGreaterThan(0);
  });

  it("renders statistics tabs for the selected team dataset", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Evolution" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Players" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Players" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Players statistics" })).toBeInTheDocument();
    });
  });

  it("loads statistics tab data only when the tab is opened", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const statisticsRequests: string[] = [];
    const requestListener = ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      if (url.pathname.startsWith(`/statistics/teams/${team.id}/`)) {
        statisticsRequests.push(url.pathname);
      }
    };

    server.events.on("request:start", requestListener);
    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);

    try {
      render(<StatisticsPage />);

      await waitFor(() => {
        expect(statisticsRequests).toContain(`/statistics/teams/${team.id}/team`);
      });

      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/evolution`);
      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/players`);
      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/strategies`);

      await user.click(screen.getByRole("tab", { name: "Evolution" }));

      await waitFor(() => {
        expect(statisticsRequests).toContain(`/statistics/teams/${team.id}/evolution`);
      });

      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/players`);
      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/strategies`);

      await user.click(screen.getByRole("tab", { name: "Players" }));

      await waitFor(() => {
        expect(statisticsRequests).toContain(`/statistics/teams/${team.id}/players`);
      });

      expect(statisticsRequests).not.toContain(`/statistics/teams/${team.id}/strategies`);

      await user.click(screen.getByRole("tab", { name: "Strategies" }));

      await waitFor(() => {
        expect(statisticsRequests).toContain(`/statistics/teams/${team.id}/strategies`);
      });
    } finally {
      server.events.removeListener("request:start", requestListener);
    }
  });

  it("lets users refresh the active statistics dataset", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const teamStatsRequests: string[] = [];
    const requestListener = ({ request }: { request: Request }) => {
      const url = new URL(request.url);
      if (url.pathname === `/statistics/teams/${team.id}/team`) {
        teamStatsRequests.push(url.pathname);
      }
    };

    server.events.on("request:start", requestListener);
    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);

    try {
      render(<StatisticsPage />);

      await waitFor(() => {
        expect(teamStatsRequests).toHaveLength(1);
      });

      expect(
        screen.getByText(/Statistics may be cached for up to 5 minutes/i)
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Refresh statistics" }));

      await waitFor(() => {
        expect(teamStatsRequests).toHaveLength(2);
      });
    } finally {
      server.events.removeListener("request:start", requestListener);
    }
  });

  it("limits team members to team and strategy statistics", async () => {
    const team = await createTeam({ name: "Monkey" });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);

    render(<StatisticsPage />, {
      auth: {
        role: "team_member",
        enforcementMode: "enforced",
        isAuthenticated: true,
        hasAppAccess: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Team" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Evolution" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Strategies" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("tab", { name: "Players" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("4. Player filter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /export csv/i })).not.toBeInTheDocument();
  });

  it("renders the evolution chart and table for the selected dataset", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const bob = await createPlayer({ team_id: team.id, name: "Bob", gender: "M" });
    const tom = await createPlayer({ team_id: team.id, name: "Tom", gender: "M" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });
    await addPlayersToRoster(competition.id, [bob.id, tom.id]);

    const earlyGame = await createGame({
      competition_id: competition.id,
      opponent_name: "Early Rivals",
      date: "2026-03-15T10:00:00Z",
    });
    await addPlayersToGame(earlyGame.id, [bob.id, tom.id]);

    await createGame({
      competition_id: competition.id,
      opponent_name: "Empty Rivals",
      date: "2026-03-16T10:00:00Z",
    });

    const lateGame = await createGame({
      competition_id: competition.id,
      opponent_name: "Late Rivals",
      date: "2026-03-17T10:00:00Z",
    });
    await addPlayersToGame(lateGame.id, [bob.id, tom.id]);

    const holdPoint = await startPoint({
      game_id: earlyGame.id,
      starting_on_offense: true,
      player_ids: [bob.id, tom.id],
      start_datetime: "2026-03-15T10:00:00Z",
    });
    await updatePoint(holdPoint.id, { status: "running" });
    await finishPoint(holdPoint.id, {
      won: true,
      end_datetime: "2026-03-15T10:01:00Z",
    });

    const breakPoint = await startPoint({
      game_id: earlyGame.id,
      starting_on_offense: false,
      player_ids: [bob.id, tom.id],
      start_datetime: "2026-03-15T10:02:00Z",
    });
    await updatePoint(breakPoint.id, { status: "running", pull: true });
    await createTurnover({
      point_id: breakPoint.id,
      timestamp: "2026-03-15T10:02:20Z",
    });
    await finishPoint(breakPoint.id, {
      won: true,
      end_datetime: "2026-03-15T10:03:00Z",
    });

    const brokenPoint = await startPoint({
      game_id: lateGame.id,
      starting_on_offense: true,
      player_ids: [bob.id, tom.id],
      start_datetime: "2026-03-17T10:00:00Z",
    });
    await updatePoint(brokenPoint.id, { status: "running" });
    await createTurnover({
      point_id: brokenPoint.id,
      timestamp: "2026-03-17T10:00:20Z",
    });
    await finishPoint(brokenPoint.id, {
      won: false,
      end_datetime: "2026-03-17T10:01:00Z",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&competitionIds=${competition.id}`
    );

    render(<StatisticsPage />);

    const evolutionTab = await screen.findByRole("tab", { name: "Evolution" });
    await user.click(evolutionTab);

    expect(
      await screen.findByRole("img", { name: "Statistics evolution chart" })
    ).toBeInTheDocument();
    const table = await screen.findByRole("table", {
      name: "Statistics evolution table",
    });
    expect(within(table).getByText("Early Rivals")).toBeInTheDocument();
    expect(within(table).getByText("Late Rivals")).toBeInTheDocument();
    expect(within(table).queryByText("Empty Rivals")).not.toBeInTheDocument();
    expect(within(table).getByText("Our turnovers")).toBeInTheDocument();
    expect(within(table).getByText("Opponent turnovers")).toBeInTheDocument();
    expect(within(table).getByText("2 - 0")).toBeInTheDocument();
    expect(within(table).getByText("0 - 1")).toBeInTheDocument();
    expect(screen.getByText("1 game omitted")).toBeInTheDocument();
  });

  it("keeps legacy single-competition and single-game links working", async () => {
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
    await updateGame(game.id, { status: "started" });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&mode=competition&competitionId=${competition.id}&gameId=${game.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("0 - 0")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Spring Cup").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rivals").length).toBeGreaterThan(0);
  });

  it("supports plural competition and game filters in the shared dataset", async () => {
    const team = await createTeam({ name: "Monkey" });
    const competitionA = await createCompetition({
      team_id: team.id,
      name: "Phase 1",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
    const competitionB = await createCompetition({
      team_id: team.id,
      name: "Phase 2",
      start_date: "2026-02-01",
      end_date: "2026-02-28",
    });
    const gameA = await createGame({
      competition_id: competitionA.id,
      opponent_name: "Alpha",
      date: "2026-01-10",
    });
    await updateGame(gameA.id, { status: "ended" });
    const gameB = await createGame({
      competition_id: competitionB.id,
      opponent_name: "Beta",
      date: "2026-02-10",
    });
    await updateGame(gameB.id, { status: "ended" });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&competitionIds=${competitionA.id},${competitionB.id}&gameIds=${gameA.id},${gameB.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Phase 1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Phase 2").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Beta").length).toBeGreaterThan(0);
    });
  });

  it("filters available games by the selected competitions", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const competitionA = await createCompetition({
      team_id: team.id,
      name: "Phase 1",
      start_date: "2026-01-01",
      end_date: "2026-01-31",
    });
    const competitionB = await createCompetition({
      team_id: team.id,
      name: "Phase 2",
      start_date: "2026-02-01",
      end_date: "2026-02-28",
    });
    await createGame({
      competition_id: competitionA.id,
      opponent_name: "Alpha",
      date: "2026-01-10",
    });
    await createGame({
      competition_id: competitionB.id,
      opponent_name: "Beta",
      date: "2026-02-10",
    });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);
    render(<StatisticsPage />);

    const competitionInput = await screen.findByLabelText("2. Competition");
    await user.click(competitionInput);
    await user.click(await screen.findByText("Phase 1"));

    const gamesInput = screen.getByLabelText("3. Game");
    await user.click(gamesInput);

    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByText("Alpha")).toBeInTheDocument();
    expect(within(listbox).queryByText("Beta")).not.toBeInTheDocument();
  });

  it("supports selecting multiple players as a player filter", async () => {
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
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });
    await addPlayersToRoster(competition.id, [player1.id, player2.id]);
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals",
      date: "2026-03-15",
    });
    await addPlayersToGame(game.id, [player1.id, player2.id]);

    const sharedPoint = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      player_ids: [player1.id, player2.id],
    });
    await updatePoint(sharedPoint.id, { status: "running" });
    await finishPoint(sharedPoint.id, { won: true });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);
    render(<StatisticsPage />);

    const playersInput = await screen.findByLabelText("4. Player filter");
    await user.click(playersInput);
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Bob"));
    await user.click(within(listbox).getByText("Tom"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.queryByText("Active player filter: 1 selected")).not.toBeInTheDocument();
    expect(window.location.search).not.toContain("playerIds=");

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByText("Active player filter: 2 selected")).toBeInTheDocument();
    });

    expect(window.location.search).toContain(`playerIds=${player1.id}%2C${player2.id}`);
  });

  it("filters available players to the selected game rosters", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const bob = await createPlayer({ team_id: team.id, name: "Bob", gender: "M" });
    const tom = await createPlayer({ team_id: team.id, name: "Tom", gender: "M" });
    const dana = await createPlayer({ team_id: team.id, name: "Dana", gender: "W" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });

    await addPlayersToRoster(competition.id, [bob.id, tom.id, dana.id]);

    await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals A",
      date: "2026-03-15",
      player_ids: [bob.id, tom.id],
    });
    await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals B",
      date: "2026-03-16",
      player_ids: [bob.id, dana.id],
    });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);
    render(<StatisticsPage />);

    const gamesInput = await screen.findByLabelText("3. Game");
    await user.click(gamesInput);
    await user.click(await screen.findByText("Rivals A"));

    const playersInput = screen.getByLabelText("4. Player filter");
    await user.click(playersInput);

    await waitFor(() => {
      const listbox = screen.getByRole("listbox");
      expect(within(listbox).getByText("Bob")).toBeInTheDocument();
      expect(within(listbox).getByText("Tom")).toBeInTheDocument();
      expect(within(listbox).queryByText("Dana")).not.toBeInTheDocument();
    });
  });

  it("filters available players to teammates who shared a completed point", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const bob = await createPlayer({ team_id: team.id, name: "Bob", gender: "M" });
    const tom = await createPlayer({ team_id: team.id, name: "Tom", gender: "M" });
    const dana = await createPlayer({ team_id: team.id, name: "Dana", gender: "W" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });

    await addPlayersToRoster(competition.id, [bob.id, tom.id, dana.id]);

    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals",
      date: "2026-03-15",
    });
    await addPlayersToGame(game.id, [bob.id, tom.id, dana.id]);

    const sharedPoint = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      player_ids: [bob.id, tom.id],
    });
    await updatePoint(sharedPoint.id, { status: "running" });
    await finishPoint(sharedPoint.id, { won: true });

    const separatePoint = await startPoint({
      game_id: game.id,
      starting_on_offense: false,
      player_ids: [dana.id],
    });
    await updatePoint(separatePoint.id, { status: "running" });
    await finishPoint(separatePoint.id, { won: false });

    window.history.pushState({}, "", `/statistics?teamId=${team.id}`);
    render(<StatisticsPage />);

    const playersInput = await screen.findByLabelText("4. Player filter");
    await user.click(playersInput);

    let listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByText("Bob"));
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.getByText("Active player filter: 1 selected")).toBeInTheDocument();
    });

    await user.click(playersInput);

    await waitFor(() => {
      listbox = screen.getByRole("listbox");
      expect(within(listbox).getByText("Tom")).toBeInTheDocument();
      expect(within(listbox).queryByText("Dana")).not.toBeInTheDocument();
    });
  });

  it("shows game trends for a single selected game and lets the user switch metrics", async () => {
    const user = userEvent.setup();
    const team = await createTeam({ name: "Monkey" });
    const bob = await createPlayer({ team_id: team.id, name: "Bob", gender: "M" });
    const tom = await createPlayer({ team_id: team.id, name: "Tom", gender: "M" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });

    await addPlayersToRoster(competition.id, [bob.id, tom.id]);

    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals",
      date: "2026-03-15",
    });
    await addPlayersToGame(game.id, [bob.id, tom.id]);
    await updateGame(game.id, { status: "started" });

    const point = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      player_ids: [bob.id, tom.id],
      start_datetime: "2026-03-15T10:00:00Z",
    });
    await updatePoint(point.id, { status: "running" });
    await createTurnover({
      point_id: point.id,
      timestamp: "2026-03-15T10:00:20Z",
    });
    await finishPoint(point.id, {
      won: true,
      end_datetime: "2026-03-15T10:01:05Z",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&competitionIds=${competition.id}&gameIds=${game.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getByText("Game trends")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Score progression" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    const gameTrendsHeading = screen.getByText("Game trends");
    const statisticsTabs = screen.getByRole("tablist", { name: "Statistics sections" });
    expect(
      gameTrendsHeading.compareDocumentPosition(statisticsTabs) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Point duration" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Point duration" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });

    await user.click(screen.getByRole("button", { name: "Turns per point" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Turns per point" })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  it("does not show game trends when multiple games are selected", async () => {
    const team = await createTeam({ name: "Monkey" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Spring Cup",
      start_date: "2026-03-01",
      end_date: "2026-03-31",
    });
    const gameA = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals A",
      date: "2026-03-15",
    });
    const gameB = await createGame({
      competition_id: competition.id,
      opponent_name: "Rivals B",
      date: "2026-03-16",
    });

    window.history.pushState(
      {},
      "",
      `/statistics?teamId=${team.id}&competitionIds=${competition.id}&gameIds=${gameA.id},${gameB.id}`
    );

    render(<StatisticsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Rivals A").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Rivals B").length).toBeGreaterThan(0);
    });

    expect(screen.queryByText("Game trends")).not.toBeInTheDocument();
  });
});
