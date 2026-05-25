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
    date:
      "date" in overrides ? overrides.date : "2026-05-22T10:00:00Z",
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
    start_date: overrides.start_date ?? "2026-05-01",
    end_date: overrides.end_date ?? "2026-05-31",
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

  it("sorts undated recent games after dated recent games", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({
          id: 1,
          competition_id: 10,
          status: "ended",
          date: null,
        }),
        game({
          id: 2,
          competition_id: 10,
          status: "ended",
          date: "2026-05-21T10:00:00Z",
        }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [competition({ id: 10, team_id: 1 })],
    });

    expect(dashboard.recentGames.map((item) => item.id)).toEqual([2, 1]);
  });

  it("groups games by competition with active competitions first", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({
          id: 1,
          competition_id: 10,
          competition_name: "Spring Cup",
          status: "ended",
          date: "2026-05-20T10:00:00Z",
          our_score: 13,
          opponent_score: 8,
        }),
        game({
          id: 2,
          competition_id: 20,
          competition_name: "Winter League",
          status: "ended",
          date: "2026-04-18T10:00:00Z",
          our_score: 7,
          opponent_score: 8,
        }),
        game({
          id: 3,
          competition_id: 10,
          competition_name: "Spring Cup",
          status: "started",
          date: "2026-05-22T10:00:00Z",
          our_score: 4,
          opponent_score: 3,
        }),
        game({
          id: 4,
          competition_id: 10,
          competition_name: "Spring Cup",
          status: "ready",
          date: "2026-05-23T10:00:00Z",
        }),
        game({
          id: 5,
          competition_id: 30,
          competition_name: "Summer Open",
          status: "ready",
          date: "2026-05-21T10:00:00Z",
        }),
        game({
          id: 6,
          competition_id: 40,
          competition_name: "Old Cup",
          status: "ended",
          date: "2026-05-01T10:00:00Z",
          our_score: 9,
          opponent_score: 9,
        }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [
        competition({
          id: 10,
          team_id: 1,
          name: "Spring Cup",
          start_date: "2026-05-01",
          end_date: "2026-05-31",
        }),
        competition({
          id: 20,
          team_id: 1,
          name: "Winter League",
          start_date: "2026-04-01",
          end_date: "2026-04-30",
        }),
        competition({
          id: 30,
          team_id: 1,
          name: "Summer Open",
          start_date: "2026-05-20",
          end_date: "2026-05-28",
        }),
        competition({
          id: 40,
          team_id: 1,
          name: "Old Cup",
          start_date: "2026-05-01",
          end_date: "2026-05-02",
        }),
      ],
    });

    expect(
      dashboard.competitionGroups.map((group) => group.competitionId)
    ).toEqual([30, 10, 40, 20]);
    expect(dashboard.competitionGroups[0]).toEqual(
      expect.objectContaining({
        competitionId: 30,
        competitionName: "Summer Open",
        isInitiallyExpanded: true,
        nextRelevantDate: "2026-05-21T10:00:00Z",
      })
    );
    expect(dashboard.competitionGroups[1]).toEqual(
      expect.objectContaining({
        competitionId: 10,
        competitionName: "Spring Cup",
        isInitiallyExpanded: true,
        games: [
          expect.objectContaining({ id: 3 }),
          expect.objectContaining({ id: 4 }),
          expect.objectContaining({ id: 1 }),
        ],
        summary: expect.objectContaining({
          live: 1,
          upcoming: 1,
          completed: 1,
          wins: 1,
          losses: 0,
          draws: 0,
        }),
      })
    );
    expect(dashboard.competitionGroups[2]).toEqual(
      expect.objectContaining({
        competitionId: 40,
        isInitiallyExpanded: false,
        mostRecentDate: "2026-05-01T10:00:00Z",
        summary: expect.objectContaining({
          live: 0,
          upcoming: 0,
          completed: 1,
          wins: 0,
          losses: 0,
          draws: 1,
        }),
      })
    );
  });

  it("includes selected-team competitions that do not have games", () => {
    const emptyCompetition = competition({
      id: 20,
      team_id: 1,
      name: "Fresh Tournament",
      start_date: "2026-06-01",
      end_date: "2026-06-02",
    });
    const dashboard = buildNewGamesDashboard({
      games: [game({ id: 1, competition_id: 10, status: "ready" })],
      selectedTeamId: 1,
      teamCompetitions: [
        competition({ id: 10, team_id: 1, name: "Spring Cup" }),
        emptyCompetition,
      ],
    });

    expect(
      dashboard.competitionGroups.map((group) => group.competitionId)
    ).toContain(20);
    expect(
      dashboard.competitionGroups.find((group) => group.competitionId === 20)
    ).toEqual(
      expect.objectContaining({
        competition: emptyCompetition,
        competitionName: "Fresh Tournament",
        games: [],
        startDate: "2026-06-01",
        endDate: "2026-06-02",
        summary: {
          live: 0,
          upcoming: 0,
          completed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        },
      })
    );
    expect(dashboard.summary.totalGames).toBe(1);
    expect(dashboard.summary.competitions).toBe(2);
  });

  it("does not include empty competitions during opponent search", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({
          id: 1,
          competition_id: 10,
          competition_name: "Spring Cup",
          opponent_name: "Blue Tigers",
          status: "ready",
        }),
        game({
          id: 2,
          competition_id: 10,
          competition_name: "Spring Cup",
          opponent_name: "Red Hawks",
          status: "ready",
        }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [
        competition({ id: 10, team_id: 1, name: "Spring Cup" }),
        competition({ id: 20, team_id: 1, name: "Empty Cup" }),
      ],
      opponentSearch: "blue",
    });

    expect(
      dashboard.competitionGroups.map((group) => group.competitionId)
    ).toEqual([10]);
    expect(dashboard.competitionGroups[0].games.map((item) => item.id)).toEqual([
      1,
    ]);
  });

  it("filters competition groups by opponent search", () => {
    const dashboard = buildNewGamesDashboard({
      games: [
        game({
          id: 1,
          competition_id: 10,
          competition_name: "Spring Cup",
          opponent_name: "Blue Tigers",
          status: "started",
        }),
        game({
          id: 2,
          competition_id: 10,
          competition_name: "Spring Cup",
          opponent_name: "Red Hawks",
          status: "ready",
        }),
        game({
          id: 3,
          competition_id: 20,
          competition_name: "Winter League",
          opponent_name: "Green Foxes",
          status: "ended",
        }),
      ],
      selectedTeamId: 1,
      teamCompetitions: [
        competition({ id: 10, team_id: 1, name: "Spring Cup" }),
        competition({ id: 20, team_id: 1, name: "Winter League" }),
      ],
      opponentSearch: "blue",
    });

    expect(dashboard.allGames.map((item) => item.id)).toEqual([1]);
    expect(dashboard.summary.totalGames).toBe(1);
    expect(dashboard.summary.wins).toBe(0);
    expect(dashboard.competitionGroups).toHaveLength(1);
    expect(dashboard.competitionGroups[0]).toEqual(
      expect.objectContaining({
        competitionId: 10,
        games: [expect.objectContaining({ opponent_name: "Blue Tigers" })],
      })
    );
  });
});
