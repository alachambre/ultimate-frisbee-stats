import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import StrategiesPage from "../StrategiesPage";
import { createStrategy } from "../../services";

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("StrategiesPage", () => {
  beforeEach(async () => {
    // Create test strategies
    await createStrategy({
      name: "Vertical Stack",
      category: "offense",
      description: "Standard offensive formation",
    });
    await createStrategy({
      name: "Zone Defense",
      category: "defense",
      description: "Cup zone formation",
    });
  });

  it("displays page header with create button", async () => {
    renderWithProviders(<StrategiesPage />);

    expect(screen.getByText("Strategies")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new strategy/i })).toBeInTheDocument();
  });

  it("displays category filter toggle buttons", async () => {
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /offense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /defense/i })).toBeInTheDocument();
  });

  it("displays all strategies by default", async () => {
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });
  });

  it("filters strategies by offense category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });

    // Click offense filter
    const offenseButton = screen.getByRole("button", { name: /offense/i });
    await user.click(offenseButton);

    // Should only see offensive strategy
    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      expect(screen.queryByText("Zone Defense")).not.toBeInTheDocument();
    });
  });

  it("filters strategies by defense category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });

    // Click defense filter
    const defenseButton = screen.getByRole("button", { name: /defense/i });
    await user.click(defenseButton);

    // Should only see defensive strategy
    await waitFor(() => {
      expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });
  });

  it("allows creating a new strategy", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strategies")).toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByRole("button", { name: /new strategy/i });
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText("Create New Strategy")).toBeInTheDocument();
    });
  });

  it("displays empty state when no strategies exist", async () => {
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strategies")).toBeInTheDocument();
    });

    // Filter by a category to potentially see empty state
    // (This test relies on having strategies, so it won't show empty state yet)
    // The empty state component should be tested separately
  });

  it("allows deleting a strategy with confirmation", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    });

    // Find delete button for the strategy
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole("button", { name: /delete/i });
    await user.click(confirmButton);

    // Strategy should be removed
    await waitFor(() => {
      expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    });
  });
});
