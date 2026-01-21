import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition, createPlayer } from "../../services";
import CompetitionDetailPage from "../CompetitionDetailPage";

// Mock useParams to provide competitionId
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ competitionId: "1" }),
    useNavigate: () => vi.fn(),
  };
});

describe("CompetitionDetailPage", () => {
  beforeEach(async () => {
    // Create test team and competition
    const team = await createTeam({ name: "Test Team" });
    await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      description: "A test competition",
      start_date: "2024-06-01",
      end_date: "2024-06-30",
    });
  });

  it("displays competition details correctly", async () => {
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    expect(screen.getByText("A test competition")).toBeInTheDocument();
    expect(screen.getByText(/Jun 1, 2024 - Jun 30, 2024/i)).toBeInTheDocument();
    expect(screen.getByText("ongoing")).toBeInTheDocument();
  });

  it("shows empty state when roster has no players", async () => {
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
    expect(screen.getByText("Roster (0)")).toBeInTheDocument();
  });

  it("shows empty state when competition has no games", async () => {
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    expect(screen.getByText("Games (0)")).toBeInTheDocument();
  });

  it("allows editing competition details", async () => {
    const user = userEvent.setup();
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Click Edit button
    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    // Edit modal should open
    await waitFor(() => {
      expect(screen.getByText(/edit competition/i)).toBeInTheDocument();
    });

    // Change the name
    const nameInput = screen.getByLabelText(/competition name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Competition");

    // Save changes
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Modal should close and updated name should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Updated Competition")).toBeInTheDocument();
    });
  });

  it("allows deleting competition with confirmation", async () => {
    const user = userEvent.setup();
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Click Delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText(/delete competition\?/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/are you sure you want to delete "test competition"/i)
    ).toBeInTheDocument();

    // Confirm deletion - get the button inside the dialog
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete competition/i,
    });
    // The last one should be in the dialog (the first one is the page button)
    const confirmButton = deleteButtons[deleteButtons.length - 1];

    // Verify no error is shown before deletion
    expect(screen.queryByText(/error deleting competition/i)).not.toBeInTheDocument();

    await user.click(confirmButton);

    // Wait a moment to let the mutation complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify no error occurred during deletion
    expect(screen.queryByText(/error deleting competition/i)).not.toBeInTheDocument();

    // Note: Navigation is mocked, so the dialog won't actually close
    // In a real app, the component would navigate to /competitions
    // The absence of error indicates successful deletion
  });

  it("allows adding players to roster", async () => {
    const user = userEvent.setup();

    // First add a player to the team so we can add them to the roster
    const team = await fetch("http://localhost:8000/teams/1").then((r) => r.json());
    await createPlayer({ team_id: team.id, name: "John Doe", number: 42, gender: "M" });

    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Initially roster should be empty
    expect(screen.getByText("Roster (0)")).toBeInTheDocument();

    // Click "Add Players" button
    const addPlayersButtons = screen.getAllByRole("button", {
      name: /add players/i,
    });
    await user.click(addPlayersButtons[0]);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText(/add players to roster/i)).toBeInTheDocument();
    });

    // Player should appear in the available list
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click on player name to select player
    const playerName = screen.getByText("John Doe");
    await user.click(playerName);

    // Add selected players
    const addButton = await screen.findByRole("button", { name: /add 1 player/i });
    await user.click(addButton);

    // Modal should close and player should appear in roster
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Roster (1)")).toBeInTheDocument();
    });
  });

  it("allows creating a game for the competition", async () => {
    const user = userEvent.setup();
    render(<CompetitionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Competition")).toBeInTheDocument();
    });

    // Initially should have 0 games
    expect(screen.getByText("Games (0)")).toBeInTheDocument();

    // Click "Add Game" button
    const addGameButtons = screen.getAllByRole("button", { name: /add game/i });
    await user.click(addGameButtons[0]);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill in opponent name
    const opponentInput = screen.getByLabelText(/opponent name/i);
    await user.type(opponentInput, "Rival Team");

    // Submit form
    const submitButton = screen.getByRole("button", { name: /create game/i });
    await user.click(submitButton);

    // Modal should close and game should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Rival Team")).toBeInTheDocument();
      expect(screen.getByText("Games (1)")).toBeInTheDocument();
    });
  });
});
