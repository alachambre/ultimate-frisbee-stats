import { render, screen, waitFor } from "../../test/test-utils";
import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import StrategiesPage from "../StrategiesPage";
import { createStrategy } from "../../services";
import { resetMockData } from "../../test/mocks/handlers";

describe("StrategiesPage", () => {
  beforeEach(async () => {
    resetMockData();
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
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strategies")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /new strategy/i })).toBeInTheDocument();
  });

  it("displays category filter toggle buttons", async () => {
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /offense strategies/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /defense strategies/i })).toBeInTheDocument();
  });

  it("displays offense strategies by default", async () => {
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    });

    // Defense strategy should not be visible by default
    expect(screen.queryByText("Zone Defense")).not.toBeInTheDocument();
  });

  it("filters strategies by offense category", async () => {
    render(<StrategiesPage />);

    // Offense is selected by default, should only see offensive strategy
    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    });

    expect(screen.queryByText("Zone Defense")).not.toBeInTheDocument();
  });

  it("filters strategies by defense category", async () => {
    const user = userEvent.setup();
    render(<StrategiesPage />);

    // Initially shows offense strategy
    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    });

    // Click defense filter
    const defenseButton = screen.getByRole("button", { name: /defense strategies/i });
    await user.click(defenseButton);

    // Should only see defensive strategy
    await waitFor(() => {
      expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
      expect(screen.getByText("Zone Defense")).toBeInTheDocument();
    });
  });

  it("allows creating a new strategy", async () => {
    const user = userEvent.setup();
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strategies")).toBeInTheDocument();
    });

    // Click create button
    const createButton = screen.getByRole("button", { name: /new strategy/i });
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText("Create Strategy")).toBeInTheDocument();
    });
  });

  it("displays empty state when no strategies exist", async () => {
    resetMockData();
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Strategies")).toBeInTheDocument();
    });

    // Should show empty state
    await waitFor(() => {
      expect(screen.getByText(/no strategies yet/i)).toBeInTheDocument();
    });
  });

  it("allows deleting a strategy with confirmation", async () => {
    const user = userEvent.setup();
    render(<StrategiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Vertical Stack")).toBeInTheDocument();
    });

    // Find all delete icon buttons (they don't have aria-labels)
    const deleteButtons = screen.getAllByTestId("DeleteIcon").map(icon => icon.closest("button")).filter(Boolean);
    await user.click(deleteButtons[0]!);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Confirm deletion - find the "Delete" button in the dialog (not the icon buttons)
    const confirmButton = screen.getByRole("button", { name: /^delete$/i });
    await user.click(confirmButton);

    // Strategy should be removed
    await waitFor(() => {
      expect(screen.queryByText("Vertical Stack")).not.toBeInTheDocument();
    });
  });
});
