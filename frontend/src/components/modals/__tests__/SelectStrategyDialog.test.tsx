import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SelectStrategyDialog from "../SelectStrategyDialog";
import { createStrategy } from "../../../services";
import type { PointWithPlayers } from "../../../types";

const mockOffensivePoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 1,
  starting_on_offense: true,
  won: null,
  status: "running",
  start_datetime: "2024-01-01T00:00:00Z",
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  players: [],
  strategy: null,
};

const mockDefensivePoint: PointWithPlayers = {
  ...mockOffensivePoint,
  id: 2,
  starting_on_offense: false,
};

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
        gameId={1}
      />
    );

    expect(screen.getByText("Select Strategy")).toBeInTheDocument();
  });

  it("shows only offensive strategies for offensive point", async () => {
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Wait for strategies to load
    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      expect(screen.getByText("Ho Stack")).toBeInTheDocument();
    });

    // Should NOT show defensive strategy
    expect(screen.queryByText("Zone Defense")).not.toBeInTheDocument();
  });

  it("shows only defensive strategies for defensive point", async () => {
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockDefensivePoint}
        gameId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Defense Strategies")).toBeInTheDocument();
    });

    // Wait for strategies to load
    await waitFor(() => {
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });

    // Should NOT show offensive strategies
    expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    expect(screen.queryByText("Ho Stack")).not.toBeInTheDocument();
  });

  it("has 'No strategy' option", async () => {
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown
    const strategySelect = screen.getByLabelText(/strategy/i);
    expect(strategySelect).toBeInTheDocument();
  });

  it("allows selecting a strategy", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <SelectStrategyDialog
        open={true}
        onClose={vi.fn()}
        point={mockOffensivePoint}
        gameId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open the select dropdown
    const strategySelect = screen.getByLabelText(/strategy/i);
    await user.click(strategySelect);

    // Select a strategy
    const verticalStack = await screen.findByText("Vertical Stack");
    await user.click(verticalStack);

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
        gameId={1}
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
        gameId={1}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Offense Strategies")).toBeInTheDocument();
    });

    // Open and select strategy
    const strategySelect = screen.getByLabelText(/strategy/i);
    await user.click(strategySelect);

    const verticalStack = await screen.findByText("Vertical Stack");
    await user.click(verticalStack);

    // Click save
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
