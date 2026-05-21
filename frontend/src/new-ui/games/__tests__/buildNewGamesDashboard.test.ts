import { describe, expect, it } from "vitest";
import type { CompetitionWithTeam, GameWithScore } from "../../../types";
import { buildNewGamesDashboard } from "../buildNewGamesDashboard";

function game(
  overrides: Partial<GameWithScore> &
    Pick<GameWithScore, "id" | "competition_id" | "status">
): GameWithScore {
  return {
    id: overrides.id,
    competition_id: overrides.competition_id,
    opponent_name: overrides.opponent_name ?? `Opponent ${overrides.id}`,
    date: overrides.date ?? "2026-05-22T10:00:00Z",
    comments: null,
    status: overrides.status,
    start_datetime: null,
    end_datetime: null,
    created_at: "2026-05-01T00:00:00Z",
    our_score: overrides.our_score ?? 0,
    opponent_score: overrides.opponent_score ?? 0,
    team_name: overrides.team_name ?? "Monkey Stats",
    competition_name: overrides.competition_name ?? "Spring Cup",
  };
}

function competition(
  overrides: Partial<CompetitionWithTeam> &
    Pick<CompetitionWithTeam, "id" | "team_id">
): CompetitionWithTeam {
  return {
    id: overrides.id,
    team_id: overrides.team_id,
    team_name: overrides.team_name ?? "Monkey Stats",
    name: overrides.name ?? `Competition ${overrides.id}`,
    description: null,
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    status: "ongoing",
    created_at: "2026-05-01T00:00:00Z",
  };
}

describe("buildNewGamesDashboard", () => {
  it("filters games by selected team competitions", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({ id: 1, competition_id: 10, status: "started" }),
        game({ id: 2, competition_id: 20, status: "ended" }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [competition({ id: 10, team_id: 1 })],
    });

    expect(dashboard.allGames.map((item) => item.id)).toEqual([1]);
    expect(dashboard.summary.totalGames).toBe(1);
  });

  it("keeps all public games when no team is selected", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({ id: 1, competition_id: 10, status: "started" }),
        game({ id: 2, competition_id: 20, status: "ended" }),
      ],
      selectedTeamId: undefined,
      teamCompetitions: undefined,
    });

    expect(dashboard.allGames.map((item) => item.id)).toEqual([1, 2]);
    expect(dashboard.hasTeamScope).toBe(false);
  });

  it("splits live, upcoming, and recent games with stable sorting", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({
          id: 1,
          competition_id: 10,
          status: "ended",
          date: "2026-05-20T10:00:00Z",
          our_score: 13,
          opponent_score: 8,
        }),
        game({
          id: 2,
          competition_id: 10,
          status: "ready",
          date: "2026-05-25T10:00:00Z",
        }),
        game({
          id: 3,
          competition_id: 10,
          status: "started",
          date: "2026-05-22T10:00:00Z",
          our_score: 4,
          opponent_score: 3,
        }),
        game({
          id: 4,
          competition_id: 10,
          status: "ended",
          date: "2026-05-21T10:00:00Z",
          our_score: 8,
          opponent_score: 10,
        }),
        game({
          id: 5,
          competition_id: 10,
          status: "ready",
          date: "2026-05-23T10:00:00Z",
        }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [competition({ id: 10, team_id: 1 })],
    });

    expect(dashboard.liveGames.map((item) => item.id)).toEqual([3]);
    expect(dashboard.upcomingGames.map((item) => item.id)).toEqual([5, 2]);
    expect(dashboard.recentGames.map((item) => item.id)).toEqual([4, 1]);
    expect(dashboard.summary.wins).toBe(1);
    expect(dashboard.summary.losses).toBe(1);
    expect(dashboard.summary.draws).toBe(0);
  });
});
