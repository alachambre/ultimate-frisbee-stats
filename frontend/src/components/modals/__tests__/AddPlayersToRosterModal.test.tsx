import { render, screen, waitFor } from "../../../test/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import AddPlayersToRosterModal from "../AddPlayersToRosterModal";
import { createTeam, createPlayer, createCompetition, addPlayersToRoster } from "../../../services";
import type { Player } from "../../../types";

describe("AddPlayersToRosterModal", () => {
  let teamId: number;
  let competitionId: number;
  let players: Player[];

  beforeEach(async () => {
    const team = await createTeam({ name: "Test Team" });
    teamId = team.id;
    const competition = await createCompetition({
      team_id: teamId,
      name: "Test Competition",
      description: "Test",
      start_date: "2024-06-01",
      end_date: "2024-06-30",
    });
    competitionId = competition.id;
    const playerOne = await createPlayer({ team_id: teamId, name: "Player One", number: 10, gender: "M" });
    const playerTwo = await createPlayer({ team_id: teamId, name: "Player Two", number: 20, gender: "W" });
    const playerThree = await createPlayer({ team_id: teamId, name: "Player Three", number: 30, gender: "M" });
    players = [playerOne, playerTwo, playerThree];
  });

  it("displays team players in manage roster modal", async () => {
    const user = userEvent.setup();
    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText("Player Three")).toBeInTheDocument();

    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    await waitFor(() => {
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });
  });

  it("preselects roster players and disables save when unchanged", async () => {
    const user = userEvent.setup();
    await addPlayersToRoster(competitionId, [players[0].id]);

    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[players[0].id]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    const playerOneButton = screen.getByRole("button", { name: "Player One" });
    expect(playerOneButton).toHaveAttribute("aria-pressed", "true");

    await user.click(playerOneButton);
    expect(saveButton).toBeEnabled();
  });

  it("shows empty message when team has no players", async () => {
    const emptyTeam = await createTeam({ name: "Empty Team" });
    const emptyCompetition = await createCompetition({
      team_id: emptyTeam.id,
      name: "Empty Competition",
      description: "No players",
      start_date: "2024-07-01",
      end_date: "2024-07-02",
    });

    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={emptyCompetition.id}
        teamId={emptyTeam.id}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("No team players available")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("allows selecting and unselecting players with cards", async () => {
    const user = userEvent.setup();
    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    expect(submitButton).toBeDisabled();

    const player1 = screen.getByRole("button", { name: "Player One" });
    await user.click(player1);
    expect(submitButton).toBeEnabled();

    const womenTab = screen.getByRole("tab", { name: /women/i });
    await user.click(womenTab);

    await waitFor(() => {
      expect(screen.getByText("Player Two")).toBeInTheDocument();
    });

    const player2 = screen.getByRole("button", { name: "Player Two" });
    await user.click(player2);
    expect(submitButton).toBeEnabled();
  });

  it("disables submit button when there are no changes", async () => {
    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={vi.fn()}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /save changes/i });
    expect(submitButton).toBeDisabled();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={onClose}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("adds selected players successfully", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AddPlayersToRosterModal
        isOpen={true}
        onClose={onClose}
        competitionId={competitionId}
        teamId={teamId}
        currentRosterIds={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Manage Competition Roster")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Player One")).toBeInTheDocument();
    }, { timeout: 3000 });

    const player1 = screen.getByRole("button", { name: "Player One" });
    await user.click(player1);

    const submitButton = await screen.findByRole("button", { name: /save changes/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
