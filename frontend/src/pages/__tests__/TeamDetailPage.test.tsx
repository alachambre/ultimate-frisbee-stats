import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import TeamDetailPage from "../TeamDetailPage";
import { handlers } from "../../test/mocks/handlers";
import type { Team } from "../../types";

// Create a server instance for these tests
const server = setupServer(...handlers);

// Mock useParams to provide teamId
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ teamId: "1" }),
    useNavigate: () => vi.fn(),
  };
});

describe("TeamDetailPage - Player Management", () => {
  beforeEach(async () => {
    // Create a test team before each test
    const response = await fetch("http://localhost:8000/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Team" }),
    });
    await response.json();
  });

  it("shows empty state when team has no players", async () => {
    render(<TeamDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
  });

  it("allows user to add a player to the team", async () => {
    const user = userEvent.setup();
    render(<TeamDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    // Click "Add Player" button on the page (not in a dialog)
    const addButtons = screen.getAllByRole("button", { name: /add player/i });
    // The first one should be the page button, not the modal one
    await user.click(addButtons[0]);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill in player details
    const nameInput = screen.getByLabelText(/player name/i);
    await user.type(nameInput, "John Doe");

    const numberInput = screen.getByLabelText(/jersey number/i);
    await user.type(numberInput, "42");

    // Submit form - the submit button should now be enabled
    await waitFor(() => {
      const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
      const enabledButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
      expect(enabledButton).toBeDefined();
    });

    const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
    const submitButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
    await user.click(submitButton!);

    // Modal should close and player should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("#42")).toBeInTheDocument();
    });
  });

  it("allows user to edit a player", async () => {
    const user = userEvent.setup();
    render(<TeamDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    // Add a player first
    const addButtons = screen.getAllByRole("button", { name: /add player/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/player name/i);
    await user.type(nameInput, "Jane Smith");

    await waitFor(() => {
      const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
      const enabledButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
      expect(enabledButton).toBeDefined();
    });

    const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
    const submitButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
    await user.click(submitButton!);

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Wait for player to appear
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Click edit button (IconButton with EditIcon)
    const editButton = await screen.findByRole("button", { name: /edit player/i });
    await user.click(editButton);

    // Edit modal should open
    await waitFor(() => {
      expect(screen.getByText(/edit player/i)).toBeInTheDocument();
    });

    // Change the name
    const editNameInput = screen.getByLabelText(/player name/i);
    await user.clear(editNameInput);
    await user.type(editNameInput, "Jane Doe");

    // Save changes
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Modal should close and updated name should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });
  });

  it("allows user to delete a player", async () => {
    const user = userEvent.setup();
    render(<TeamDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Team")).toBeInTheDocument();
    });

    // Add a player first
    const addButtons = screen.getAllByRole("button", { name: /add player/i });
    await user.click(addButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/player name/i);
    await user.type(nameInput, "Bob Johnson");

    await waitFor(() => {
      const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
      const enabledButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
      expect(enabledButton).toBeDefined();
    });

    const submitButtons = screen.getAllByRole("button", { name: "Add Player" });
    const submitButton = submitButtons.find((btn) => !btn.hasAttribute("disabled"));
    await user.click(submitButton!);

    // Wait for modal to close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Wait for player to appear
    await waitFor(() => {
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });

    // Click edit button to open edit modal
    const editButton = await screen.findByRole("button", { name: /edit player/i });
    await user.click(editButton);

    // Click delete button in the edit modal
    await waitFor(() => {
      expect(screen.getByText(/edit player/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: /delete player/i });
    await user.click(deleteButton);

    // Confirm delete
    await waitFor(() => {
      expect(screen.getByText(/delete player\?/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: "Delete Player" });
    await user.click(confirmButton);

    // Player should be removed
    await waitFor(() => {
      expect(screen.queryByText("Bob Johnson")).not.toBeInTheDocument();
    });

    // Empty state should appear
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
  });
});
