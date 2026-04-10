import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { RecordTurnoverDialog } from "../RecordTurnoverDialog";
import type { PointWithPlayers, Player, TurnoverWithPlayer } from "../../../types";

const mockPlayers: Player[] = [
  { id: 1, name: "Alice", number: 10, gender: "W", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 2, name: "Bob", number: 20, gender: "M", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: 3, name: "Charlie", number: 30, gender: "M", team_id: 1, created_at: "2024-01-01T00:00:00Z" },
];

const mockPoint: PointWithPlayers = {
  id: 1,
  game_id: 1,
  point_number: 1,
  starting_on_offense: true,
  won: null,
  field_side: null,
  pull: true,
  strategy_id: null,
  comments: null,
  start_datetime: "2024-01-01T10:00:00Z",
  end_datetime: null,
  status: "running",
  created_at: "2024-01-01T10:00:00Z",
  players: mockPlayers,
  strategy: null,
  duration_seconds: null,
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("RecordTurnoverDialog", () => {
  it("renders dialog with title when open", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByText("Record Turnover")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={false}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.queryByText("Record Turnover")).not.toBeInTheDocument();
  });

  it("shows possession indicator", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByText(/possession/i)).toBeInTheDocument();
  });

  it("shows possession indicator when we have possession", async () => {
    const offensivePoint = { ...mockPoint, starting_on_offense: true };

    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={offensivePoint}
        existingTurnovers={[]}
      />
    );

    // Should show possession indicator showing we have the disc
    await waitFor(() => {
      expect(screen.getByText(/possession/i)).toBeInTheDocument();
      expect(screen.getByText(/we have.*disc/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("shows possession indicator when they have possession", () => {
    const defensivePoint = { ...mockPoint, starting_on_offense: false };

    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={defensivePoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByText(/possession/i)).toBeInTheDocument();
    expect(screen.getByText(/they have.*disc/i)).toBeInTheDocument();
  });

  it("shows comments text field", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByLabelText(/comments/i)).toBeInTheDocument();
  });

  it("defaults turnover type to other", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByText(/turnover type/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defended pass/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /stall out/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /other/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /record/i })).toBeEnabled();
  });

  it("has cancel and record buttons", () => {
    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /record/i })).toBeInTheDocument();
  });

  it("successfully records a turnover", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={onClose}
        point={mockPoint}
        existingTurnovers={[]}
      />
    );

    const recordButton = screen.getByRole("button", { name: /record/i });
    await user.click(recordButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("alternates possession with multiple turnovers", () => {
    const existingTurnovers: TurnoverWithPlayer[] = [
      {
        id: 1,
        point_id: 1,
        player_id: 1,
        turnover_type: "other",
        timestamp: "2024-01-01T10:02:00Z",
        comments: null,
        created_at: "2024-01-01T10:02:00Z",
        player: mockPlayers[0],
      },
    ];

    const offensivePoint = { ...mockPoint, starting_on_offense: true };

    renderWithQueryClient(
      <RecordTurnoverDialog
        open={true}
        onClose={vi.fn()}
        point={offensivePoint}
        existingTurnovers={existingTurnovers}
      />
    );

    // After one turnover on offense, they should have possession
    expect(screen.getByText(/they have.*disc/i)).toBeInTheDocument();
  });
});
