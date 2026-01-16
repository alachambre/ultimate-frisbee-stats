import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import TeamsPage from "../TeamsPage";

describe("TeamsPage", () => {
  it("shows empty state when no teams exist", async () => {
    render(<TeamsPage />);

    await waitFor(() => {
      expect(screen.getByText(/no teams yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create your first team/i)).toBeInTheDocument();
  });

  it("allows user to create a new team", async () => {
    const user = userEvent.setup();
    render(<TeamsPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no teams yet/i)).toBeInTheDocument();
    });

    // Click "Create Your First Team" button
    const createButton = screen.getByRole("button", {
      name: /create your first team/i,
    });
    await user.click(createButton);

    // Modal should open
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/create new team/i)).toBeInTheDocument();

    // Fill in team name
    const nameInput = screen.getByLabelText(/team name/i);
    await user.type(nameInput, "Test Team");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /create team/i });
    await user.click(submitButton);

    // Modal should close and team should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });
  });

  it("displays multiple teams in a grid", async () => {
    const user = userEvent.setup();
    render(<TeamsPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no teams yet/i)).toBeInTheDocument();
    });

    // Create first team
    let addButton = screen.getByRole("button", { name: /create your first team/i });
    await user.click(addButton);

    let nameInput = screen.getByLabelText(/team name/i);
    await user.type(nameInput, "Team One");

    let submitButton = screen.getByRole("button", { name: /create team/i });
    await user.click(submitButton);

    // Wait for first team to appear
    await waitFor(() => {
      expect(screen.getByText("Team One")).toBeInTheDocument();
    });

    // Now the page should show the "Add Team" button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add team/i })).toBeInTheDocument();
    });

    // Create second team
    addButton = screen.getByRole("button", { name: /add team/i });
    await user.click(addButton);

    nameInput = screen.getByLabelText(/team name/i);
    await user.type(nameInput, "Team Two");

    submitButton = screen.getByRole("button", { name: /create team/i });
    await user.click(submitButton);

    // Wait for second team to appear
    await waitFor(() => {
      expect(screen.getByText("Team Two")).toBeInTheDocument();
    });

    // Both teams should be visible
    expect(screen.getByText("Team One")).toBeInTheDocument();
    expect(screen.getByText("Team Two")).toBeInTheDocument();
  });
});
