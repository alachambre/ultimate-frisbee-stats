import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateStrategyModal from "../CreateStrategyModal";

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("CreateStrategyModal", () => {
  it("displays all form fields", () => {
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByText("Create Strategy")).toBeInTheDocument();
    expect(screen.getByLabelText(/strategy name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("disables create button when form is incomplete", () => {
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    const createButton = screen.getByRole("button", { name: /^create$/i });
    expect(createButton).toBeDisabled();
  });

  it("enables create button when name and category are filled", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={vi.fn()} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Vertical Stack");

    // Select offense category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    const offenseOption = await screen.findByText("Offense");
    await user.click(offenseOption);

    // Button should be enabled
    await waitFor(() => {
      const createButton = screen.getByRole("button", { name: /^create$/i });
      expect(createButton).toBeEnabled();
    });
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("creates offensive strategy successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Vertical Stack");

    // Select offense category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    const offenseOption = await screen.findByText("Offense");
    await user.click(offenseOption);

    // Fill in description
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Standard offensive formation");

    // Submit
    const createButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(createButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("creates defensive strategy successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <CreateStrategyModal isOpen={true} onClose={onClose} />
    );

    // Fill in name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.type(nameInput, "Zone Defense");

    // Select defense category
    const categorySelect = screen.getByLabelText(/category/i);
    await user.click(categorySelect);
    const defenseOption = await screen.findByText("Defense");
    await user.click(defenseOption);

    // Fill in description (optional)
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Cup zone formation");

    // Submit
    const createButton = screen.getByRole("button", { name: /^create$/i });
    await user.click(createButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
