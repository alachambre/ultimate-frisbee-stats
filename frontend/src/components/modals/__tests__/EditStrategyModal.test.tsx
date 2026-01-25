import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditStrategyModal from "../EditStrategyModal";
import type { Strategy } from "../../../types";

const mockStrategy: Strategy = {
  id: 1,
  name: "Vertical Stack",
  category: "offense",
  description: "Standard offensive formation",
  created_at: "2024-01-01T00:00:00Z",
};

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("EditStrategyModal", () => {
  it("displays all form fields with existing values", () => {
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    expect(screen.getByText("Edit Strategy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Vertical Stack")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Standard offensive formation")).toBeInTheDocument();
  });

  it("has offense category selected for offensive strategy", () => {
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    const offenseButton = screen.getByRole("button", { name: /offense/i });
    expect(offenseButton).toHaveAttribute("aria-pressed", "true");
  });

  it("allows editing strategy name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Ho Stack");

    expect(screen.getByDisplayValue("Ho Stack")).toBeInTheDocument();
  });

  it("allows changing category from offense to defense", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    const defenseButton = screen.getByRole("button", { name: /defense/i });
    await user.click(defenseButton);

    expect(defenseButton).toHaveAttribute("aria-pressed", "true");
  });

  it("allows editing description", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated formation");

    expect(screen.getByDisplayValue("Updated formation")).toBeInTheDocument();
  });

  it("disables save button when name is empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={vi.fn()}
        strategy={mockStrategy}
      />
    );

    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.clear(nameInput);

    const saveButton = screen.getByRole("button", { name: /^save$/i });
    expect(saveButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={onClose}
        strategy={mockStrategy}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("saves changes successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <EditStrategyModal
        isOpen={true}
        onClose={onClose}
        strategy={mockStrategy}
      />
    );

    // Edit name
    const nameInput = screen.getByLabelText(/strategy name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Ho Stack");

    // Submit
    const saveButton = screen.getByRole("button", { name: /^save$/i });
    await user.click(saveButton);

    // Should close the modal
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
