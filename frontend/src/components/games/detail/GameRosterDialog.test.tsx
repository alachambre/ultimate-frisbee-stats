import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "../../../test/test-utils";
import { GameRosterDialog } from "./GameRosterDialog";
import type { Player, PlayerGameStats } from "../../../types";

function buildPlayer(overrides: Partial<Player>): Player {
  return {
    id: overrides.id ?? 1,
    team_id: overrides.team_id ?? 1,
    name: overrides.name ?? "Player",
    number: overrides.number ?? null,
    gender: overrides.gender ?? "M",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00Z",
  };
}

function buildPlayerGameStats(overrides: Partial<PlayerGameStats>): PlayerGameStats {
  return {
    player_id: overrides.player_id ?? 1,
    player_name: overrides.player_name ?? "Player",
    player_number: overrides.player_number ?? null,
    points_played: overrides.points_played ?? 0,
    effective_time_seconds: overrides.effective_time_seconds ?? 0,
    offense: overrides.offense ?? {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      hold_rate: 0,
      points_won_no_turnover: 0,
      clean_hold_rate: 0,
    },
    defense: overrides.defense ?? {
      points_played: 0,
      points_won: 0,
      points_lost: 0,
      break_rate: 0,
      points_with_turnover: 0,
      turnover_rate: 0,
      conversion_rate: 0,
      points_won_no_turnover: 0,
      clean_break_rate: 0,
      clean_conversion_rate: 0,
      points_lost_no_turnover: 0,
    },
  };
}

describe("GameRosterDialog", () => {
  it("sorts each gender tab by points played descending", async () => {
    const user = userEvent.setup();
    const players = [
      buildPlayer({ id: 1, name: "Adam", gender: "M" }),
      buildPlayer({ id: 2, name: "Ben", gender: "M" }),
      buildPlayer({ id: 3, name: "Chloe", gender: "W" }),
      buildPlayer({ id: 4, name: "Dana", gender: "W" }),
    ];
    const liveStatsByPlayerId = new Map<number, PlayerGameStats>([
      [1, buildPlayerGameStats({ player_id: 1, player_name: "Adam", points_played: 2 })],
      [2, buildPlayerGameStats({ player_id: 2, player_name: "Ben", points_played: 5 })],
      [3, buildPlayerGameStats({ player_id: 3, player_name: "Chloe", points_played: 1 })],
      [4, buildPlayerGameStats({ player_id: 4, player_name: "Dana", points_played: 4 })],
    ]);

    render(
      <GameRosterDialog
        open
        onClose={() => {}}
        disabled={false}
        canManageRoster={false}
        players={players}
        liveStatsByPlayerId={liveStatsByPlayerId}
        getHighlight={() => null}
      />
    );

    const dialog = await screen.findByRole("dialog");

    const menButtons = within(dialog)
      .getAllByRole("button")
      .filter((button) => ["Adam", "Ben"].includes(button.getAttribute("aria-label") ?? ""))
      .map((button) => button.getAttribute("aria-label"));
    expect(menButtons).toEqual(["Ben", "Adam"]);

    await user.click(within(dialog).getByRole("tab", { name: /^women/i }));

    await waitFor(() => {
      const womenButtons = within(dialog)
        .getAllByRole("button")
        .filter((button) => ["Chloe", "Dana"].includes(button.getAttribute("aria-label") ?? ""))
        .map((button) => button.getAttribute("aria-label"));

      expect(womenButtons).toEqual(["Dana", "Chloe"]);
    });
  });
});
