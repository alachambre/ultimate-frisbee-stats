import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StartPointDialog from "../StartPointDialog";
import type { Player } from "../../../types";
import { createTeam, createGame, createCompetition, createPlayer } from "../../../services";

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

  describe("ABBA Gender Rule", () => {
    it("does not show mixity chip when no completed points exist", async () => {
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

      renderWithQueryClient(
        <StartPointDialog
          open={true}
          onClose={vi.fn()}
          gameId={game.id}
          teamId={team.id}
          players={createdPlayers}
        />
      );

      // Should NOT show mixity chip for first point (no requirement yet)
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
      expect(screen.queryByText(/mixity/i)).not.toBeInTheDocument();
    });

    it("allows starting first point with 4M+3W", async () => {
      const user = userEvent.setup();
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

      renderWithQueryClient(
        <StartPointDialog
          open={true}
          onClose={vi.fn()}
          gameId={game.id}
          teamId={team.id}
          players={createdPlayers}
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

      // Switch to Women tab and select 3 women
      const womenTab = screen.getByRole("tab", { name: /women/i });
      await user.click(womenTab);

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

      // Start button should be enabled
      const startButton = screen.getByRole("button", { name: /start point/i });
      await waitFor(() => {
        expect(startButton).toBeEnabled();
      });
    });

    it("allows starting first point with 3M+4W", async () => {
      const user = userEvent.setup();
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

      renderWithQueryClient(
        <StartPointDialog
          open={true}
          onClose={vi.fn()}
          gameId={game.id}
          teamId={team.id}
          players={createdPlayers}
        />
      );

      // Men tab is active by default - select 3 men
      const menCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
        const listItem = cb.closest('li');
        return listItem !== null;
      });

      for (let i = 0; i < 3; i++) {
        await user.click(menCheckboxes[i]);
      }

      // Switch to Women tab and select 4 women
      const womenTab = screen.getByRole("tab", { name: /women/i });
      await user.click(womenTab);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      const womenCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
        const listItem = cb.closest('li');
        return listItem !== null;
      });

      for (let i = 0; i < 4; i++) {
        await user.click(womenCheckboxes[i]);
      }

      // Start button should be enabled
      const startButton = screen.getByRole("button", { name: /start point/i });
      await waitFor(() => {
        expect(startButton).toBeEnabled();
      });
    });

    it("disables start button when first point has invalid gender ratio (2M+5W)", async () => {
      const user = userEvent.setup();
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

      // Create 9 players: 5 women, 4 men (to test invalid 2M+5W ratio)
      const extendedPlayers = [
        ...mockPlayers,
        { id: 9, name: "Iris", number: 90, gender: "W" as const, team_id: 1, created_at: "2024-01-01" },
      ];

      const createdPlayers = await Promise.all(
        extendedPlayers.map((p) =>
          createPlayer({
            name: p.name,
            number: p.number,
            gender: p.gender,
            team_id: team.id,
          })
        )
      );

      renderWithQueryClient(
        <StartPointDialog
          open={true}
          onClose={vi.fn()}
          gameId={game.id}
          teamId={team.id}
          players={createdPlayers}
        />
      );

      // Men tab is active by default - select 2 men
      const menCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
        const listItem = cb.closest('li');
        return listItem !== null;
      });

      for (let i = 0; i < 2; i++) {
        await user.click(menCheckboxes[i]);
      }

      // Switch to Women tab and select all 5 women
      const womenTab = screen.getByRole("tab", { name: /women/i });
      await user.click(womenTab);

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      const womenCheckboxes = screen.getAllByRole("checkbox").filter(cb => {
        const listItem = cb.closest('li');
        return listItem !== null;
      });

      // Select all 5 women
      for (let i = 0; i < 5; i++) {
        await user.click(womenCheckboxes[i]);
      }

      // Start button should be disabled (2M+5W is invalid - must be 4M+3W or 3M+4W)
      const startButton = screen.getByRole("button", { name: /start point/i });
      await waitFor(() => {
        expect(startButton).toBeDisabled();
      });

      // Should show error color in player count
      expect(screen.getByText(/2M, 5W/i)).toBeInTheDocument();
    });
  });
});
