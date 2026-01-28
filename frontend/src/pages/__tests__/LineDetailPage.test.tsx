import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import LineDetailPage from "../LineDetailPage";

// Mock useParams and useNavigate
const mockNavigate = vi.fn();
let mockLineId = "1";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ lineId: mockLineId }),
    useNavigate: () => mockNavigate,
  };
});

describe("LineDetailPage", () => {
  beforeEach(async () => {
    mockNavigate.mockClear();

    // Create a team and line before each test
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
    mockLineId = String(line.id);
  });

  it("displays line details correctly", async () => {
    render(<LineDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Test Line")).toBeInTheDocument();
    });

    expect(screen.getByText("Test line description")).toBeInTheDocument();
    // Player count is rendered as "(0 players)" next to line name
    expect(screen.getByText((content, element) => {
      return element?.textContent === "(0 players)" || content.includes("0 player");
    })).toBeInTheDocument();
    expect(screen.getByText("Test Team")).toBeInTheDocument();
  });

  it("allows user to add players to the line", async () => {
    const user = userEvent.setup();

    // Add players to the team first
    const teamResponse = await fetch("http://localhost:8000/teams", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const teams = await teamResponse.json();
    const team = teams[0];

    await fetch(`http://localhost:8000/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "John Doe", gender: "M", number: 42 }),
    });

    render(<LineDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Line")).toBeInTheDocument();
    });

    // Click "Add Players" button
    const addButton = screen.getByRole("button", { name: /add players/i });
    await user.click(addButton);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Wait for player to appear in modal and select it
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select the player by clicking on the name
    const playerItem = screen.getByText("John Doe");
    await user.click(playerItem);

    // Submit
    const addPlayersButton = screen.getByRole("button", { name: /add 1 player/i });
    await user.click(addPlayersButton);

    // Modal should close and player should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("#42")).toBeInTheDocument();
      expect(screen.getByText(/\(1 player\)/i)).toBeInTheDocument(); // Singular form
    });
  });

  it("allows user to remove players from the line", async () => {
    const user = userEvent.setup();

    // Add a player to the team and line
    const teamResponse = await fetch("http://localhost:8000/teams", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const teams = await teamResponse.json();
    const team = teams[0];

    const playerResponse = await fetch(`http://localhost:8000/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jane Smith", gender: "W", number: 7 }),
    });
    const player = await playerResponse.json();

    const linesResponse = await fetch("http://localhost:8000/lines", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const lines = await linesResponse.json();
    const line = lines[0];

    // Add player to line
    await fetch(`http://localhost:8000/lines/${line.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_ids: [player.id] }),
    });

    render(<LineDetailPage />);

    // Wait for player to appear
    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    // Click the remove button on the player card
    const removeButton = screen.getByRole("button", { name: "Remove player" });
    await user.click(removeButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure you want to remove.*from this line/i)).toBeInTheDocument();
    });

    // Confirm removal
    const confirmButton = screen.getByRole("button", { name: "Remove Player" });
    await user.click(confirmButton);

    // Player should be removed
    await waitFor(() => {
      expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
    });

    // Player count should be back to 0
    expect(screen.getByText((content, element) => {
      return element?.textContent === "(0 players)" || content.includes("0 player");
    })).toBeInTheDocument();
  });

  it("allows user to edit the line", async () => {
    const user = userEvent.setup();

    render(<LineDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Line")).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByRole("button", { name: /edit/i });
    await user.click(editButton);

    // Edit modal should open
    await waitFor(() => {
      expect(screen.getByText(/edit line/i)).toBeInTheDocument();
    });

    // Change the description
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated description");

    // Save changes
    const saveButton = screen.getByRole("button", { name: /save changes/i });
    await user.click(saveButton);

    // Modal should close and updated description should appear
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Updated description")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("allows user to delete the line", async () => {
    const user = userEvent.setup();

    render(<LineDetailPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText("Test Line")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByRole("button", { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/delete line\?/i)).toBeInTheDocument();
    });

    // Confirm delete
    const confirmButton = screen.getByRole("button", { name: "Delete Line" });
    await user.click(confirmButton);

    // Should navigate back to team page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/teams\/\d+/));
    });
  });

  it("displays gender-split player sections", async () => {
    // Add players of both genders
    const teamResponse = await fetch("http://localhost:8000/teams", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const teams = await teamResponse.json();
    const team = teams[0];

    const malePlayerResponse = await fetch(`http://localhost:8000/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Mike Johnson", gender: "M", number: 10 }),
    });
    const malePlayer = await malePlayerResponse.json();

    const femalePlayerResponse = await fetch(`http://localhost:8000/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Sarah Williams", gender: "W", number: 20 }),
    });
    const femalePlayer = await femalePlayerResponse.json();

    const linesResponse = await fetch("http://localhost:8000/lines", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const lines = await linesResponse.json();
    const line = lines[0];

    // Add both players to line
    await fetch(`http://localhost:8000/lines/${line.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_ids: [malePlayer.id, femalePlayer.id] }),
    });

    render(<LineDetailPage />);

    // Wait for players to appear
    await waitFor(() => {
      expect(screen.getByText("Mike Johnson")).toBeInTheDocument();
      expect(screen.getByText("Sarah Williams")).toBeInTheDocument();
    });

    // Check gender sections - there should be at least one of each
    expect(screen.getAllByText(/men \(1\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/women \(1\)/i).length).toBeGreaterThan(0);
  });
});
