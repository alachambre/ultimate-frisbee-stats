import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CompletePointDialog from "../CompletePointDialog";
import type { PointWithPlayers } from "../../../types";

const mockPoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 3,
  starting_on_offense: true,
  field_side: null,
  pull: null,
  comments: null,
  strategy_id: 1,
  won: true,
  status: "scored",
  start_datetime: "2024-01-15T10:00:00Z",
  end_datetime: "2024-01-15T10:02:30Z",
  created_at: "2024-01-15T10:00:00Z",
  players: [
    { id: 1, name: "Alice", number: 1, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 2, name: "Bob", number: 2, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 3, name: "Charlie", number: 3, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 4, name: "Diana", number: 4, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 5, name: "Eve", number: 5, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 6, name: "Frank", number: 6, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
    { id: 7, name: "Grace", number: 7, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  ],
  strategy: {
    id: 1,
    name: "Vertical Stack",
    description: "Standard vertical offense",
    category: "offense",
    created_at: "2024-01-15T09:00:00Z",
  },
};

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("CompletePointDialog", () => {
  it("displays point summary correctly", () => {
    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={mockPoint}
      />
    );

    expect(screen.getByRole("heading", { name: "Complete Point" })).toBeInTheDocument();
    expect(screen.getByText("Point #3")).toBeInTheDocument();
    expect(screen.getByText("Started on Offense")).toBeInTheDocument();
    expect(screen.getByText("Won")).toBeInTheDocument();
  });

  it("displays strategy when present", () => {
    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={mockPoint}
      />
    );

    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
  });

  it("does not display strategy section when strategy is null", () => {
    const pointWithoutStrategy = { ...mockPoint, strategy: null, strategy_id: null };

    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={pointWithoutStrategy}
      />
    );

    expect(screen.queryByText("Strategy")).not.toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={onClose}
        scoredPoint={mockPoint}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("displays defensive point correctly", () => {
    const defensivePoint = { ...mockPoint, starting_on_offense: false };

    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={defensivePoint}
      />
    );

    expect(screen.getByText("Started on Defense")).toBeInTheDocument();
  });

  it("displays lost point correctly", () => {
    const lostPoint = { ...mockPoint, won: false };

    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={lostPoint}
      />
    );

    expect(screen.getByText("Lost")).toBeInTheDocument();
  });

  it("has complete and cancel buttons", () => {
    renderWithQueryClient(
      <CompletePointDialog
        open={true}
        onClose={vi.fn()}
        scoredPoint={mockPoint}
      />
    );

    expect(screen.getByRole("button", { name: /complete point/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
