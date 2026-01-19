import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditPointDialog from "./EditPointDialog";
import type { PointWithPlayers, Player } from "../../types";
import { createTeam, createGame, createPlayer } from "../../services";
import { startPoint } from "../../services/points";

const mockPlayers: Player[] = [
  { id: 1, name: "Player 1", number: 10, team_id: 1, created_at: "2024-01-01" },
  { id: 2, name: "Player 2", number: 20, team_id: 1, created_at: "2024-01-01" },
  { id: 3, name: "Player 3", number: 30, team_id: 1, created_at: "2024-01-01" },
  { id: 4, name: "Player 4", number: 40, team_id: 1, created_at: "2024-01-01" },
  { id: 5, name: "Player 5", number: 50, team_id: 1, created_at: "2024-01-01" },
  { id: 6, name: "Player 6", number: 60, team_id: 1, created_at: "2024-01-01" },
  { id: 7, name: "Player 7", number: 70, team_id: 1, created_at: "2024-01-01" },
  { id: 8, name: "Player 8", number: 80, team_id: 1, created_at: "2024-01-01" },
];

const mockCompletedPoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 1,
  starting_on_offense: true,
  won: true,
  status: "completed",
  start_datetime: "2024-01-15T10:00:00Z",
  end_datetime: "2024-01-15T10:02:00Z",
  created_at: "2024-01-15T10:00:00Z",
  duration_seconds: 120,
  players: mockPlayers.slice(0, 7),
};

const mockActivePoint: PointWithPlayers = {
  id: 2,
  game_id: 1,
  point_number: 2,
  starting_on_offense: false,
  won: null,
  status: "active",
  start_datetime: "2024-01-15T10:05:00Z",
  end_datetime: null,
  created_at: "2024-01-15T10:05:00Z",
  players: mockPlayers.slice(0, 7),
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("EditPointDialog", () => {
  it("displays point number in title", () => {
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    expect(screen.getByText("Edit Point #1")).toBeInTheDocument();
  });

  it("initializes form with point data", () => {
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    // Check starting position
    const offenseRadio = screen.getByLabelText("On Offense") as HTMLInputElement;
    expect(offenseRadio.checked).toBe(true);

    // Check outcome for completed point
    const wonRadio = screen.getByLabelText("We won") as HTMLInputElement;
    expect(wonRadio.checked).toBe(true);
  });

  it("shows outcome radio buttons only for completed points", () => {
    const { rerender } = renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    // Completed point should show outcome
    expect(screen.getByText("Outcome")).toBeInTheDocument();
    expect(screen.getByLabelText("We won")).toBeInTheDocument();
    expect(screen.getByLabelText("They won")).toBeInTheDocument();

    // Active point should not show outcome
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <EditPointDialog
          open={true}
          onClose={vi.fn()}
          point={mockActivePoint}
          players={mockPlayers}
        />
      </QueryClientProvider>
    );

    expect(screen.queryByText("Outcome")).not.toBeInTheDocument();
  });

  it("shows end time field only for completed points", () => {
    const { rerender } = renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    // Completed point should show end time
    expect(screen.getByLabelText("End Time")).toBeInTheDocument();

    // Active point should not show end time
    rerender(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <EditPointDialog
          open={true}
          onClose={vi.fn()}
          point={mockActivePoint}
          players={mockPlayers}
        />
      </QueryClientProvider>
    );

    expect(screen.queryByLabelText("End Time")).not.toBeInTheDocument();
  });

  it("displays player selector with correct initial selection", () => {
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    // Should show player selector with count
    expect(screen.getByText("7/7 players selected")).toBeInTheDocument();

    // First 7 players should be checked
    mockPlayers.slice(0, 7).forEach((player) => {
      const checkbox = screen.getByRole("checkbox", {
        name: new RegExp(`${player.name} #${player.number}`, "i"),
      }) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    // 8th player should not be checked
    const checkbox8 = screen.getByRole("checkbox", {
      name: /Player 8 #80/i,
    }) as HTMLInputElement;
    expect(checkbox8.checked).toBe(false);
  });

  it("allows changing starting position", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    const offenseRadio = screen.getByLabelText("On Offense") as HTMLInputElement;
    const defenseRadio = screen.getByLabelText(
      "On Defense"
    ) as HTMLInputElement;

    expect(offenseRadio.checked).toBe(true);
    expect(defenseRadio.checked).toBe(false);

    await user.click(defenseRadio);

    expect(offenseRadio.checked).toBe(false);
    expect(defenseRadio.checked).toBe(true);
  });

  it("allows changing outcome for completed points", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    const wonRadio = screen.getByLabelText("We won") as HTMLInputElement;
    const lostRadio = screen.getByLabelText("They won") as HTMLInputElement;

    expect(wonRadio.checked).toBe(true);
    expect(lostRadio.checked).toBe(false);

    await user.click(lostRadio);

    expect(wonRadio.checked).toBe(false);
    expect(lostRadio.checked).toBe(true);
  });

  it("disables save button when less than 7 players selected", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeEnabled();

    // Uncheck one player
    const checkbox = screen.getByRole("checkbox", {
      name: /Player 1 #10/i,
    });
    await user.click(checkbox);

    // Save button should be disabled
    expect(saveButton).toBeDisabled();
  });

  it("shows error when end time is before start time", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    const startTimeInput = screen.getByLabelText("Start Time");
    const endTimeInput = screen.getByLabelText("End Time");

    // Set end time before start time
    await user.clear(startTimeInput);
    await user.type(startTimeInput, "2024-01-15T10:00");

    await user.clear(endTimeInput);
    await user.type(endTimeInput, "2024-01-15T09:00");

    // Should show error message
    expect(
      screen.getByText("End time must be after start time")
    ).toBeInTheDocument();

    // Save button should be disabled
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={onClose}
        point={mockCompletedPoint}
        players={mockPlayers}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onSuccess after successful update", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    // Create real test data via API to ensure MSW has the point
    const team = await createTeam({ name: "Test Team" });
    const game = await createGame({
      team_id: team.id,
      opponent_name: "Rival",
      date: "2024-01-15",
    });

    // Create 7 players
    const createdPlayers = await Promise.all(
      Array.from({ length: 7 }, (_, i) =>
        createPlayer({
          name: `Player ${i + 1}`,
          number: (i + 1) * 10,
          team_id: team.id,
        })
      )
    );

    // Create a point
    const point = await startPoint({
      game_id: game.id,
      starting_on_offense: true,
      player_ids: createdPlayers.map((p) => p.id),
    });

    renderWithQueryClient(
      <EditPointDialog
        open={true}
        onClose={vi.fn()}
        point={point}
        players={createdPlayers}
        onSuccess={onSuccess}
      />
    );

    // Change starting position
    const defenseRadio = screen.getByLabelText("On Defense");
    await user.click(defenseRadio);

    // Submit form
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Should call onSuccess after mutation completes
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
