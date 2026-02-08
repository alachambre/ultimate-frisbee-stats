import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecordStoppageDialog } from "../RecordStoppageDialog";
import type { PointWithPlayers } from "../../../types";

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
  players: [],
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

describe("RecordStoppageDialog", () => {
  it("renders dialog with title when open", () => {
    renderWithQueryClient(
      <RecordStoppageDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
      />
    );

    expect(screen.getByText("Record stoppage")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithQueryClient(
      <RecordStoppageDialog
        open={false}
        onClose={vi.fn()}
        point={mockPoint}
      />
    );

    expect(screen.queryByText("Record stoppage")).not.toBeInTheDocument();
  });

  it("shows comments text field", () => {
    renderWithQueryClient(
      <RecordStoppageDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
      />
    );

    expect(screen.getByLabelText(/comments/i)).toBeInTheDocument();
  });

  it("shows stoppage type buttons", () => {
    renderWithQueryClient(
      <RecordStoppageDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
      />
    );

    expect(screen.getByRole("group", { name: /type/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /call/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /injury/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /timeout/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /other/i })).toBeInTheDocument();
  });

  it("has cancel and record buttons", () => {
    renderWithQueryClient(
      <RecordStoppageDialog
        open={true}
        onClose={vi.fn()}
        point={mockPoint}
      />
    );

    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /record/i })).toBeInTheDocument();
  });

  it("successfully records a call", async () => {
    const onClose = vi.fn();

    renderWithQueryClient(
      <RecordStoppageDialog
        open={true}
        onClose={onClose}
        point={mockPoint}
      />
    );

    const recordButton = screen.getByRole("button", { name: /record/i });
    recordButton.click();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
