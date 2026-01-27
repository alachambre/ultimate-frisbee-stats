import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PointPlayerSelection from "../PointPlayerSelection";
import type { Player } from "../../../types";
import { createTeam, createPlayer } from "../../../services";
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

describe("PointPlayerSelection", () => {
  it("displays offense/defense toggle buttons", () => {
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[]}
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    expect(screen.getByRole("button", { name: /on offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /on defense/i })).toBeInTheDocument();
  });

  it("toggles between offense and defense", async () => {
    const user = userEvent.setup();
    const onStartingOnOffenseChange = vi.fn();

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[]}
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={onStartingOnOffenseChange}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    const defenseButton = screen.getByRole("button", { name: /on defense/i });
    await user.click(defenseButton);

    expect(onStartingOnOffenseChange).toHaveBeenCalledWith(false);
  });

  it("displays player selector with all players", () => {
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[]}
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    // Men tab is active by default
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("displays player count header with gender breakdown", () => {
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[2, 3, 4]} // 2 men, 1 woman
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    // Should show count with gender breakdown
    expect(screen.getByText(/\(3\/7/i)).toBeInTheDocument();
    expect(screen.getByText(/2M, 1W/i)).toBeInTheDocument();
  });

  it("displays line filter when lines exist", async () => {
    const team = await createTeam({ name: "Test Team" });
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

    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={team.id}
        players={createdPlayers}
        selectedPlayerIds={[]}
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /all players/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "O-Line" })).toBeInTheDocument();
    });
  });

  it("filters players when line is selected", async () => {
    const team = await createTeam({ name: "Test Team" });
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

    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    const user = userEvent.setup();
    const onSelectedLineIdChange = vi.fn();

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={team.id}
        players={createdPlayers}
        selectedPlayerIds={[]}
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={onSelectedLineIdChange}
        open={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    expect(onSelectedLineIdChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it("clears selected players when line changes if clearPlayersOnLineChange=true", async () => {
    const team = await createTeam({ name: "Test Team" });
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

    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    const user = userEvent.setup();
    const onSelectedPlayerIdsChange = vi.fn();

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={team.id}
        players={createdPlayers}
        selectedPlayerIds={[createdPlayers[0].id, createdPlayers[1].id]}
        onSelectedPlayerIdsChange={onSelectedPlayerIdsChange}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
        clearPlayersOnLineChange={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    // Should clear selected players
    expect(onSelectedPlayerIdsChange).toHaveBeenCalledWith([]);
  });

  it("does not clear selected players when line changes if clearPlayersOnLineChange=false", async () => {
    const team = await createTeam({ name: "Test Team" });
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

    const line = await createLine({
      team_id: team.id,
      name: "O-Line",
      description: "Offensive line",
    });

    await addPlayersToLine(line.id, createdPlayers.slice(0, 4).map((p) => p.id));

    const user = userEvent.setup();
    const onSelectedPlayerIdsChange = vi.fn();

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={team.id}
        players={createdPlayers}
        selectedPlayerIds={[createdPlayers[0].id, createdPlayers[1].id]}
        onSelectedPlayerIdsChange={onSelectedPlayerIdsChange}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
        clearPlayersOnLineChange={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/filter by line \(optional\)/i)).toBeInTheDocument();
    });

    const oLineChip = screen.getByRole("button", { name: "O-Line" });
    await user.click(oLineChip);

    // Should NOT clear selected players
    expect(onSelectedPlayerIdsChange).not.toHaveBeenCalled();
  });

  it("shows success color when 7 players selected with valid gender ratio", () => {
    // IDs: 2,3,6,8 (4 men: Bob, Charlie, Frank, Henry) + 1,4,5 (3 women: Alice, Diana, Eve)
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[1, 2, 3, 4, 5, 6, 8]} // 4M+3W
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
        showGenderValidation={true}
      />
    );

    // Should show success color and checkmark
    const countText = screen.getByText(/4M, 3W/i);
    expect(countText).toBeInTheDocument();
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });

  it("shows error color when 7 players selected with invalid gender ratio", () => {
    // 2M+5W (invalid)
    const extendedPlayers = [
      ...mockPlayers,
      { id: 9, name: "Iris", number: 90, gender: "W" as const, team_id: 1, created_at: "2024-01-01" },
    ];

    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={extendedPlayers}
        selectedPlayerIds={[1, 2, 3, 4, 5, 7, 9]} // 2M+5W
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
        showGenderValidation={true}
      />
    );

    // Should show error color (no checkmark)
    const countText = screen.getByText(/2M, 5W/i);
    expect(countText).toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
  });

  it("validates against required gender ratio when provided", () => {
    // IDs: 2,3,6,8 (4 men: Bob, Charlie, Frank, Henry) + 1,4,5 (3 women: Alice, Diana, Eve)
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[1, 2, 3, 4, 5, 6, 8]} // 4M+3W
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
        showGenderValidation={true}
        requiredGenderRatio={{ men: 3, women: 4 }} // Requires 3M+4W but we have 4M+3W
      />
    );

    // Should show error (wrong ratio)
    const countText = screen.getByText(/4M, 3W/i);
    expect(countText).toBeInTheDocument();
    expect(screen.queryByText(/✓/)).not.toBeInTheDocument();
  });

  it("shows warning color when less than 7 players selected", () => {
    renderWithQueryClient(
      <PointPlayerSelection
        teamId={1}
        players={mockPlayers}
        selectedPlayerIds={[1, 2, 3]} // Only 3 players
        onSelectedPlayerIdsChange={vi.fn()}
        startingOnOffense={true}
        onStartingOnOffenseChange={vi.fn()}
        selectedLineId=""
        onSelectedLineIdChange={vi.fn()}
        open={true}
      />
    );

    // Should show warning color
    const countText = screen.getByText(/\(3\/7/i);
    expect(countText).toBeInTheDocument();
  });
});
