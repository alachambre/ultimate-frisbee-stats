import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StartPointDialog from "../StartPointDialog";
import type { Player } from "../../../types";
import { createTeam, createGame, createCompetition, createPlayer } from "../../../services";
import { createLine, addPlayersToLine } from "../../../services/lines";

const mockPlayers: Player[] = [
  { id: 1, name: "Alice", number: 10, gender: "W", team_id: 1, created_at: "2024-01-01" },
  { id: 2, name: "Bob", number: 20, gender: "M", team_id: 1, created_at: "2024-01-01" },
  { id: 3, name: "Charlie", number: 30, gender: "M", team_id: 1, created_at: "2024-01-01" },
  { id: 4, name: "Diana", number: 40, gender: "W", team_id: 1, created_at: "2024-01-01" },
  { id: 5, name: "Eve", number: 50, gender: "W", team_id: 1, created_at: "2024-01-01" },
  { id: 6, name: "Frank", number: 60, gender: "M", team_id: 1, created_at: "2024-01-01" },
  { id: 7, name: "Grace", number: 70, gender: "W", team_id: 1, created_at: "2024-01-01" },
  { id: 8, name: "Henry", number: 80, gender: "M", team_id: 1, created_at: "2024-01-01" },
];

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("StartPointDialog", () => {
  it("displays offense/defense toggle buttons", () => {
    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
        teamId={1}
        players={mockPlayers}
      />
    );

    expect(screen.getByRole("button", { name: /on offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /on defense/i })).toBeInTheDocument();
  });

  it("displays player selector", () => {
    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
        teamId={1}
        players={mockPlayers}
      />
    );

    // Men tab is active by default, so Bob should be visible
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("disables start button when less than 7 players selected", () => {
    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
        teamId={1}
        players={mockPlayers}
      />
    );

    const startButton = screen.getByRole("button", { name: /start point/i });
    expect(startButton).toBeDisabled();
  });

  it("enables start button when exactly 7 players selected", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
        teamId={1}
        players={mockPlayers}
      />
    );

    // Men tab is active by default - select 4 men
    const menCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
      const listItem = cb.closest('li');
      return listItem !== null;
    });

    for (let i = 0; i < 4; i++) {
      await user.click(menCheckboxes[i]);
    }

    // Switch to Women tab
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    // Select 3 women
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const womenCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
      const listItem = cb.closest('li');
      return listItem !== null;
    });

    for (let i = 0; i < 3; i++) {
      await user.click(womenCheckboxes[i]);
    }

    // Now should have 7 players selected
    const startButton = screen.getByRole("button", { name: /start point/i });
    await waitFor(() => {
      expect(startButton).toBeEnabled();
    });
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={onClose}
        gameId={1}
        teamId={1}
        players={mockPlayers}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("displays line filter when lines exist", async () => {
    // Create real data via API
    const team = await createTeam({ name: "Test Team" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rival",
      date: "2024-01-15",
    });

    // Create players
    const createdPlayers = await Promise.all(
      mockPlayers.map((p) =>
        createPlayer({
          name: p.name,
          number: p.number,
          gender: p.gender,
          team_id: team.id,
        })
      )
    );

    // Create a line
    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    // Add players to line
    await addPlayersToLine(line.id, createdPlayers.slice(0, 7).map((p) => p.id));

    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
        teamId={team.id}
        players={createdPlayers}
      />
    );

    // Wait for lines to load
    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    // Should show the line chips
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /all players/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "O-Line" })).toBeInTheDocument();
    });
  });

  it("filters players when line is selected", async () => {
    // Create real data via API
    const team = await createTeam({ name: "Test Team" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rival",
      date: "2024-01-15",
    });

    // Create players
    const createdPlayers = await Promise.all(
      mockPlayers.map((p) =>
        createPlayer({
          name: p.name,
          number: p.number,
          gender: p.gender,
          team_id: team.id,
        })
      )
    );

    // Create a line with only first 4 players
    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    const linePlayerIds = createdPlayers.slice(0, 4).map((p) => p.id);
    await addPlayersToLine(line.id, linePlayerIds);

    const user = userEvent.setup();

    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
        teamId={team.id}
        players={createdPlayers}
      />
    );

    // Wait for lines to load
    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    // Men tab is active by default, should see male players
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Henry")).toBeInTheDocument();

    // Click the O-Line chip to filter
    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    // Now should only see players from O-Line (first 4: Alice, Bob, Charlie, Diana)
    // Men tab is active, should see Bob and Charlie (first 4 includes 2 men)
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    // Should NOT see Frank or Henry (men not in the line)
    expect(screen.queryByText("Frank")).not.toBeInTheDocument();
    expect(screen.queryByText("Henry")).not.toBeInTheDocument();

    // Switch to Women tab to verify women are also filtered
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    await waitFor(() => {
      // Should see Alice and Diana (women in the line)
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Diana")).toBeInTheDocument();
    });

    // Should NOT see Eve or Grace (women not in the line)
    expect(screen.queryByText("Eve")).not.toBeInTheDocument();
    expect(screen.queryByText("Grace")).not.toBeInTheDocument();
  });

  it("clears selected players when line filter changes", async () => {
    // Create real data via API
    const team = await createTeam({ name: "Test Team" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rival",
      date: "2024-01-15",
    });

    // Create players
    const createdPlayers = await Promise.all(
      mockPlayers.map((p) =>
        createPlayer({
          name: p.name,
          number: p.number,
          gender: p.gender,
          team_id: team.id,
        })
      )
    );

    // Create a line
    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    const user = userEvent.setup();

    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
        teamId={team.id}
        players={createdPlayers}
      />
    );

    // Wait for lines to load
    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    // Select 2 players first
    const checkboxes = screen.getAllByRole("checkbox");
    const playerCheckboxes = checkboxes.filter(cb => {
      const listItem = cb.closest('li');
      return listItem !== null;
    });

    await user.click(playerCheckboxes[0]);
    await user.click(playerCheckboxes[1]);

    // Should show 2 selected in header
    await waitFor(() => {
      expect(screen.getByText(/\(2\/7/i)).toBeInTheDocument();
    });

    // Now change the line filter by clicking O-Line chip
    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    // Selection should be cleared (back to 0/7)
    await waitFor(() => {
      expect(screen.getByText(/\(0\/7\)/i)).toBeInTheDocument();
    });
  });

  it("shows all players when 'All players - No filter' is selected", async () => {
    // Create real data via API
    const team = await createTeam({ name: "Test Team" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const game = await createGame({
      competition_id: competition.id,
      opponent_name: "Rival",
      date: "2024-01-15",
    });

    // Create players
    const createdPlayers = await Promise.all(
      mockPlayers.map((p) =>
        createPlayer({
          name: p.name,
          number: p.number,
          gender: p.gender,
          team_id: team.id,
        })
      )
    );

    // Create a line
    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    const user = userEvent.setup();

    renderWithQueryClient(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
        teamId={team.id}
        players={createdPlayers}
      />
    );

    // Wait for lines to load
    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    // Click O-Line chip to filter
    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    // Should only see 4 players (2 men visible on Men tab)
    await waitFor(() => {
      expect(screen.queryByText("Henry")).not.toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    // Now click "All Players" chip to clear filter
    const allPlayersChip = screen.getByRole("button", { name: /all players/i });
    await user.click(allPlayersChip);

    // Should see all men again on Men tab
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Henry")).toBeInTheDocument();
      expect(screen.getByText("Frank")).toBeInTheDocument();
    });

    // Switch to Women tab to verify all women are back
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Eve")).toBeInTheDocument();
      expect(screen.getByText("Grace")).toBeInTheDocument();
    });
  });
});
