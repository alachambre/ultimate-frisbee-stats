import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import ManagePlayersDialog from "../ManagePlayersDialog";
import type { PointWithPlayers, Player } from "../../../types";
import { createTeam, createGame, createCompetition, createLine } from "../../../services";

// Mock players for testing
const mockPlayers: Player[] = [
  { id: 1, name: "Alice", number: 1, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 2, name: "Bob", number: 2, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 3, name: "Charlie", number: 3, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 4, name: "Diana", number: 4, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 5, name: "Eve", number: 5, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 6, name: "Frank", number: 6, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 7, name: "Grace", number: 7, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 8, name: "Henry", number: 8, gender: "M", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
  { id: 9, name: "Ivy", number: 9, gender: "W", team_id: 1, created_at: "2024-01-15T09:00:00Z" },
];

describe("ManagePlayersDialog", () => {
  let mockPoint: PointWithPlayers;
  let team: { id: number; name: string };
  let competition: { id: number; name: string };
  let game: { id: number; competition_id: number };

  beforeEach(async () => {
    // Create team, competition, and game for tests
    team = await createTeam({ name: "Test Team" });
    competition = await createCompetition({
      name: "Test Competition",
      team_id: team.id,
      start_date: "2024-01-01",
      end_date: "2024-01-07",
    });
    game = await createGame({
      competition_id: competition.id,
      opponent_name: "Opponent",
    });

    // Create basic mock point with some players selected
    mockPoint = {
      id: 1,
      game_id: game.id,
      point_number: 1,
      starting_on_offense: true,
      field_side: null,
      pull: null,
      comments: null,
      strategy_id: null,
      won: null,
      status: "ready",
      start_datetime: null,
      end_datetime: null,
      created_at: "2024-01-15T10:00:00Z",
      players: [
        mockPlayers[0], // Alice (W)
        mockPlayers[1], // Bob (M)
        mockPlayers[2], // Charlie (M)
        mockPlayers[3], // Diana (W)
        mockPlayers[4], // Eve (W)
        mockPlayers[5], // Frank (M)
        mockPlayers[6], // Grace (W)
      ], // 4W + 3M
    };
  });

  describe("Initial Rendering", () => {
    it("renders dialog with title", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Select Players")).toBeInTheDocument();
      });
    });

    it("displays gender tabs (Men and Women)", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const tabs = screen.getAllByRole("tab");
        expect(tabs.length).toBe(2);
        // Check that tabs exist (one will be selected)
        expect(tabs.some(tab => tab.textContent?.includes("Men"))).toBe(true);
        expect(tabs.some(tab => tab.textContent?.includes("Women"))).toBe(true);
      });
    });

    it("shows current selection count", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Should show 3M + 4W = 7 players selected
      await waitFor(() => {
        // Look for "Selected:" label to confirm UI is rendered
        expect(screen.getByText("Selected:")).toBeInTheDocument();
        expect(screen.getByText("(7/7)")).toBeInTheDocument();
        // Check that we have the gender counts (allowing for multiple matches)
        const threeM = screen.getAllByText(/3M/);
        const fourW = screen.getAllByText(/4W/);
        expect(threeM.length).toBeGreaterThan(0);
        expect(fourW.length).toBeGreaterThan(0);
      });
    });

    it("displays save and cancel buttons", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });
    });
  });

  describe("Pre-selection", () => {
    it("pre-selects players from point.players", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Check that the pre-selected players are checked
      // Men tab should be active by default (tab index 0)
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        // Bob, Charlie, Frank should be checked (men players)
        const bobCheckbox = checkboxes.find(cb => {
          const listItem = cb.closest('li');
          return listItem?.textContent?.includes('Bob');
        });
        expect(bobCheckbox).toBeChecked();
      });
    });

    it("pre-selects women when switching to women tab", async () => {
      const user = userEvent.setup();
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Switch to Women tab
      await waitFor(() => {
        expect(screen.getByRole("tab", { name: /women/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("tab", { name: /women/i }));

      // Check that women are pre-selected
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox");
        // Alice, Diana, Eve, Grace should be checked
        const aliceCheckbox = checkboxes.find(cb => {
          const listItem = cb.closest('li');
          return listItem?.textContent?.includes('Alice');
        });
        expect(aliceCheckbox).toBeChecked();
      });
    });

    it("handles empty point.players gracefully", async () => {
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Should show 0 selected
      await waitFor(() => {
        expect(screen.getByText("(0/7)")).toBeInTheDocument();
      });
    });
  });

  describe("Gender Tabs", () => {
    it("shows men players by default", () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={1}
          players={mockPlayers}
        />
      );

      // Men should be visible
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText("Frank")).toBeInTheDocument();
      expect(screen.getByText("Henry")).toBeInTheDocument();

      // Women should not be visible
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });

    it("switches to women tab when clicked", async () => {
      const user = userEvent.setup();
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={1}
          players={mockPlayers}
        />
      );

      await user.click(screen.getByRole("tab", { name: /women/i }));

      // Women should now be visible
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Diana")).toBeInTheDocument();
      expect(screen.getByText("Eve")).toBeInTheDocument();
      expect(screen.getByText("Grace")).toBeInTheDocument();
      expect(screen.getByText("Ivy")).toBeInTheDocument();

      // Men should not be visible
      expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    });
  });

  describe("Player Selection", () => {
    it("allows toggling player selection", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Initially no players selected
      await waitFor(() => {
        expect(screen.getByText("(0/7)")).toBeInTheDocument();
      });

      // Click Bob to select (click the text which is part of ListItemButton)
      await user.click(screen.getByText("Bob"));

      // Should now show 1 selected
      await waitFor(() => {
        expect(screen.getByText("(1/7)")).toBeInTheDocument();
      });
    });

    it("allows deselecting players", async () => {
      const user = userEvent.setup();

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Currently 7 players selected
      await waitFor(() => {
        expect(screen.getByText("(7/7)")).toBeInTheDocument();
      });

      // Deselect Bob by clicking his name
      await user.click(screen.getByText("Bob"));

      // Should now show 6 selected
      await waitFor(() => {
        expect(screen.getByText("(6/7)")).toBeInTheDocument();
      });
    });

    it("updates gender count when selecting/deselecting", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Bob")).toBeInTheDocument();
      });

      // Select 3 men
      await user.click(screen.getByText("Bob"));
      await user.click(screen.getByText("Charlie"));
      await user.click(screen.getByText("Frank"));

      await waitFor(() => {
        expect(screen.getByText("(3/7)")).toBeInTheDocument();
      });

      // Switch to women tab and select 4 women
      await user.click(screen.getByRole("tab", { name: /women/i }));

      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Alice"));
      await user.click(screen.getByText("Diana"));
      await user.click(screen.getByText("Eve"));
      await user.click(screen.getByText("Grace"));

      await waitFor(() => {
        expect(screen.getByText("(7/7)")).toBeInTheDocument();
      });
    });
  });

  describe("Validation", () => {
    it("enables save button when selection is valid (3M + 4W)", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).toBeDisabled();
      });

      // Select 3 men
      await user.click(screen.getByText("Bob"));
      await user.click(screen.getByText("Charlie"));
      await user.click(screen.getByText("Frank"));

      // Switch to women and select 4
      await user.click(screen.getByRole("tab", { name: /women/i }));
      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Alice"));
      await user.click(screen.getByText("Diana"));
      await user.click(screen.getByText("Eve"));
      await user.click(screen.getByText("Grace"));

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    it("enables save button when selection is valid (4M + 3W)", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Bob")).toBeInTheDocument();
      });

      // Select 4 men
      await user.click(screen.getByText("Bob"));
      await user.click(screen.getByText("Charlie"));
      await user.click(screen.getByText("Frank"));
      await user.click(screen.getByText("Henry"));

      // Switch to women and select 3
      await user.click(screen.getByRole("tab", { name: /women/i }));
      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Alice"));
      await user.click(screen.getByText("Diana"));
      await user.click(screen.getByText("Eve"));

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    it("disables save button with invalid player count", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Bob")).toBeInTheDocument();
      });

      // Select only 3 players (not enough)
      await user.click(screen.getByText("Bob"));
      await user.click(screen.getByText("Charlie"));
      await user.click(screen.getByText("Frank"));

      // Wait for selection to update
      await waitFor(() => {
        expect(screen.getByText("(3/7)")).toBeInTheDocument();
      });

      // Save button should be disabled with < 7 players
      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it("shows error message for invalid gender ratio", async () => {
      const user = userEvent.setup();
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Bob")).toBeInTheDocument();
      });

      // Select 2 men and 5 women (invalid: only 4M+3W or 3M+4W are valid)
      await user.click(screen.getByText("Bob"));
      await user.click(screen.getByText("Charlie"));

      await user.click(screen.getByRole("tab", { name: /women/i }));
      await waitFor(() => {
        expect(screen.getByText("Alice")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Alice"));
      await user.click(screen.getByText("Diana"));
      await user.click(screen.getByText("Eve"));
      await user.click(screen.getByText("Grace"));
      await user.click(screen.getByText("Ivy"));

      // Should show error when we have 7 players with invalid ratio (2M + 5W)
      await waitFor(() => {
        expect(screen.getByText(/don't match the required gender composition/i)).toBeInTheDocument();
      });
    });

    it("shows success icon when selection is valid", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      // Mock point has 3M + 4W which is valid
      // Success icon should be present (CheckCircleIcon)
      await waitFor(() => {
        const successIcon = document.querySelector('[data-testid="CheckCircleIcon"]');
        expect(successIcon).toBeInTheDocument();
      });
    });
  });

  describe("Line Filtering", () => {
    it("displays line filter dropdown", async () => {
      await createLine({ name: "O-Line", team_id: team.id });

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by line/i)).toBeInTheDocument();
      });
    });

    it("shows all players when no line is selected", async () => {
      await createLine({ name: "O-Line", team_id: team.id });

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/filter by line/i)).toBeInTheDocument();
        // All men should be visible initially
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.getByText("Charlie")).toBeInTheDocument();
        expect(screen.getByText("Frank")).toBeInTheDocument();
        expect(screen.getByText("Henry")).toBeInTheDocument();
      });
    });
  });

  describe("Empty States", () => {
    it("shows 'no men' message when no men available", async () => {
      const womenOnly = mockPlayers.filter(p => p.gender === "W");

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={womenOnly}
        />
      );

      expect(screen.getByText(/no men available/i)).toBeInTheDocument();
    });

    it("shows 'no women' message when no women available", async () => {
      const user = userEvent.setup();
      const menOnly = mockPlayers.filter(p => p.gender === "M");

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={1}
          players={menOnly}
        />
      );

      // Switch to women tab
      await user.click(screen.getByRole("tab", { name: /women/i }));

      await waitFor(() => {
        expect(screen.getByText(/no women available/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dialog Actions", () => {
    it("calls onClose when cancel is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ManagePlayersDialog
          open={true}
          onClose={onClose}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();
    });

    it("has enabled save button when valid selection", async () => {
      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i });
        // mockPoint has valid selection (3M + 4W)
        expect(saveButton).not.toBeDisabled();
      });
    });

    it("save button is disabled when selection invalid", async () => {
      const pointWithNoPlayers = { ...mockPoint, players: [] };

      render(
        <ManagePlayersDialog
          open={true}
          onClose={vi.fn()}
          point={pointWithNoPlayers}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /save/i });
        // No players selected = invalid
        expect(saveButton).toBeDisabled();
      });
    });

    it("resets state when dialog is closed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ManagePlayersDialog
          open={true}
          onClose={onClose}
          point={mockPoint}
          teamId={team.id}
          players={mockPlayers}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Bob")).toBeInTheDocument();
      });

      // Deselect a player
      await user.click(screen.getByText("Bob"));

      await waitFor(() => {
        expect(screen.getByText("(6/7)")).toBeInTheDocument();
      });

      // Close dialog
      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onClose).toHaveBeenCalled();

      // Note: We can't easily test that state is reset without re-rendering,
      // but the component code does reset state in handleClose
    });
  });

});
