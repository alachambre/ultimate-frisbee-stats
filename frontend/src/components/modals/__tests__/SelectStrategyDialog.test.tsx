import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SelectStrategyDialog from "../SelectStrategyDialog";
import { createStrategy } from "../../../services";
import { resetMockData } from "../../../test/mocks/handlers";
import type { PointWithPlayers } from "../../../types";

let mockOffensivePoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 1,
  starting_on_offense: true,
  won: null,
  status: "ready",
  start_datetime: null,
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  players: [],
  strategy: null,
  field_side: null,
  pull: null,
  comments: null,
  strategy_id: null,
};

let mockDefensivePoint: PointWithPlayers = {
  id: 2,
  game_id: 1,
  point_number: 2,
  starting_on_offense: false,
  won: null,
  status: "ready",
  start_datetime: null,
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  players: [],
  strategy: null,
  field_side: null,
  pull: null,
  comments: null,
  strategy_id: null,
};

let testGameId: number = 1;

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("SelectStrategyDialog", () => {
  beforeEach(async () => {
    resetMockData();

    // Create test data: team -> competition -> game -> point
    const team = await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Team" }),
    }).then(r => r.json());

    const competition = await fetch("http://localhost:8000/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: team.id,
        name: "Test Competition",
        start_date: "2024-01-01",
      }),
    }).then(r => r.json());

    const game = await fetch("http://localhost:8000/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competition_id: competition.id,
        opponent_name: "Test Opponent",
        game_datetime: "2024-01-01T00:00:00Z",
      }),
    }).then(r => r.json());

    testGameId = game.id;

    // Update mock point game_ids to match the created game
    mockOffensivePoint = {
      ...mockOffensivePoint,
      game_id: game.id,
    };
    mockDefensivePoint = {
      ...mockDefensivePoint,
      game_id: game.id,
    };

    // Create points in the mock data so we can update them
    const createdOffensivePoint = await fetch("http://localhost:8000/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game.id,
        starting_on_offense: true,
        player_ids: [],
      }),
    }).then(r => r.json());

    const createdDefensivePoint = await fetch("http://localhost:8000/points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: game.id,
        starting_on_offense: false,
        player_ids: [],
      }),
    }).then(r => r.json());

    // Update mock points with the IDs from created points
    mockOffensivePoint = { ...mockOffensivePoint, id: createdOffensivePoint.id, game_id: game.id };
    mockDefensivePoint = { ...mockDefensivePoint, id: createdDefensivePoint.id, game_id: game.id };

    // Create test strategies
    await createStrategy({
      name: "Vertical Stack",
      category: "offense",
      description: "Standard offensive formation",
    });
    await createStrategy({
      name: "Ho Stack",
      category: "offense",
      description: "Horizontal stack",
    });
    await createStrategy({
      name: "Zone Defense",
      category: "defense",
      description: "Cup zone formation",
    });
  });

  it("displays dialog title", () => {
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    expect(screen.getByText("Select Strategy")).toBeInTheDocument();
  });

  it("shows only offensive strategies for offensive point", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown to see options
    const strategySelect = screen.getByRole("combobox");
    await user.click(strategySelect);

    // Wait for strategies to load in the dropdown
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /vertical stack/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /ho stack/i })).toBeInTheDocument();
    });

    // Should NOT show defensive strategy
    expect(screen.queryByRole("option", { name: /zone defense/i })).not.toBeInTheDocument();
  });

  it("shows only defensive strategies for defensive point", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockDefensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Defense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown to see options
    const strategySelect = screen.getByRole("combobox");
    await user.click(strategySelect);

    // Wait for strategies to load in the dropdown
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /zone defense/i })).toBeInTheDocument();
    });

    // Should NOT show offensive strategies
    expect(screen.queryByRole("option", { name: /vertical stack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /ho stack/i })).not.toBeInTheDocument();
  });

  it("has 'No strategy' option", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown
    const strategySelect = screen.getByRole("combobox");
    await user.click(strategySelect);

    // Should have "No strategy" option
    await waitFor(() => {
      expect(screen.getByText("No strategy")).toBeInTheDocument();
    });
  });

  it("allows selecting a strategy", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown
    const strategySelect = screen.getByRole("combobox");
    await user.click(strategySelect);

    // Select a strategy (wait for option to be visible in menu)
    const verticalStackOption = await screen.findByRole("option", { name: /vertical stack/i });
    await user.click(verticalStackOption);

    // Save button should be enabled
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    expect(saveButton).toBeEnabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={onClose}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Select Strategy")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("saves strategy selection successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={onClose}
        point={mockOffensivePoint}
        gameId={testGameId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open and select strategy
    const strategySelect = screen.getByRole("combobox");
    await user.click(strategySelect);

    const verticalStackOption = await screen.findByRole("option", { name: /vertical stack/i });
    await user.click(verticalStackOption);

    // Click save
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
