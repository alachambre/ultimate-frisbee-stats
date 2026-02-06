import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditPlayerModal from "../EditPlayerModal";
import type { Player } from "../../../types";

const mockPlayer: Player = {
  id: 1,
  name: "Alice",
  number: 42,
  gender: "W",
  team_id: 1,
  created_at: "2024-01-01",
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("EditPlayerModal", () => {
  it("displays form with player data when modal is open", () => {
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    expect(screen.getByText("Edit Player")).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/player name/i) as HTMLInputElement;
    const numberInput = screen.getByLabelText(/jersey number/i) as HTMLInputElement;

    expect(nameInput.value).toBe("Alice");
    expect(numberInput.value).toBe("42");
  });

  it("does not display form when modal is closed", () => {
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={false}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    expect(screen.queryByText("Edit Player")).not.toBeInTheDocument();
  });

  it("shows correct gender selected from player data", () => {
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const womanButton = screen.getByRole("button", { name: /woman/i });
    expect(womanButton).toHaveAttribute("aria-pressed", "true");
  });

  it("allows editing player name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Bob");

    expect((nameInput as HTMLInputElement).value).toBe("Bob");
  });

  it("allows changing gender", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const buttons = screen.getAllByRole("button");
    const manButton = buttons.find(btn => btn.getAttribute("value") === "M");
    await user.click(manButton!);

    expect(manButton).toHaveAttribute("aria-pressed", "true");
  });

  it("disables save button when name is empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await user.clear(nameInput);

    expect(saveButton).toBeDisabled();
  });

  it("shows delete button", () => {
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    expect(screen.getByRole("button", { name: /delete player/i })).toBeInTheDocument();
  });

  it("shows delete confirmation dialog when delete is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete player/i });
    await user.click(deleteButton);

    expect(screen.getByText("Delete Player?")).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to remove Alice/i)).toBeInTheDocument();
  });

  it("can cancel delete confirmation", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const deleteButton = screen.getByRole("button", { name: /delete player/i });
    await user.click(deleteButton);

    const cancelButton = screen.getAllByRole("button", { name: /cancel/i })[0];
    await user.click(cancelButton);

    // Should go back to edit form
    expect(screen.getByText("Edit Player")).toBeInTheDocument();
    expect(screen.queryByText("Delete Player?")).not.toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={onClose}
        player={mockPlayer}
        teamId={1}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("resets form values from player prop when reopened", () => {
    const { unmount } = renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const nameInput = screen.getByLabelText(/player name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Alice");

    // Unmount and remount to simulate close/reopen
    unmount();

    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
      />
    );

    const reopenedInput = screen.getByLabelText(/player name/i) as HTMLInputElement;
    expect(reopenedInput.value).toBe("Alice");
  });

  it("handles player with no number", () => {
    const playerWithoutNumber: Player = {
      ...mockPlayer,
      number: null,
    };

    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={playerWithoutNumber}
        teamId={1}
      />
    );

    const numberInput = screen.getByLabelText(/jersey number/i) as HTMLInputElement;
    expect(numberInput.value).toBe("");
  });

  it("calls onViewStatistics when clicking view statistics button", async () => {
    const user = userEvent.setup();
    const onViewStatistics = vi.fn();

    renderWithQueryClient(
      <EditPlayerModal
        isOpen={true}
        onClose={vi.fn()}
        player={mockPlayer}
        teamId={1}
        onViewStatistics={onViewStatistics}
      />
    );

    const viewStatsButton = screen.getByRole("button", { name: /view statistics/i });
    await user.click(viewStatsButton);

    expect(onViewStatistics).toHaveBeenCalledWith(mockPlayer);
  });
});
