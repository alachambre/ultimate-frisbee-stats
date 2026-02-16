import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import StartPointDialog from "../StartPointDialog";
import {
  createTeam,
  createGame,
  createCompetition,
  getGame,
  startPoint,
  updatePoint,
  finishPoint,
  updateGame,
  createHalftime,
} from "../../../services";

describe("StartPointDialog", () => {
  it("renders with offense/defense toggle", async () => {
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    expect(screen.getByText("Create a new point")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defense/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /left endzone/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /right endzone/i })).toBeInTheDocument();
    });
  });

  it("allows toggling between offense and defense", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
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
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={onClose}
        gameId={game.id}
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
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
    await user.click(createButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("stores Side A on the first point by default", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /left endzone/i })).toHaveAttribute("aria-pressed", "true");
    });

    const createButton = screen.getByRole("button", { name: /create point/i });
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
    await user.click(createButton);

    await waitFor(async () => {
      const updatedGame = await getGame(game.id);
      expect(updatedGame.points).toHaveLength(1);
      expect(updatedGame.points[0].field_side).toBe("table_left");
    });
  });

  it("allows selecting Side B for the first point", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /right endzone/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /right endzone/i }));
    const createButton = screen.getByRole("button", { name: /create point/i });
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
    await user.click(createButton);

    await waitFor(async () => {
      const updatedGame = await getGame(game.id);
      expect(updatedGame.points).toHaveLength(1);
      expect(updatedGame.points[0].field_side).toBe("table_right");
    });
  });

  it("auto-infers side for next point from previous completed point", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    const firstPoint = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      field_side: "table_left",
    });
    await updatePoint(firstPoint.id, { status: "running" });
    await finishPoint(firstPoint.id, { won: true });

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/field side will be set automatically/i)).toBeInTheDocument();
    });
    const createButton = screen.getByRole("button", { name: /create point/i });
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
    await user.click(createButton);

    await waitFor(async () => {
      const updatedGame = await getGame(game.id);
      expect(updatedGame.points).toHaveLength(2);
      const createdPoint = updatedGame.points.find((point) => point.point_number === 2);
      expect(createdPoint?.field_side).toBe("table_right");
    });
  });

  it("requires side selection again after halftime and uses user choice", async () => {
    const user = userEvent.setup();
    const { game } = await setupGame();

    const firstPoint = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      field_side: "table_left",
    });
    await updatePoint(firstPoint.id, { status: "running" });
    await finishPoint(firstPoint.id, { won: true });
    await updateGame(game.id, { status: "started" });
    await createHalftime({
      game_id: game.id,
      halftime_timestamp: new Date(Date.parse(firstPoint.created_at) + 1000).toISOString(),
    });

    render(
      <StartPointDialog
        open={true}
        onClose={vi.fn()}
        gameId={game.id}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /left endzone/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /right endzone/i })).toBeInTheDocument();
      expect(screen.getByText(/new half/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/field side will be set automatically/i)).not.toBeInTheDocument();

    // Override inferred side (which would be right side) and force left side manually
    await user.click(screen.getByRole("button", { name: /left endzone/i }));
    const createButton = screen.getByRole("button", { name: /create point/i });
    await waitFor(() => {
      expect(createButton).toBeEnabled();
    });
    await user.click(createButton);

    await waitFor(async () => {
      const updatedGame = await getGame(game.id);
      expect(updatedGame.points).toHaveLength(2);
      const createdPoint = updatedGame.points.find((point) => point.point_number === 2);
      expect(createdPoint?.field_side).toBe("table_left");
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
