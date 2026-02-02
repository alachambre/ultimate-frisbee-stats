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

    expect(screen.getByText("Create a new point")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defense/i })).toBeInTheDocument();
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
