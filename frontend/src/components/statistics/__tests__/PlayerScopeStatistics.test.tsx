import { describe, it, expect } from "vitest";
import { render, screen, within } from "../../../test/test-utils";
import PlayerScopeStatistics from "../PlayerScopeStatistics";
import type { PlayerGameStats } from "../../../types";

const sampleTurnoverTypeStats = {
  all_points: {
    our_possession_turnovers: {
      total_turnovers: 2,
      by_type: {
        defended_pass: { count: 1, percentage: 0.5 },
        missed_pass: { count: 0, percentage: 0 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 1, percentage: 0.5 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
    opponent_possession_turnovers: {
      total_turnovers: 1,
      by_type: {
        defended_pass: { count: 0, percentage: 0 },
        missed_pass: { count: 1, percentage: 1 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 0, percentage: 0 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
  },
  started_on_offense: {
    our_possession_turnovers: {
      total_turnovers: 1,
      by_type: {
        defended_pass: { count: 1, percentage: 1 },
        missed_pass: { count: 0, percentage: 0 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 0, percentage: 0 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
    opponent_possession_turnovers: {
      total_turnovers: 0,
      by_type: {
        defended_pass: { count: 0, percentage: 0 },
        missed_pass: { count: 0, percentage: 0 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 0, percentage: 0 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
  },
  started_on_defense: {
    our_possession_turnovers: {
      total_turnovers: 1,
      by_type: {
        defended_pass: { count: 0, percentage: 0 },
        missed_pass: { count: 0, percentage: 0 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 1, percentage: 1 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
    opponent_possession_turnovers: {
      total_turnovers: 1,
      by_type: {
        defended_pass: { count: 0, percentage: 0 },
        missed_pass: { count: 1, percentage: 1 },
        defended_huck: { count: 0, percentage: 0 },
        missed_huck: { count: 0, percentage: 0 },
        drop: { count: 0, percentage: 0 },
        stall_out: { count: 0, percentage: 0 },
        miscommunication: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      },
    },
  },
} satisfies NonNullable<PlayerGameStats["turnover_type_stats"]>;

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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanHoldStat = screen.getByRole("group", { name: "Clean Hold" });
    expect(within(cleanHoldStat).getByText("33%")).toBeInTheDocument();
    expect(within(cleanHoldStat).getByText("1/3")).toBeInTheDocument();
    expect(within(cleanHoldStat).queryByText("1/2")).not.toBeInTheDocument();
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanBreakStat = screen.getByRole("group", { name: "Clean Break" });
    expect(within(cleanBreakStat).getByText("20%")).toBeInTheDocument();
    expect(within(cleanBreakStat).getByText("1/5")).toBeInTheDocument();
    expect(within(cleanBreakStat).queryByText("1/2")).not.toBeInTheDocument();
  });

  it("uses defensive turnover points as conversion denominator", () => {
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const conversionStat = screen.getByRole("group", { name: "Conversion" });
    expect(within(conversionStat).getByText("67%")).toBeInTheDocument();
    expect(within(conversionStat).getByText("2/3")).toBeInTheDocument();
    expect(within(conversionStat).queryByText("2/5")).not.toBeInTheDocument();
  });

  it("uses breaks as clean conversion denominator", () => {
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    const cleanConversionStat = screen.getByRole("group", { name: "Clean Conversion" });
    expect(within(cleanConversionStat).getByText("50%")).toBeInTheDocument();
    expect(within(cleanConversionStat).getByText("1/2")).toBeInTheDocument();
    expect(within(cleanConversionStat).queryByText("1/5")).not.toBeInTheDocument();
  });

  it("shows selected players and cohort explanation in multi-player mode", () => {
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
        points_lost_no_turnover: 1,
      },
    };

    render(
      <PlayerScopeStatistics
        playerName="2 players"
        teamName="Monkey"
        scopeLabel="Team"
        contextLabel="Monkey"
        cohortPlayerNames={["Alice", "Bob"]}
        stats={stats}
      />
    );

    expect(screen.getByText("Players: Alice, Bob")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stats are computed from points where all selected players were on the line together."
      )
    ).toBeInTheDocument();
  });

  it("renders on-field turnover totals for offense and defense", () => {
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
        our_turnovers: 2,
        opponent_turnovers: 1,
      },
      defense: {
        points_played: 5,
        points_won: 2,
        points_lost: 3,
        break_rate: 0.4,
        points_with_turnover: 3,
        turnover_rate: 0.6,
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
        points_lost_no_turnover: 1,
        our_turnovers: 1,
        opponent_turnovers: 4,
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

    expect(screen.getAllByText("Our turns")).toHaveLength(2);
    expect(screen.getAllByText("Opponent turns")).toHaveLength(2);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
  });

  it("renders turnover type statistics when provided", () => {
    const stats: PlayerGameStats = {
      player_id: 7,
      player_name: "Jane Doe",
      player_number: 12,
      points_played: 8,
      effective_time_seconds: 420,
      turnover_type_stats: sampleTurnoverTypeStats,
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
        conversion_rate: 2 / 3,
        points_won_no_turnover: 1,
        clean_break_rate: 0.2,
        clean_conversion_rate: 0.5,
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

    expect(screen.getByText("Turnover types")).toBeInTheDocument();
    expect(screen.getByText("All points")).toBeInTheDocument();
  });
});
