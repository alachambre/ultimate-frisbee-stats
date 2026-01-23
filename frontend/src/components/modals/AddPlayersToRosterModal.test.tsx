import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddPlayersToRosterModal from "./AddPlayersToRosterModal";
import { createTeam, createPlayer, createCompetition } from "../../services";

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("AddPlayersToRosterModal", () => {
  let teamId: number;
  let competitionId: number;

  beforeEach(async () => {
    // Create a test team, competition, and add players to the team
    const team = await createTeam({ name: "Test Team" });
    teamId = team.id;
    const competition = await createCompetition({
      team_id: teamId,
      name: "Test Competition",
      description: "Test",
      start_date: "2024-06-01",
      end_date: "2024-06-30",
    });
    competitionId = competition.id;
    await createPlayer({ team_id: teamId, name: "Player One", number: 10, gender: "M" });
    await createPlayer({ team_id: teamId, name: "Player Two", number: 20, gender: "W" });
    await createPlayer({ team_id: teamId, name: "Player Three", number: 30, gender: "M" });
  });

  it("displays available players from the team", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    // Wait for players to load - they load asynchronously
    // Men tab is active by default, so Player One and Player Three should be visible
    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("Player Three")).toBeInTheDocument();

    // Click on Women tab to see Player Two
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    await waitFor(() => {
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });
  });

  it("filters out players already in the roster", async () => {
    const user = userEvent.setup();
    // Assume Player One has ID 1 (first player created in beforeEach)
    const player1Id = 1;

    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[player1Id]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    // Wait for players to load - Men tab is active by default
    await waitFor(() => {
      expect(screen.getByText("Player Three")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Player One should not be visible (already in roster)
    expect(screen.queryByText("Player One")).not.toBeInTheDocument();

    // Click on Women tab to see Player Two
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    // Player Two should be visible
    await waitFor(() => {
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });
  });

  it("shows message when all players are already in roster", async () => {
    // Assume all three players have IDs 1, 2, 3 (created in beforeEach)
    const allPlayerIds = [1, 2, 3];

    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={allPlayerIds}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText("All team players are already in the roster")
      ).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("allows selecting players with checkboxes", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    // Wait for players to load
    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Submit button should be disabled initially
    const submitButton = screen.getByRole("button", { name: /add 0 player/i });
    expect(submitButton).toBeDisabled();

    // Select Player One by clicking on the player name (which triggers the ListItemButton)
    const player1 = screen.getByText("Player One");
    await user.click(player1);

    // Submit button should show "Add 1 Player"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add 1 player$/i })).toBeInTheDocument();
    });

    // Click on Women tab to see Player Two
    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    // Wait for Player Two to be visible
    await waitFor(() => {
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });

    // Select Player Two
    const player2 = screen.getByText("Player Two");
    await user.click(player2);

    // Submit button should show "Add 2 Players"
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add 2 players/i })).toBeInTheDocument();
    });
  });

  it("disables submit button when no players are selected", async () => {
    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /add 0 player/i });
    expect(submitButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={onClose}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("adds selected players successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={onClose}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Add Players to Roster")).toBeInTheDocument();
    });

    // Wait for players to load
    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select a player by clicking on the player name
    const player1 = screen.getByText("Player One");
    await user.click(player1);

    // Click submit
    const submitButton = await screen.findByRole("button", { name: /add 1 player$/i });
    await user.click(submitButton);

    // onClose should be called after successful addition
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
