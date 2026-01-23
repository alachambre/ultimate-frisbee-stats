import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FinishPointDialog from "../FinishPointDialog";
import type { PointWithPlayers } from "../../../types";

const mockRunningPoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 1,
  starting_on_offense: true,
  won: null,
  status: "running",
  start_datetime: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
  end_datetime: null,
  created_at: "2024-01-01T00:00:00Z",
  players: [
    { id: 1, name: "Player 1", number: 10, gender: "M", team_id: 1, created_at: "2024-01-01" },
    { id: 2, name: "Player 2", number: 20, gender: "M", team_id: 1, created_at: "2024-01-01" },
    { id: 3, name: "Player 3", number: null, gender: "M", team_id: 1, created_at: "2024-01-01" },
  ],
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("FinishPointDialog", () => {
  it("displays elapsed time with PointTimer", () => {
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByText("Elapsed Time")).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("displays starting position chip", () => {
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByText("On Offense (we had the disc)")).toBeInTheDocument();
  });

  it("displays all players as chips", () => {
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByText("Player 1 #10")).toBeInTheDocument();
    expect(screen.getByText("Player 2 #20")).toBeInTheDocument();
    expect(screen.getByText("Player 3")).toBeInTheDocument();
  });

  it("has won and lost radio buttons", () => {
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByLabelText("We won the point")).toBeInTheDocument();
    expect(screen.getByLabelText("They won the point")).toBeInTheDocument();
  });

  it("enables finish button only when outcome is selected", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    const finishButton = screen.getByRole("button", { name: /finish point/i });
    expect(finishButton).toBeDisabled();

    const wonRadio = screen.getByLabelText("We won the point");
    await user.click(wonRadio);

    expect(finishButton).toBeEnabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <FinishPointDialog
        open={true}
        onClose={onClose}
        activePoint={mockRunningPoint}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
