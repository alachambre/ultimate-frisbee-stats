import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import LinesPage from "../LinesPage";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LinesPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("shows empty state when no lines exist", async () => {
    render(<LinesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no lines yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create first line/i)).toBeInTheDocument();
  });

  it("allows user to create a new line", async () => {
    const user = userEvent.setup();

    // Create a team first
    await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Team" }),
    });

    render(<LinesPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Lines")).toBeInTheDocument();
    });

    // Click "New Line" button from PageHeader
    const createButton = screen.getByRole("button", { name: "New Line" });
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");

    // Fill in line details
    const nameInput = within(dialog).getByLabelText(/line name/i);
    await user.type(nameInput, "O-Line");

    const descriptionInput = within(dialog).getByLabelText(/description/i);
    await user.type(descriptionInput, "Main offense line");

    // Select team from dropdown
    const teamSelect = within(dialog).getByLabelText(/team/i);
    await user.click(teamSelect);

    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Test Team"));

    // Submit form
    await waitFor(() => {
      const submitButton = screen.getByRole("button", { name: "Create Line" });
      expect(submitButton).not.toBeDisabled();
    });

    const submitButton = screen.getByRole("button", { name: "Create Line" });
    await user.click(submitButton);

    // Modal should close and line should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("O-Line")).toBeInTheDocument();
      expect(screen.getByText("Main offense line")).toBeInTheDocument();
    });
  });

  it("filters lines by selected team", async () => {
    const user = userEvent.setup();

    // Create two teams with lines
    const team1Response = await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Team Alpha" }),
    });
    const team1 = await team1Response.json();

    const team2Response = await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Team Beta" }),
    });
    const team2 = await team2Response.json();

    // Create lines for each team
    await fetch("http://localhost:8000/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Alpha O-Line",
        description: "Team Alpha offense",
        team_id: team1.id,
      }),
    });

    await fetch("http://localhost:8000/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Beta D-Line",
        description: "Team Beta defense",
        team_id: team2.id,
      }),
    });

    render(<LinesPage />);

    // Wait for both lines to appear
    await waitFor(() => {
      expect(screen.getByText("Alpha O-Line")).toBeInTheDocument();
      expect(screen.getByText("Beta D-Line")).toBeInTheDocument();
    });

    // Filter by Team Alpha - click the select dropdown (MUI Select uses role="combobox")
    const teamFilter = screen.getByRole("combobox", { name: /filter by team/i });
    await user.click(teamFilter);

    // Wait for dropdown menu to appear and click option (MUI renders options as li elements)
    await waitFor(() => {
      expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Team Alpha"));

    // Only Team Alpha's line should be visible
    await waitFor(() => {
      expect(screen.getByText("Alpha O-Line")).toBeInTheDocument();
      expect(screen.queryByText("Beta D-Line")).not.toBeInTheDocument();
    });

    // Switch to All Teams - re-query the filter element after state change
    const teamFilterAgain = screen.getByRole("combobox", { name: /filter by team/i });
    await user.click(teamFilterAgain);

    await waitFor(() => {
      expect(screen.getByText("All Teams")).toBeInTheDocument();
    });

    await user.click(screen.getByText("All Teams"));

    // Both lines should be visible again
    await waitFor(() => {
      expect(screen.getByText("Alpha O-Line")).toBeInTheDocument();
      expect(screen.getByText("Beta D-Line")).toBeInTheDocument();
    });
  });

  it("navigates to line detail when clicking on a line card", async () => {
    const user = userEvent.setup();

    // Create a team and line
    const teamResponse = await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Team" }),
    });
    const team = await teamResponse.json();

    const lineResponse = await fetch("http://localhost:8000/lines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Line",
        description: "Test line description",
        team_id: team.id,
      }),
    });
    const line = await lineResponse.json();

    render(<LinesPage />);

    // Wait for line to appear
    await waitFor(() => {
      expect(screen.getByText("Test Line")).toBeInTheDocument();
    });

    // Click on the line card (not on edit/delete buttons)
    const lineCard = screen.getByText("Test line description");
    await user.click(lineCard);

    // Should navigate to line detail page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/lines/${line.id}`);
    });
  });
});
