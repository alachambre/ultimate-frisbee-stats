import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import StartPointDialog from "../StartPointDialog";
import { createTeam, createGame, createCompetition } from "../../../services";

describe("StartPointDialog", () => {
  it("renders with offense/defense toggle", () => {
    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
      />
    );

    expect(screen.getByText("Start New Point")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defense/i })).toBeInTheDocument();
  });

  it("shows info message about player selection", () => {
    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
      />
    );

    expect(screen.getByText(/players can be selected after creating the point/i)).toBeInTheDocument();
  });

  it("allows toggling between offense and defense", async () => {
    const user = userEvent.setup();
    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={1}
      />
    );

    const offenseButton = screen.getByRole("button", { name: /offense/i });
    const defenseButton = screen.getByRole("button", { name: /defense/i });

    // Offense is selected by default
    expect(offenseButton).toHaveAttribute("aria-pressed", "true");

    // Click defense
    await user.click(defenseButton);
    expect(defenseButton).toHaveAttribute("aria-pressed", "true");
    expect(offenseButton).toHaveAttribute("aria-pressed", "false");

    // Click offense again
    await user.click(offenseButton);
    expect(offenseButton).toHaveAttribute("aria-pressed", "true");
    expect(defenseButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <StartPointDialog
        open={true}
        onClose={onClose}
        gameId={1}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("creates point with ready status when submitted", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
        onSuccess={onSuccess}
      />
    );

    const createButton = screen.getByRole("button", { name: /create point/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("preselects offense based on previous point result (won = start on defense)", async () => {
    const { game } = await setupGameWithCompletedPoints();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    await waitFor(() => {
      const defenseButton = screen.getByRole("button", { name: /defense/i });
      // Since last point was won, we should start on defense
      expect(defenseButton).toHaveAttribute("aria-pressed", "true");
    });
  });

  it("shows loading state while creating point", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    const createButton = screen.getByRole("button", { name: /create point/i });
    await user.click(createButton);

    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /creating/i })).toBeInTheDocument();
    });
  });
});

// Helper functions
async function setupGame() {
  const team = await createTeam({ name: "Test Team" });
  const competition = await createCompetition({
    name: "Test Competition",
    team_id: team.id,
    start_date: "2024-01-01",
    end_date: "2024-01-07",
  });
  const game = await createGame({
    competition_id: competition.id,
    opponent_name: "Opponent",
  });
  return { team, competition, game };
}

async function setupGameWithCompletedPoints() {
  const { team, competition, game } = await setupGame();
  // Mock implementation would need to create completed points
  // For now, just return the game
  return { team, competition, game };
}
