import type { QueryKey } from "@tanstack/react-query";
import type { CompetitionStatisticsTab } from "../components/statistics/CompetitionStatisticsTabs";
import { queryKeys } from "./queryKeys";

export interface StatisticsQueryAccess {
  canViewTeamStatistics: boolean;
  canViewStrategyStatistics: boolean;
  canViewPlayerStatistics: boolean;
}

interface StatisticsQueryPlanInput {
  teamId?: number;
  competitionIds: number[];
  gameIds: number[];
  playerIds: number[];
  selectedGameId?: number;
  activeTab: CompetitionStatisticsTab;
  enabledTabs?: CompetitionStatisticsTab[];
  isPlayerFilterOpen: boolean;
  access: StatisticsQueryAccess;
}

interface StatisticsQueryEnabled {
  teamStats: boolean;
  teamEvolution: boolean;
  teamPlayerStats: boolean;
  teamStrategyStats: boolean;
  gamePointTimeline: boolean;
}

interface StatisticsQueryKeys {
  teamStats: QueryKey;
  teamEvolution: QueryKey;
  teamPlayerStats: QueryKey;
  teamStrategyStats: QueryKey;
  gamePointTimeline: QueryKey;
}

export interface StatisticsQueryPlan {
  teamId?: number;
  selectedGameId?: number;
  enabled: StatisticsQueryEnabled;
  queryKeys: StatisticsQueryKeys;
}

export function buildStatisticsQueryPlan({
  teamId,
  competitionIds,
  gameIds,
  playerIds,
  selectedGameId,
  activeTab,
  enabledTabs,
  isPlayerFilterOpen,
  access,
}: StatisticsQueryPlanInput): StatisticsQueryPlan {
  const effectiveTeamId = teamId ?? 0;
  const hasTeam = teamId !== undefined;
  const enabledTabSet = new Set(enabledTabs ?? [activeTab]);
  const shouldLoadTab = (tab: CompetitionStatisticsTab) => enabledTabSet.has(tab);

  return {
    teamId,
    selectedGameId,
    enabled: {
      teamStats: hasTeam && access.canViewTeamStatistics && shouldLoadTab("team"),
      teamEvolution:
        hasTeam && access.canViewTeamStatistics && shouldLoadTab("evolution"),
      teamPlayerStats:
        hasTeam &&
        access.canViewPlayerStatistics &&
        (shouldLoadTab("players") || isPlayerFilterOpen),
      teamStrategyStats:
        hasTeam && access.canViewStrategyStatistics && shouldLoadTab("strategies"),
      gamePointTimeline: selectedGameId !== undefined && access.canViewTeamStatistics,
    },
    queryKeys: {
      teamStats: queryKeys.teamTeamStatistics(
        effectiveTeamId,
        competitionIds,
        gameIds,
        playerIds
      ),
      teamEvolution: queryKeys.teamEvolutionStatistics(
        effectiveTeamId,
        competitionIds,
        gameIds,
        playerIds
      ),
      teamPlayerStats: queryKeys.teamPlayerStatistics(
        effectiveTeamId,
        competitionIds,
        gameIds,
        playerIds
      ),
      teamStrategyStats: queryKeys.teamStrategyStatistics(
        effectiveTeamId,
        competitionIds,
        gameIds,
        playerIds
      ),
      gamePointTimeline: queryKeys.gamePointTimeline(selectedGameId ?? 0, playerIds),
    },
  };
}

export function buildStatisticsRefreshQueryKeys(plan: StatisticsQueryPlan): QueryKey[] {
  if (plan.teamId === undefined) {
    return [];
  }

  const refreshQueryKeys: QueryKey[] = [
    queryKeys.teams,
    queryKeys.competitionsByTeam(plan.teamId),
    queryKeys.games,
    plan.queryKeys.teamStats,
    plan.queryKeys.teamEvolution,
    plan.queryKeys.teamPlayerStats,
    plan.queryKeys.teamStrategyStats,
  ];

  if (plan.selectedGameId !== undefined) {
    refreshQueryKeys.push(plan.queryKeys.gamePointTimeline);
  }

  return refreshQueryKeys;
}
