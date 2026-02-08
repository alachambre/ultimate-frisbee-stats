import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/test-utils";
import PlayerScopeStatistics from "../PlayerScopeStatistics";
import type { PlayerGameStats } from "../../../types";

describe("PlayerScopeStatistics", () => {
  it("uses offense played points as clean hold count denominator", () => {
    const stats: PlayerGameStats = {
      player_id: 7,
      player_name: "Jane Doe",
      player_number: 12,
      points_played: 8,
      effective_time_seconds: 420,
      offense: {
        points_played: 3,
        points_won: 2,
        points_lost: 1,
        hold_rate: 0.667,
        points_won_no_turnover: 1,
        clean_hold_rate: 0.333,
      },
      defense: {
        points_played: 5,
        points_won: 2,
        points_lost: 3,
        break_rate: 0.4,
        points_with_turnover: 3,
        turnover_rate: 0.6,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        points_lost_no_turnover: 1,
      },
    };

    render(
      <PlayerScopeStatistics
        playerName="Jane Doe"
        playerNumber={12}
        teamName="Monkey"
        scopeLabel="Team"
        contextLabel="Monkey"
        stats={stats}
      />
    );

    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.queryByText("1/2")).not.toBeInTheDocument();
  });

  it("uses all defense points as clean break count denominator", () => {
    const stats: PlayerGameStats = {
      player_id: 7,
      player_name: "Jane Doe",
      player_number: 12,
      points_played: 8,
      effective_time_seconds: 420,
      offense: {
        points_played: 3,
        points_won: 2,
        points_lost: 1,
        hold_rate: 0.667,
        points_won_no_turnover: 0,
        clean_hold_rate: 0,
      },
      defense: {
        points_played: 5,
        points_won: 2,
        points_lost: 3,
        break_rate: 0.4,
        points_with_turnover: 3,
        turnover_rate: 0.6,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        points_lost_no_turnover: 1,
      },
    };

    render(
      <PlayerScopeStatistics
        playerName="Jane Doe"
        playerNumber={12}
        teamName="Monkey"
        scopeLabel="Team"
        contextLabel="Monkey"
        stats={stats}
      />
    );

    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("1/5")).toBeInTheDocument();
    expect(screen.queryByText("1/2")).not.toBeInTheDocument();
  });
});
