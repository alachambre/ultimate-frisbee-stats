import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddPlayerModal from "../AddPlayerModal";

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("AddPlayerModal", () => {
  it("displays form when modal is open", () => {
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    expect(screen.getByRole("heading", { name: /add player/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/player name/i)).toBeInTheDocument();
    expect(screen.getByText("Gender")).toBeInTheDocument();
  });

  it("does not display form when modal is closed", () => {
    renderWithQueryClient(
      <AddPlayerModal isOpen={false} onClose={vi.fn()} teamId={1} />
    );

    expect(screen.queryByText("Add Player")).not.toBeInTheDocument();
  });

  it("initializes form with default values", () => {
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    const nameInput = screen.getByLabelText(/player name/i) as HTMLInputElement;
    const numberInput = screen.getByLabelText(/jersey number/i) as HTMLInputElement;
    const buttons = screen.getAllByRole("button");
    const manButton = buttons.find(btn => btn.getAttribute("value") === "M");

    expect(nameInput.value).toBe("");
    expect(numberInput.value).toBe("");
    expect(manButton).toHaveAttribute("aria-pressed", "true"); // Default gender is M
  });

  it("disables add button when name is empty", () => {
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    const addButton = screen.getByRole("button", { name: /add player/i });
    expect(addButton).toBeDisabled();
  });

  it("enables add button when name is filled", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    const addButton = screen.getByRole("button", { name: /add player/i });

    await user.type(nameInput, "John");

    expect(addButton).toBeEnabled();
  });

  it("allows changing gender selection", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    const buttons = screen.getAllByRole("button");
    const manButton = buttons.find(btn => btn.getAttribute("value") === "M");
    const womanButton = buttons.find(btn => btn.getAttribute("value") === "W");

    expect(manButton).toHaveAttribute("aria-pressed", "true");

    await user.click(womanButton!);

    expect(womanButton).toHaveAttribute("aria-pressed", "true");
    expect(manButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={onClose} teamId={1} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("submits form with player data", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <AddPlayerModal isOpen={true} onClose={vi.fn()} teamId={1} />
    );

    const nameInput = screen.getByLabelText(/player name/i);
    const addButton = screen.getByRole("button", { name: /add player/i });

    await user.type(nameInput, "Alice");
    await user.click(addButton);

    // Form should attempt to submit
    expect(addButton).toBeDisabled();
  });
});
