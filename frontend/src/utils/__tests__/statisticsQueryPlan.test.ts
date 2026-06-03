import {
  buildStatisticsQueryPlan,
  buildStatisticsRefreshQueryKeys,
  type StatisticsQueryAccess,
} from "../statisticsQueryPlan";
import { queryKeys } from "../queryKeys";

const fullAccess: StatisticsQueryAccess = {
  canViewTeamStatistics: true,
  canViewStrategyStatistics: true,
  canViewPlayerStatistics: true,
};

describe("statisticsQueryPlan", () => {
  it("builds statistics query keys from the selected scope", () => {
    const plan = buildStatisticsQueryPlan({
      teamId: 7,
      competitionIds: [2, 1],
      gameIds: [5],
      playerIds: [11, 9],
      selectedGameId: 42,
      activeTab: "team",
      isPlayerFilterOpen: false,
      access: fullAccess,
    });

    expect(plan.queryKeys.teamStats).toEqual(
      queryKeys.teamTeamStatistics(7, [2, 1], [5], [11, 9])
    );
    expect(plan.queryKeys.teamEvolution).toEqual(
      queryKeys.teamEvolutionStatistics(7, [2, 1], [5], [11, 9])
    );
    expect(plan.queryKeys.teamPlayerStats).toEqual(
      queryKeys.teamPlayerStatistics(7, [2, 1], [5], [11, 9])
    );
    expect(plan.queryKeys.teamStrategyStats).toEqual(
      queryKeys.teamStrategyStatistics(7, [2, 1], [5], [11, 9])
    );
    expect(plan.queryKeys.gamePointTimeline).toEqual(
      queryKeys.gamePointTimeline(42, [11, 9])
    );
  });

  it("gates statistics queries by team, permissions, active tab, and player filter state", () => {
    expect(
      buildStatisticsQueryPlan({
        teamId: undefined,
        competitionIds: [],
        gameIds: [],
        playerIds: [],
        selectedGameId: undefined,
        activeTab: "team",
        isPlayerFilterOpen: false,
        access: fullAccess,
      }).enabled
    ).toEqual({
      teamStats: false,
      teamEvolution: false,
      teamPlayerStats: false,
      teamStrategyStats: false,
      gamePointTimeline: false,
    });

    expect(
      buildStatisticsQueryPlan({
        teamId: 7,
        competitionIds: [],
        gameIds: [],
        playerIds: [],
        selectedGameId: 42,
        activeTab: "players",
        isPlayerFilterOpen: false,
        access: fullAccess,
      }).enabled
    ).toEqual({
      teamStats: false,
      teamEvolution: false,
      teamPlayerStats: true,
      teamStrategyStats: false,
      gamePointTimeline: true,
    });

    expect(
      buildStatisticsQueryPlan({
        teamId: 7,
        competitionIds: [],
        gameIds: [],
        playerIds: [],
        selectedGameId: undefined,
        activeTab: "team",
        isPlayerFilterOpen: true,
        access: {
          ...fullAccess,
          canViewPlayerStatistics: false,
        },
      }).enabled.teamPlayerStats
    ).toBe(false);
  });

  it("loads player stats while the player filter is open", () => {
    const plan = buildStatisticsQueryPlan({
      teamId: 7,
      competitionIds: [],
      gameIds: [],
      playerIds: [],
      selectedGameId: undefined,
      activeTab: "team",
      isPlayerFilterOpen: true,
      access: fullAccess,
    });

    expect(plan.enabled.teamStats).toBe(true);
    expect(plan.enabled.teamPlayerStats).toBe(true);
  });

  it("can enable several statistics sections for a single-scroll page", () => {
    const plan = buildStatisticsQueryPlan({
      teamId: 7,
      competitionIds: [],
      gameIds: [],
      playerIds: [],
      selectedGameId: undefined,
      activeTab: "team",
      enabledTabs: ["team", "evolution", "strategies", "players"],
      isPlayerFilterOpen: false,
      access: fullAccess,
    });

    expect(plan.enabled.teamStats).toBe(true);
    expect(plan.enabled.teamEvolution).toBe(true);
    expect(plan.enabled.teamStrategyStats).toBe(true);
    expect(plan.enabled.teamPlayerStats).toBe(true);
  });

  it("builds refresh keys for selected statistics data", () => {
    const plan = buildStatisticsQueryPlan({
      teamId: 7,
      competitionIds: [1],
      gameIds: [5],
      playerIds: [9],
      selectedGameId: 42,
      activeTab: "team",
      isPlayerFilterOpen: false,
      access: fullAccess,
    });

    expect(buildStatisticsRefreshQueryKeys(plan)).toEqual([
      queryKeys.teams,
      queryKeys.competitionsByTeam(7),
      queryKeys.games,
      plan.queryKeys.teamStats,
      plan.queryKeys.teamEvolution,
      plan.queryKeys.teamPlayerStats,
      plan.queryKeys.teamStrategyStats,
      plan.queryKeys.gamePointTimeline,
    ]);

    expect(
      buildStatisticsRefreshQueryKeys({
        ...plan,
        teamId: undefined,
      })
    ).toEqual([]);
  });
});
