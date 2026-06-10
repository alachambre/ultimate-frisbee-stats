import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getAllGames, getCompetitions, getTeams } from "../../services";
import {
  downloadTeamStatisticsCSV,
  getGamePointTimeline,
  getTeamEvolutionStatistics,
  getTeamPlayerStatistics,
  getTeamStrategyStatistics,
  getTeamTeamStatistics,
  type StatisticsDatasetFilters,
  type StatisticsExportDetailMode,
} from "../../services/statistics";
import { buildStatisticsDatasetView } from "../../utils/statisticsDatasetView";
import { invalidateQueryKeys } from "../../utils/queryInvalidation";
import {
  buildStatisticsQueryPlan,
  buildStatisticsRefreshQueryKeys,
} from "../../utils/statisticsQueryPlan";
import { queryKeys } from "../../utils/queryKeys";
import {
  mergeStatisticsSelection,
  parseStatisticsId,
  parseStatisticsSelection,
  serializeStatisticsSelection,
  type StatisticsSelection,
} from "../../utils/statisticsSelection";
import type { CompetitionStatisticsTab } from "../../components/statistics/CompetitionStatisticsTabs";
import type { TeamWithPlayers } from "../../types";

interface StatisticsPageAccess {
  canViewTeamStatistics: boolean;
  canViewStrategyStatistics: boolean;
  canViewPlayerStatistics: boolean;
  canFilterStatisticsByPlayers: boolean;
  canExportStatistics: boolean;
}

interface StatisticsPageQueryOptions {
  activeTab: CompetitionStatisticsTab;
  enabledTabs?: CompetitionStatisticsTab[];
  isPlayerFilterOpen: boolean;
  controlledTeamId?: number;
  controlledTeams?: TeamWithPlayers[];
  isTeamSelectionControlled?: boolean;
}

const STICKY_TEAM_KEY = "statistics:selectedTeamId";
const EMPTY_IDS: number[] = [];

function buildDatasetFilters(selection: StatisticsSelection): StatisticsDatasetFilters {
  return {
    competitionIds: selection.competitionIds,
    gameIds: selection.gameIds,
    playerIds: selection.playerIds,
  };
}

export function useStatisticsPageData(
  access: StatisticsPageAccess,
  queryOptions: StatisticsPageQueryOptions
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const parsedSelection = useMemo(
    () => parseStatisticsSelection(searchParams),
    [searchParams]
  );
  const isTeamSelectionControlled =
    queryOptions.isTeamSelectionControlled ?? false;
  const teamId = isTeamSelectionControlled
    ? queryOptions.controlledTeamId
    : parsedSelection.teamId;
  const selection = useMemo(
    () => ({
      ...parsedSelection,
      teamId,
    }),
    [parsedSelection, teamId]
  );

  const competitionIds = selection.competitionIds;
  const gameIds = selection.gameIds;
  const playerIds = access.canFilterStatisticsByPlayers ? selection.playerIds : EMPTY_IDS;
  const statisticsFilters = buildDatasetFilters({
    ...selection,
    playerIds,
  });

  const updateSelection = useCallback(
    (updates: Partial<StatisticsSelection>, options?: { replace?: boolean }) => {
      const currentSelection: StatisticsSelection = {
        teamId,
        competitionIds,
        gameIds,
        playerIds,
      };
      const merged = mergeStatisticsSelection(currentSelection, updates);

      const nextSearchParams = serializeStatisticsSelection(merged);
      if (isTeamSelectionControlled) {
        nextSearchParams.delete("teamId");
      }

      setSearchParams(nextSearchParams, {
        replace: options?.replace,
      });
    },
    [
      competitionIds,
      gameIds,
      isTeamSelectionControlled,
      playerIds,
      setSearchParams,
      teamId,
    ]
  );

  const {
    data: queriedTeams,
    isLoading: isLoadingQueriedTeams,
    error: queriedTeamsError,
  } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
    enabled: queryOptions.controlledTeams === undefined,
  });
  const teams = queryOptions.controlledTeams ?? queriedTeams;
  const isLoadingTeams =
    queryOptions.controlledTeams === undefined ? isLoadingQueriedTeams : false;
  const teamsError =
    queryOptions.controlledTeams === undefined ? queriedTeamsError : null;

  const {
    data: competitions,
    isLoading: isLoadingCompetitions,
    error: competitionsError,
  } = useQuery({
    queryKey: queryKeys.competitionsByTeam(teamId ?? 0),
    queryFn: () => getCompetitions(teamId as number),
    enabled: teamId !== undefined,
  });

  const {
    data: allGames,
    isLoading: isLoadingAllGames,
    error: allGamesError,
  } = useQuery({
    queryKey: queryKeys.games,
    queryFn: getAllGames,
    enabled: teamId !== undefined,
  });

  const baseStatisticsQueryPlan = useMemo(
    () =>
      buildStatisticsQueryPlan({
        teamId,
        competitionIds,
        gameIds,
        playerIds,
        selectedGameId: undefined,
        activeTab: queryOptions.activeTab,
        enabledTabs: queryOptions.enabledTabs,
        isPlayerFilterOpen: queryOptions.isPlayerFilterOpen,
        access,
      }),
    [
      access,
      competitionIds,
      gameIds,
      playerIds,
      queryOptions.activeTab,
      queryOptions.enabledTabs,
      queryOptions.isPlayerFilterOpen,
      teamId,
    ]
  );

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    isFetching: isFetchingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: baseStatisticsQueryPlan.queryKeys.teamStats,
    queryFn: () => getTeamTeamStatistics(teamId as number, statisticsFilters),
    enabled: baseStatisticsQueryPlan.enabled.teamStats,
    placeholderData: keepPreviousData,
  });

  const {
    data: teamEvolution,
    isLoading: isLoadingTeamEvolution,
    isFetching: isFetchingTeamEvolution,
    error: teamEvolutionError,
  } = useQuery({
    queryKey: baseStatisticsQueryPlan.queryKeys.teamEvolution,
    queryFn: () => getTeamEvolutionStatistics(teamId as number, statisticsFilters),
    enabled: baseStatisticsQueryPlan.enabled.teamEvolution,
    placeholderData: keepPreviousData,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    isFetching: isFetchingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: baseStatisticsQueryPlan.queryKeys.teamPlayerStats,
    queryFn: () => getTeamPlayerStatistics(teamId as number, statisticsFilters),
    enabled: baseStatisticsQueryPlan.enabled.teamPlayerStats,
    placeholderData: keepPreviousData,
  });

  const statisticsView = useMemo(
    () =>
      buildStatisticsDatasetView({
        teams,
        competitions,
        allGames,
        teamPlayerStats,
        selection: {
          teamId,
          competitionIds,
          gameIds,
          playerIds,
        },
      }),
    [allGames, competitionIds, competitions, gameIds, playerIds, teamId, teamPlayerStats, teams]
  );

  const {
    sortedTeams,
    selectedTeam,
    competitionsForTeam,
    competitionIdsForTeam,
    teamGames,
    availableGames,
    selectedCompetitions,
    selectedCompetition,
    selectedGames,
    selectedGame,
    selectedDatasetGames,
    playersForTeam,
    selectedPlayers,
    selectedPlayer,
    playerStatsById,
  } = statisticsView;

  const statisticsQueryPlan = useMemo(
    () =>
      buildStatisticsQueryPlan({
        teamId,
        competitionIds,
        gameIds,
        playerIds,
        selectedGameId: selectedGame?.id,
        activeTab: queryOptions.activeTab,
        enabledTabs: queryOptions.enabledTabs,
        isPlayerFilterOpen: queryOptions.isPlayerFilterOpen,
        access,
      }),
    [
      access,
      competitionIds,
      gameIds,
      playerIds,
      queryOptions.activeTab,
      queryOptions.enabledTabs,
      queryOptions.isPlayerFilterOpen,
      selectedGame?.id,
      teamId,
    ]
  );

  const {
    data: teamStrategyStats,
    isLoading: isLoadingTeamStrategyStats,
    isFetching: isFetchingTeamStrategyStats,
    error: teamStrategyStatsError,
  } = useQuery({
    queryKey: statisticsQueryPlan.queryKeys.teamStrategyStats,
    queryFn: () => getTeamStrategyStatistics(teamId as number, statisticsFilters),
    enabled: statisticsQueryPlan.enabled.teamStrategyStats,
    placeholderData: keepPreviousData,
  });

  const {
    data: gamePointTimeline,
    isLoading: isLoadingGamePointTimeline,
    isFetching: isFetchingGamePointTimeline,
    error: gamePointTimelineError,
  } = useQuery({
    queryKey: statisticsQueryPlan.queryKeys.gamePointTimeline,
    queryFn: () => getGamePointTimeline(selectedGame!.id, playerIds),
    enabled: statisticsQueryPlan.enabled.gamePointTimeline,
    placeholderData: keepPreviousData,
  });

  const controlsError = competitionsError || allGamesError;
  const controlsLoading =
    teamId !== undefined && (isLoadingCompetitions || isLoadingAllGames);
  const isPlayerOptionsLoading =
    access.canFilterStatisticsByPlayers &&
    teamId !== undefined &&
    queryOptions.isPlayerFilterOpen &&
    isFetchingTeamPlayerStats;

  const canExport = teamId !== undefined && access.canExportStatistics;
  const shouldShowFieldSideStats = selectedGames.length === 1;
  const isRefreshingStatistics =
    isManualRefreshing ||
    isFetchingTeamStats ||
    isFetchingTeamEvolution ||
    isFetchingTeamPlayerStats ||
    isFetchingTeamStrategyStats ||
    isFetchingGamePointTimeline;

  useEffect(() => {
    if (!access.canFilterStatisticsByPlayers && selection.playerIds.length > 0) {
      updateSelection({ playerIds: [] }, { replace: true });
    }
  }, [access.canFilterStatisticsByPlayers, selection.playerIds.length, updateSelection]);

  useEffect(() => {
    if (isTeamSelectionControlled || !teams || teamId !== undefined) {
      return;
    }

    const persistedTeamId = parseStatisticsId(localStorage.getItem(STICKY_TEAM_KEY));
    if (
      persistedTeamId !== undefined &&
      teams.some((team) => team.id === persistedTeamId)
    ) {
      updateSelection({ teamId: persistedTeamId }, { replace: true });
    }
  }, [isTeamSelectionControlled, teamId, teams, updateSelection]);

  useEffect(() => {
    if (isTeamSelectionControlled || teamId === undefined) {
      return;
    }

    localStorage.setItem(STICKY_TEAM_KEY, String(teamId));
  }, [isTeamSelectionControlled, teamId]);

  useEffect(() => {
    if (teamId === undefined || controlsLoading || controlsError) {
      return;
    }

    const validCompetitionIds = competitionIds.filter((id) => competitionIdsForTeam.has(id));
    const validGameIds = gameIds.filter((id) => availableGames.some((game) => game.id === id));
    const validPlayerIds = playerIds.filter((id) =>
      playersForTeam.some((player) => player.id === id)
    );

    if (
      validCompetitionIds.length !== competitionIds.length ||
      validGameIds.length !== gameIds.length ||
      validPlayerIds.length !== playerIds.length
    ) {
      updateSelection(
        {
          competitionIds: validCompetitionIds,
          gameIds: validGameIds,
          playerIds: validPlayerIds,
        },
        { replace: true }
      );
    }
  }, [
    availableGames,
    competitionIds,
    competitionIdsForTeam,
    controlsError,
    controlsLoading,
    gameIds,
    playerIds,
    playersForTeam,
    teamId,
    updateSelection,
  ]);

  const handleExportCSV = useCallback(
    async (detailMode: StatisticsExportDetailMode) => {
      if (!teamId) {
        return;
      }

      setIsExporting(true);
      try {
        await downloadTeamStatisticsCSV(teamId, detailMode, statisticsFilters);
      } catch (error) {
        console.error("Error exporting CSV:", error);
      } finally {
        setIsExporting(false);
      }
    },
    [statisticsFilters, teamId]
  );

  const handleRefreshStatistics = useCallback(async () => {
    if (teamId === undefined) {
      return;
    }

    setIsManualRefreshing(true);
    try {
      await invalidateQueryKeys(queryClient, buildStatisticsRefreshQueryKeys(statisticsQueryPlan), {
        exact: true,
      });
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    queryClient,
    statisticsQueryPlan,
    teamId,
  ]);

  return {
    teamId,
    competitionIds,
    gameIds,
    playerIds,
    statisticsFilters,
    updateSelection,
    isExporting,
    handleExportCSV,
    isRefreshingStatistics,
    handleRefreshStatistics,

    teams,
    isLoadingTeams,
    teamsError,
    selectedTeam,
    sortedTeams,

    competitionsForTeam,
    selectedCompetitions,
    selectedCompetition,
    teamGames,
    availableGames,
    selectedGames,
    selectedGame,
    selectedDatasetGames,
    playersForTeam,
    selectedPlayers,
    selectedPlayer,
    playerStatsById,

    controlsLoading,
    isPlayerOptionsLoading,
    controlsError,
    canExport,
    shouldShowFieldSideStats,

    teamStats,
    isLoadingTeamStats,
    isFetchingTeamStats,
    teamStatsError,
    teamEvolution,
    isLoadingTeamEvolution,
    isFetchingTeamEvolution,
    teamEvolutionError,
    teamPlayerStats,
    isLoadingTeamPlayerStats,
    isFetchingTeamPlayerStats,
    teamPlayerStatsError,
    teamStrategyStats,
    isLoadingTeamStrategyStats,
    isFetchingTeamStrategyStats,
    teamStrategyStatsError,
    gamePointTimeline,
    isLoadingGamePointTimeline,
    isFetchingGamePointTimeline,
    gamePointTimelineError,
  };
}
