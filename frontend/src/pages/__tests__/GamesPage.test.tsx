import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam } from "../../services";
import GamesPage from "../GamesPage";

describe("GamesPage", () => {
  let testTeam: any;

  beforeEach(async () => {
    // Create a test team before each test so we can create games
    testTeam = await createTeam({ name: "Test Team" });
  });

  it("shows empty state when no games exist", async () => {
    render(<GamesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/create your first game/i)).toBeInTheDocument();
  });

  it("creates new game successfully with team selection", async () => {
    const user = userEvent.setup();
    render(<GamesPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    });

    // Click "Create Your First Game" button
    const createButton = screen.getByRole("button", {
      name: /create your first game/i,
    });
    await user.click(createButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText(/create new game/i)).toBeInTheDocument();

    // Select team from dropdown - use fireEvent.mouseDown for MUI Select
    const teamSelect = document.getElementById("team-select");
    if (teamSelect) {
      fireEvent.mouseDown(teamSelect);
    }

    // Find and click the team option in the dropdown menu
    const teamOption = await screen.findByText("Test Team");
    await user.click(teamOption);

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
    });
  });

  it("displays games in grid when games exist", async () => {
    const user = userEvent.setup();
    render(<GamesPage />);

    // Wait for empty state to load
    await waitFor(() => {
      expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    });

    // Create first game
    let createButton = screen.getByRole("button", { name: /create your first game/i });
    await user.click(createButton);

    let teamSelect = document.getElementById("team-select");
    if (teamSelect) {
      fireEvent.mouseDown(teamSelect);
    }
    let teamOption = await screen.findByText("Test Team");
    await user.click(teamOption);

    let opponentInput = screen.getByLabelText(/opponent name/i);
    await user.type(opponentInput, "Team Alpha");

    let submitButton = screen.getByRole("button", { name: /create game/i });
    await user.click(submitButton);

    // Wait for first game to appear
    await waitFor(() => {
      expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    });

    // Now the page should show the "New Game" button
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /new game/i })).toBeInTheDocument();
    });

    // Create second game
    createButton = screen.getByRole("button", { name: /new game/i });
    await user.click(createButton);

    teamSelect = document.getElementById("team-select");
    if (teamSelect) {
      fireEvent.mouseDown(teamSelect);
    }
    // Find the listbox and then find Test Team within it
    const listbox = await screen.findByRole('listbox');
    teamOption = within(listbox).getByText("Test Team");
    await user.click(teamOption);

    opponentInput = screen.getByLabelText(/opponent name/i);
    await user.type(opponentInput, "Team Beta");

    submitButton = screen.getByRole("button", { name: /create game/i });
    await user.click(submitButton);

    // Wait for second game to appear
    await waitFor(() => {
      expect(screen.getByText("Team Beta")).toBeInTheDocument();
    });

    // Both games should be visible
    expect(screen.getByText("Team Alpha")).toBeInTheDocument();
    expect(screen.getByText("Team Beta")).toBeInTheDocument();
  });

  it("navigates to game detail on card click", async () => {
    const user = userEvent.setup();
    render(<GamesPage />);

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    });

    // Create a game
    const createButton = screen.getByRole("button", { name: /create your first game/i });
    await user.click(createButton);

    const teamSelect = document.getElementById("team-select");
    if (teamSelect) {
      fireEvent.mouseDown(teamSelect);
    }
    const teamOption = await screen.findByText("Test Team");
    await user.click(teamOption);

    const opponentInput = screen.getByLabelText(/opponent name/i);
    await user.type(opponentInput, "Test Opponent");

    const submitButton = screen.getByRole("button", { name: /create game/i });
    await user.click(submitButton);

    // Wait for game card to appear
    await waitFor(() => {
      expect(screen.getByText("Test Opponent")).toBeInTheDocument();
    });

    // Click on the game card
    const gameCard = screen.getByText("Test Opponent").closest("a");
    expect(gameCard).toHaveAttribute("href", "/games/1");
  });
});
