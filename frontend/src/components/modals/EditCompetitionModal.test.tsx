import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditCompetitionModal from "./EditCompetitionModal";
import { createTeam, createCompetition } from "../../services";
import type { Competition } from "../../types";

let mockCompetition: Competition;

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("EditCompetitionModal", () => {
  beforeEach(async () => {
    // Create a real competition in MSW so the update will work
    const team = await createTeam({ name: "Test Team" });
    const competition = await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      description: "A test competition",
      start_date: "2024-06-01",
      end_date: "2024-06-30",
    });
    mockCompetition = competition;
  });
  it("displays all form fields with current values", async () => {
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={vi.fn()}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/competition name/i) as HTMLInputElement;
    expect(nameInput.value).toBe("Test Competition");

    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe("A test competition");

    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    expect(startDateInput.value).toBe("2024-06-01");

    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    expect(endDateInput.value).toBe("2024-06-30");

    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it("allows editing competition name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={vi.fn()}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/competition name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Competition");

    expect(nameInput).toHaveValue("Updated Competition");
  });

  it("allows changing status", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={vi.fn()}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    // Open status dropdown
    const statusSelect = screen.getByLabelText(/status/i);
    await user.click(statusSelect);

    // Select "completed"
    const completedOption = await screen.findByText("Completed");
    await user.click(completedOption);

    // Status should be updated
    expect(statusSelect).toHaveTextContent("Completed");
  });

  it("validates that end date is after start date", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={vi.fn()}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    // Change dates so end is before start
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.clear(startDateInput);
    await user.type(startDateInput, "2024-07-01");

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.clear(endDateInput);
    await user.type(endDateInput, "2024-06-01");

    // Error message should appear
    await waitFor(() => {
      expect(
        screen.getByText(/end date must be after start date/i)
      ).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByRole("button", {
      name: /save changes/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("disables submit button when name is empty", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={vi.fn()}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    // Clear the name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.clear(nameInput);

    // Submit button should be disabled
    const submitButton = screen.getByRole("button", {
      name: /save changes/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={onClose}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("updates competition successfully when form is valid", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <EditCompetitionModal
        isOpen={true}
        onClose={onClose}
        competition={mockCompetition}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Edit Competition")).toBeInTheDocument();
    });

    // Change the name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Competition");

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /save changes/i,
    });
    await user.click(submitButton);

    // onClose should be called after successful update
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
