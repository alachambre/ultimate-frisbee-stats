import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateCompetitionModal from "./CreateCompetitionModal";
import { createTeam } from "../../services";

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("CreateCompetitionModal", () => {
  beforeEach(async () => {
    // Create a test team so it appears in the dropdown
    await createTeam({ name: "Test Team" });
  });

  it("displays all form fields", async () => {
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/competition name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it("displays team in dropdown", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    // Open team dropdown
    const teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);

    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });
  });

  it("disables submit button when form is incomplete", async () => {
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /create competition/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit button when all required fields are filled", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    // Select team
    const teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);
    const teamOption = await screen.findByText("Test Team");
    await user.click(teamOption);

    // Fill in name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Summer League");

    // Fill in dates
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-01");

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-30");

    // Submit button should now be enabled
    const submitButton = screen.getByRole("button", {
      name: /create competition/i,
    });
    expect(submitButton).toBeEnabled();
  });

  it("validates that end date is after start date", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    // Fill in dates with end before start
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-30");

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-01");

    // Error message should appear
    await waitFor(() => {
      expect(
        screen.getByText(/end date must be after start date/i)
      ).toBeInTheDocument();
    });

    // Submit button should be disabled
    const submitButton = screen.getByRole("button", {
      name: /create competition/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("creates competition successfully when form is valid", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithQueryClient(
      <CreateCompetitionModal isOpen={true} onClose={onClose} />
    );

    await waitFor(() => {
      expect(screen.getByText("Create New Competition")).toBeInTheDocument();
    });

    // Select team
    const teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);
    const teamOption = await screen.findByText("Test Team");
    await user.click(teamOption);

    // Fill in name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Summer League");

    // Fill in description
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Annual summer tournament");

    // Fill in dates
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-01");

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-30");

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /create competition/i,
    });
    await user.click(submitButton);

    // onClose should be called after successful creation
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
