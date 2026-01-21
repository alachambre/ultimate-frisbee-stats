import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition } from "../../services";
import GamesPage from "../GamesPage";

describe("GamesPage", () => {
  beforeEach(async () => {
    // Create a test team and competition before each test so we can create games
    const team = await createTeam({ name: "Test Team" });
    await createCompetition({
      team_id: team.id,
      name: "Test Competition",
      description: "A test competition",
      start_date: "2024-06-01",
      end_date: "2024-06-30",
    });
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

    // Select competition from dropdown - use fireEvent.mouseDown for MUI Select
    const competitionSelect = document.getElementById("competition-select");
    if (competitionSelect) {
      fireEvent.mouseDown(competitionSelect);
    }

    // Find and click the competition option in the dropdown menu
    const competitionOption = await screen.findByText("Test Competition");
    await user.click(competitionOption);

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

    let competitionSelect = document.getElementById("competition-select");
    if (competitionSelect) {
      fireEvent.mouseDown(competitionSelect);
    }
    let competitionOption = await screen.findByText("Test Competition");
    await user.click(competitionOption);

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

    competitionSelect = document.getElementById("competition-select");
    if (competitionSelect) {
      fireEvent.mouseDown(competitionSelect);
    }
    // Find the listbox and then find Test Competition within it
    const listbox = await screen.findByRole('listbox');
    competitionOption = within(listbox).getByText("Test Competition");
    await user.click(competitionOption);

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

    const competitionSelect = document.getElementById("competition-select");
    if (competitionSelect) {
      fireEvent.mouseDown(competitionSelect);
    }
    const competitionOption = await screen.findByText("Test Competition");
    await user.click(competitionOption);

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
