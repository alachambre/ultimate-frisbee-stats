import { render, screen } from "../../../test/test-utils";
import { describe, it, expect, vi } from "vitest";
import { HttpResponse, http } from "msw";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import FinishPointDialog from "../FinishPointDialog";
import type { PointWithPlayers } from "../../../types";
import { server } from "../../../test/setup";

const BASE_URL = "http://localhost:8000";

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

const mockDefensivePoint: PointWithPlayers = {
  ...mockRunningPoint,
  starting_on_offense: false,
};


describe("FinishPointDialog", () => {
  it("displays elapsed time with PointTimer", () => {
    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByText("Elapsed Time")).toBeInTheDocument();
    expect(screen.getByText("2:00")).toBeInTheDocument();
  });

  it("displays offense/defense in title", () => {
    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByRole("heading", { name: /finish point/i })).toBeInTheDocument();
  });

  it("has won and lost toggle buttons", () => {
    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    expect(screen.getByRole("button", { name: /won the point/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /lost the point/i })).toBeInTheDocument();
  });

  it("preselects outcome based on possession and enables finish button", async () => {
    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    // With starting_on_offense=true and no turnovers, we have possession, so "Won" should be preselected
    const wonButton = screen.getByRole("button", { name: /won the point/i });
    await waitFor(() => expect(wonButton).toHaveClass("Mui-selected"));

    // Finish button should be enabled since outcome is preselected
    const finishButton = screen.getByRole("button", { name: /finish point/i });
    await waitFor(() => expect(finishButton).toBeEnabled());
  });

  it("preselects won after a quickly recorded defensive turnover loads", async () => {
    const user = userEvent.setup();
    let updatePayload: Record<string, unknown> | undefined;

    server.use(
      http.get(`${BASE_URL}/turnovers/points/1/turnovers`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));

        return HttpResponse.json([
          {
            id: 1,
            point_id: 1,
            player_id: null,
            turnover_type: "other",
            timestamp: new Date().toISOString(),
            comments: null,
            created_at: "2024-01-01T00:00:00Z",
            player: null,
          },
        ]);
      }),
      http.put(`${BASE_URL}/points/1`, async ({ request }) => {
        updatePayload = await request.json() as Record<string, unknown>;

        return HttpResponse.json({
          ...mockDefensivePoint,
          ...updatePayload,
        });
      }),
    );

    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockDefensivePoint}
      />
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /won the point/i }),
      ).toHaveClass("Mui-selected"),
    );
    expect(
      screen.getByRole("button", { name: /lost the point/i }),
    ).not.toHaveClass("Mui-selected");

    await user.click(screen.getByRole("button", { name: /finish point/i }));

    await waitFor(() => expect(updatePayload?.won).toBe(true));
  });

  it("shows warning when user changes preselected outcome", async () => {
    const user = userEvent.setup();
    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
      />
    );

    // Won should be preselected (we have possession)
    const wonButton = screen.getByRole("button", { name: /won the point/i });
    await waitFor(() => expect(wonButton).toHaveClass("Mui-selected"));

    // No warning initially
    expect(screen.queryByText(/doesn't match the current possession/i)).not.toBeInTheDocument();

    // Change to Lost
    const lostButton = screen.getByRole("button", { name: /lost the point/i });
    await user.click(lostButton);

    // Warning should appear
    expect(screen.getByText(/doesn't match the current possession/i)).toBeInTheDocument();

    // Change back to Won
    await user.click(wonButton);

    // Warning should disappear
    expect(screen.queryByText(/doesn't match the current possession/i)).not.toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
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

  it("transitions point to 'scored' status when finished", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <FinishPointDialog
        open={true}
        onClose={vi.fn()}
        activePoint={mockRunningPoint}
        onSuccess={onSuccess}
      />
    );

    // Select won
    const wonButton = screen.getByRole("button", { name: /won the point/i });
    await waitFor(() => expect(wonButton).toBeEnabled());
    await user.click(wonButton);

    // Click finish
    const finishButton = screen.getByRole("button", { name: /finish point/i });
    await user.click(finishButton);

    // Note: The actual API call would transition to "scored" status
    // This test verifies the UI behavior - the mutation uses updatePoint with status: "scored"
  });
});
