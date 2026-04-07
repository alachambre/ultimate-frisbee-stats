import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam } from "../../services";
import CompetitionsPage from "../CompetitionsPage";

describe("CompetitionsPage", () => {
  beforeEach(async () => {
    // Create a test team before each test so we can create competitions
    await createTeam({ name: "Test Team" });
  });

  it("shows empty state when no competitions exist", async () => {
    render(<CompetitionsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no competitions yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create your first competition/i)).toBeInTheDocument();
  });

  it("shows spectator guidance and hides creation actions for public users when permissions are enforced", async () => {
    render(<CompetitionsPage />, {
      auth: {
        role: "public",
        enforcementMode: "enforced",
        isAuthenticated: false,
        hasAppAccess: false,
        isConfigured: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText(/spectator mode/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/you can follow competitions and games here/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /new competition/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create your first competition/i })
    ).not.toBeInTheDocument();
  });

  it("creates new competition successfully", async () => {
    const user = userEvent.setup();
    render(<CompetitionsPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no competitions yet/i)).toBeInTheDocument();
    });

    // Click "Create Your First Competition" button
    const createButton = screen.getByRole("button", {
      name: /create your first competition/i,
    });
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText(/create new competition/i)).toBeInTheDocument();

    // Wait a moment for teams to load, then open the team select dropdown
    await waitFor(() => {
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    });

    const teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);

    // Now find and click the team option
    const teamOption = await screen.findByText("Test Team", {}, { timeout: 3000 });
    await user.click(teamOption);

    // Fill in competition name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Summer League 2024");

    // Fill in description
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, "Annual summer tournament");

    // Fill in start date
    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-01");

    // Fill in end date
    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-30");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /create competition/i });
    await user.click(submitButton);

    // Modal should close and competition should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Summer League 2024")).toBeInTheDocument();
    });
  });

  it("displays competitions in grid when competitions exist", async () => {
    const user = userEvent.setup();
    render(<CompetitionsPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no competitions yet/i)).toBeInTheDocument();
    });

    // Create first competition
    let createButton = screen.getByRole("button", {
      name: /create your first competition/i,
    });
    await user.click(createButton);

    // Wait for modal and team select to load
    await waitFor(() => {
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    });

    let teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);

    let teamOption = await screen.findByText("Test Team", {}, { timeout: 3000 });
    await user.click(teamOption);

    let nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Competition Alpha");

    let startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-01");

    let endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-30");

    let submitButton = screen.getByRole("button", { name: /create competition/i });
    await user.click(submitButton);

    // Wait for first competition to appear
    await waitFor(() => {
      expect(screen.getByText("Competition Alpha")).toBeInTheDocument();
    });

    // Now the page should show the "New Competition" button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new competition/i })).toBeInTheDocument();
    });

    // Create second competition
    createButton = screen.getByRole("button", { name: /new competition/i });
    await user.click(createButton);

    // Wait for modal and team select to load
    await waitFor(() => {
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    });

    teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);

    teamOption = await screen.findByRole("option", { name: "Test Team" }, { timeout: 3000 });
    await user.click(teamOption);

    nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Competition Beta");

    startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-07-01");

    endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-07-31");

    submitButton = screen.getByRole("button", { name: /create competition/i });
    await user.click(submitButton);

    // Wait for second competition to appear
    await waitFor(() => {
      expect(screen.getByText("Competition Beta")).toBeInTheDocument();
    });

    // Both competitions should be visible
    expect(screen.getByText("Competition Alpha")).toBeInTheDocument();
    expect(screen.getByText("Competition Beta")).toBeInTheDocument();
  });

  it("navigates to competition detail on card click", async () => {
    const user = userEvent.setup();
    render(<CompetitionsPage />);

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/no competitions yet/i)).toBeInTheDocument();
    });

    // Create a competition
    const createButton = screen.getByRole("button", {
      name: /create your first competition/i,
    });
    await user.click(createButton);

    // Wait a moment for teams to load, then open the team select dropdown
    await waitFor(() => {
      expect(screen.getByLabelText(/team/i)).toBeInTheDocument();
    });

    const teamSelect = screen.getByLabelText(/team/i);
    await user.click(teamSelect);

    // Now find and click the team option
    const teamOption = await screen.findByText("Test Team", {}, { timeout: 3000 });
    await user.click(teamOption);

    const nameInput = screen.getByLabelText(/competition name/i);
    await user.type(nameInput, "Test Competition");

    const startDateInput = screen.getByLabelText(/start date/i);
    await user.type(startDateInput, "2024-06-01");

    const endDateInput = screen.getByLabelText(/end date/i);
    await user.type(endDateInput, "2024-06-30");

    const submitButton = screen.getByRole("button", { name: /create competition/i });
    await user.click(submitButton);

    // Wait for competition card to appear
    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Click on the competition card
    const competitionCard = screen.getByText("Test Competition").closest("a");
    expect(competitionCard).toHaveAttribute("href", "/competitions/1");
  });
});
