import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "../../test/test-utils";
import userEvent from "@testing-library/user-event";
import { createTeam, createCompetition, createGame } from "../../services";
import GameDetailPage from "../GameDetailPage";

// Mock useParams and useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ gameId: "1" }),
    useNavigate: () => vi.fn(),
  };
});

describe("GameDetailPage", () => {
  beforeEach(async () => {
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
      expect(screen.getByText(/vs Rival Team/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Test Team/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();
  });

  it("shows score and empty points list", async () => {
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/vs Rival Team/i)).toBeInTheDocument();
    });

    // Check score display
    expect(screen.getByText(/0 - 0/i)).toBeInTheDocument();

    // Check empty points message
    expect(
      screen.getByText(/No points yet. Start tracking points above./i)
    ).toBeInTheDocument();
  });

  it("edits game successfully", async () => {
    const user = userEvent.setup();
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/vs Rival Team/i)).toBeInTheDocument();
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
      expect(screen.getByText(/vs Updated Rival/i)).toBeInTheDocument();
    });
  });

  it("finishes game successfully", async () => {
    const user = userEvent.setup();
    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/vs Rival Team/i)).toBeInTheDocument();
    });

    // Initially should be in progress
    expect(screen.getByText(/In Progress/i)).toBeInTheDocument();

    // Click Finish button
    const finishButton = screen.getByRole("button", { name: /finish/i });
    await user.click(finishButton);

    // Confirmation dialog should open
    await waitFor(() => {
      expect(screen.getByText(/mark game as finished/i)).toBeInTheDocument();
    });

    // Confirm finish
    const confirmButton = screen.getByRole("button", { name: /finish game/i });
    await user.click(confirmButton);

    // Dialog should close and status should update
    await waitFor(() => {
      expect(screen.queryByText(/mark game as finished/i)).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Finished/i)).toBeInTheDocument();
    });

    // Finish button should no longer be visible
    expect(screen.queryByRole("button", { name: /finish/i })).not.toBeInTheDocument();
  });

  it("deletes game with confirmation", async () => {
    const user = userEvent.setup();
    const mockNavigate = vi.fn();

    // Update the mock to use our mockNavigate
    // @ts-expect-error - Mocking useNavigate for test purposes
    vi.mocked(await import("react-router-dom")).useNavigate = () => mockNavigate as any;

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/vs Rival Team/i)).toBeInTheDocument();
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
});
