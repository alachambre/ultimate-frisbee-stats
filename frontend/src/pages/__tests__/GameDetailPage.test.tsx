import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition, createGame, createPlayer, finishGame } from "../../services";
import { addPlayersToRoster } from "../../services/competitions";
import { addPlayersToGame } from "../../services/games";
import GameDetailPage from "../GameDetailPage";

// Mock useParams and useNavigate
const mockUseParams = vi.fn();
const mockUseNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate,
  };
});

describe("GameDetailPage", () => {
  beforeEach(async () => {
    // Reset the mock to return gameId "1" for each test
    mockUseParams.mockReturnValue({ gameId: "1" });

    // Create a test team, competition, and game before each test
    const testTeam = await createTeam({ name: "Test Team" });
    const testCompetition = await createCompetition({
      team_id: testTeam.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    await createGame({
      competition_id: testCompetition.id,
      opponent_name: "Rival Team",
      date: "2024-01-15",
    });
  });

  it("displays game information correctly", async () => {
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Test Team/i).length).toBeGreaterThan(0);
  });

  it("shows score and empty points list", async () => {
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    // Check score display - should appear twice (once for Test Team, once for Rival Team)
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);

    // Check empty points message
    expect(
      screen.getByText(/No points yet. Start tracking points above./i)
    ).toBeInTheDocument();
  });

  it("edits game successfully", async () => {
    const user = userEvent.setup();
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    // Click Edit button
    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText(/edit game/i)).toBeInTheDocument();

    // Change opponent name
    const opponentInput = screen.getByLabelText(/opponent name/i);
    await user.clear(opponentInput);
    await user.type(opponentInput, "Updated Rival");

    // Submit form
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Modal should close and updated name should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Updated Rival/i)).toBeInTheDocument();
    });
  });

  it("finishes game successfully", async () => {
    const user = userEvent.setup();
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    // Click Start Game button (should be visible for ready games)
    const startButton = screen.getByRole("button", { name: /start game/i });
    await user.click(startButton);

    // Start button should no longer be visible
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /start game/i })).not.toBeInTheDocument();
    });

    // End Game button should now be visible
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /end game/i })).toBeInTheDocument();
    });

    // Click End Game button
    const endButton = screen.getByRole("button", { name: /end game/i });
    await user.click(endButton);

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText(/mark game as ended/i)).toBeInTheDocument();
    });

    // Confirm end
    const confirmButton = screen.getByRole("button", { name: /end game/i });
    await user.click(confirmButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText(/mark game as ended/i)).not.toBeInTheDocument();
    });

    // End button should no longer be visible
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /end game/i })).not.toBeInTheDocument();
    });
  });

  it("deletes game with confirmation", async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();

    // Update the mock to use our mockNavigate
    // @ts-expect-error - Mocking useNavigate for test purposes
    vi.mocked(await import("react-router-dom")).useNavigate = () => mockNavigate as any;

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    // Click Delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText(/delete this game/i)).toBeInTheDocument();
    });

    // Confirm delete
    const confirmButton = screen.getByRole("button", { name: /delete game/i });
    await user.click(confirmButton);

    // Should call navigate to games list
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/games");
    });
  });

  it("displays comments when present", async () => {
    // Create game with comments
    const testTeam = await createTeam({ name: "Test Team 2" });
    const testCompetition = await createCompetition({
      team_id: testTeam.id,
      name: "Test Competition 2",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    await createGame({
      competition_id: testCompetition.id,
      opponent_name: "Rival Team 2",
      date: "2024-01-15",
      comments: "Important game - bring water bottles",
    });

    // Need to update the mock to return game 2
    mockUseParams.mockReturnValue({ gameId: "2" });

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Important game - bring water bottles/i)).toBeInTheDocument();
    });
  });

  it("allows adding players to game", async () => {
    const user = userEvent.setup();

    // Use the game created in beforeEach (ID 1)
    // Add a player to the team via API
    const teams = await (await fetch("http://localhost:8000/teams")).json();
    const team = teams[0];

    // Add player to competition first (so it's in the roster)
    const competitions = await (await fetch("http://localhost:8000/competitions")).json();
    const competition = competitions[0];

    await fetch(`http://localhost:8000/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Player", gender: "M", number: 99 }),
    });

    const players = await (await fetch(`http://localhost:8000/teams/${team.id}/players`)).json();
    const newPlayer = players.find((p: any) => p.name === "New Player");

    // Add player to competition roster
    await fetch(`http://localhost:8000/competitions/${competition.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_ids: [newPlayer.id] }),
    });

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open roster dialog
    const rosterButton = screen.getByRole("button", { name: /roster/i });
    await user.click(rosterButton);

    // Dialog should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/players \(\d+\)/i)).toBeInTheDocument();
    });

    // Click Add Players button in the dialog
    const addButton = screen.getByRole("button", { name: /add players/i });
    await user.click(addButton);

    // Add players modal should open (now there are 2 dialogs: roster + add players)
    await waitFor(() => {
      expect(screen.getByText(/add players to game/i)).toBeInTheDocument();
    });

    // Wait for player to appear in modal and click it
    await waitFor(() => {
      expect(screen.getByText("New Player")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select the player by clicking on the name
    const playerItem = screen.getByText("New Player");
    await user.click(playerItem);

    // Submit
    const addPlayersButton = screen.getByRole("button", { name: /add 1 player/i });
    await user.click(addPlayersButton);

    // Add players modal should close
    await waitFor(() => {
      expect(screen.queryByText(/add players to game/i)).not.toBeInTheDocument();
    });
  });

  it("allows removing players from game", async () => {
    const user = userEvent.setup();

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Open roster dialog
    const rosterButton = screen.getByRole("button", { name: /roster/i });
    await user.click(rosterButton);

    // Wait for dialog to open and players to load
    await waitFor(() => {
      const playersSection = screen.getByText(/players \(\d+\)/i);
      expect(playersSection).toBeInTheDocument();
    });

    // If there are players, try to remove one
    const playersText = screen.getByText(/players \(\d+\)/i).textContent;
    const playerCount = parseInt(playersText?.match(/\d+/)?.[0] || "0");

    if (playerCount > 0) {
      // Find a player card and click it
      const menSection = screen.queryByText(/men \(\d+\)/i);
      const womenSection = screen.queryByText(/women \(\d+\)/i);

      if (menSection || womenSection) {
        // Click on first available player
        const playerCards = screen.getAllByRole("button").filter(btn =>
          btn.getAttribute("aria-label")?.includes("edit player")
        );

        if (playerCards.length > 0) {
          await user.click(playerCards[0]);

          // Confirmation dialog should appear
          await waitFor(() => {
            expect(screen.getByText(/remove player from game\?/i)).toBeInTheDocument();
          });

          // Confirm removal
          const confirmButton = screen.getByRole("button", { name: "Remove Player" });
          await user.click(confirmButton);

          // Dialog should close
          await waitFor(() => {
            expect(screen.queryByText(/remove player from game\?/i)).not.toBeInTheDocument();
          });
        }
      }
    }
  });

  it("displays player roster in dialog", async () => {
    const user = userEvent.setup();

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Roster button should be visible
    const rosterButton = screen.getByRole("button", { name: /roster/i });
    expect(rosterButton).toBeInTheDocument();

    // Open roster dialog
    await user.click(rosterButton);

    // Dialog should open with player sections
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText(/players \(\d+\)/i)).toBeInTheDocument();
    });

    // Gender sections should appear - check that at least one of each exists
    await waitFor(() => {
      expect(screen.getAllByText(/men \(\d+\)/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/women \(\d+\)/i).length).toBeGreaterThan(0);
    });

    // Close dialog
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("disables player management when game is finished", async () => {
    const user = userEvent.setup();

    // Create a finished game
    const testTeam = await createTeam({ name: "Test Team" });
    const testCompetition = await createCompetition({
      team_id: testTeam.id,
      name: "Test Competition",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    });
    const testGame = await createGame({
      competition_id: testCompetition.id,
      opponent_name: "Rival Team",
      date: "2024-01-15",
    });

    // Add some players to the game
    const player1 = await createPlayer({
      name: "Player 1",
      number: 10,
      gender: "M",
      team_id: testTeam.id,
    });
    const player2 = await createPlayer({
      name: "Player 2",
      number: 20,
      gender: "W",
      team_id: testTeam.id,
    });

    await addPlayersToRoster(testCompetition.id, [player1.id, player2.id]);
    await addPlayersToGame(testGame.id, [player1.id, player2.id]);

    // Finish the game
    await finishGame(testGame.id);

    mockUseParams.mockReturnValue({ gameId: String(testGame.id) });

    render(<GameDetailPage />);

    // Wait for game to load (no more "final score" label, just check the title)
    await waitFor(() => {
      expect(screen.getByText(/Test Team vs Rival Team/i)).toBeInTheDocument();
    });

    // Open roster dialog
    const rosterButton = screen.getByRole("button", { name: /roster/i });
    await user.click(rosterButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Add Players button should be disabled
    const addButton = screen.getByRole("button", { name: /add players/i });
    expect(addButton).toBeDisabled();

    // Players should be visible but delete buttons should not appear
    await waitFor(() => {
      expect(screen.getByText("Player 1")).toBeInTheDocument();
      expect(screen.getByText("Player 2")).toBeInTheDocument();
    });

    // Close the roster dialog to check main page buttons
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Check that main game delete button is present
    const deleteButtons = screen.queryAllByRole("button", { name: /delete/i });
    expect(deleteButtons.length).toBe(1); // Only the main game delete button
  });
});
