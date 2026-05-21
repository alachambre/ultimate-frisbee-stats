import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryKey,
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
import { queryKeys } from "../../utils/queryKeys";
import {
  mergeStatisticsSelection,
  parseStatisticsId,
  parseStatisticsSelection,
  serializeStatisticsSelection,
  type StatisticsSelection,
} from "../../utils/statisticsSelection";
import type { CompetitionStatisticsTab } from "../../components/statistics/CompetitionStatisticsTabs";

interface StatisticsPageAccess {
  canViewTeamStatistics: boolean;
  canViewStrategyStatistics: boolean;
  canViewPlayerStatistics: boolean;
  canFilterStatisticsByPlayers: boolean;
  canExportStatistics: boolean;
}

interface StatisticsPageQueryOptions {
  activeTab: CompetitionStatisticsTab;
  isPlayerFilterOpen: boolean;
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

  const selection = useMemo(() => parseStatisticsSelection(searchParams), [searchParams]);

  const teamId = selection.teamId;
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

      setSearchParams(serializeStatisticsSelection(merged), {
        replace: options?.replace,
      });
    },
    [competitionIds, gameIds, playerIds, setSearchParams, teamId]
  );

  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams,
  });

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

  const shouldLoadTeamStats =
    teamId !== undefined &&
    access.canViewTeamStatistics &&
    queryOptions.activeTab === "team";
  const shouldLoadTeamEvolution =
    teamId !== undefined &&
    access.canViewTeamStatistics &&
    queryOptions.activeTab === "evolution";
  const shouldLoadTeamPlayerStats =
    teamId !== undefined &&
    access.canViewPlayerStatistics &&
    (queryOptions.activeTab === "players" || queryOptions.isPlayerFilterOpen);
  const shouldLoadTeamStrategyStats =
    teamId !== undefined &&
    access.canViewStrategyStatistics &&
    queryOptions.activeTab === "strategies";

  const teamStatsQueryKey = queryKeys.teamTeamStatistics(
    teamId ?? 0,
    competitionIds,
    gameIds,
    playerIds
  );
  const teamEvolutionQueryKey = queryKeys.teamEvolutionStatistics(
    teamId ?? 0,
    competitionIds,
    gameIds,
    playerIds
  );
  const teamPlayerStatsQueryKey = queryKeys.teamPlayerStatistics(
    teamId ?? 0,
    competitionIds,
    gameIds,
    playerIds
  );
  const teamStrategyStatsQueryKey = queryKeys.teamStrategyStatistics(
    teamId ?? 0,
    competitionIds,
    gameIds,
    playerIds
  );

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    isFetching: isFetchingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: teamStatsQueryKey,
    queryFn: () => getTeamTeamStatistics(teamId as number, statisticsFilters),
    enabled: shouldLoadTeamStats,
    placeholderData: keepPreviousData,
  });

  const {
    data: teamEvolution,
    isLoading: isLoadingTeamEvolution,
    isFetching: isFetchingTeamEvolution,
    error: teamEvolutionError,
  } = useQuery({
    queryKey: teamEvolutionQueryKey,
    queryFn: () => getTeamEvolutionStatistics(teamId as number, statisticsFilters),
    enabled: shouldLoadTeamEvolution,
    placeholderData: keepPreviousData,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    isFetching: isFetchingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: teamPlayerStatsQueryKey,
    queryFn: () => getTeamPlayerStatistics(teamId as number, statisticsFilters),
    enabled: shouldLoadTeamPlayerStats,
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

  const gamePointTimelineQueryKey = queryKeys.gamePointTimeline(
    selectedGame?.id ?? 0,
    playerIds
  );

  const {
    data: teamStrategyStats,
    isLoading: isLoadingTeamStrategyStats,
    isFetching: isFetchingTeamStrategyStats,
    error: teamStrategyStatsError,
  } = useQuery({
    queryKey: teamStrategyStatsQueryKey,
    queryFn: () => getTeamStrategyStatistics(teamId as number, statisticsFilters),
    enabled: shouldLoadTeamStrategyStats,
    placeholderData: keepPreviousData,
  });

  const {
    data: gamePointTimeline,
    isLoading: isLoadingGamePointTimeline,
    isFetching: isFetchingGamePointTimeline,
    error: gamePointTimelineError,
  } = useQuery({
    queryKey: gamePointTimelineQueryKey,
    queryFn: () => getGamePointTimeline(selectedGame!.id, playerIds),
    enabled: selectedGame !== undefined && access.canViewTeamStatistics,
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
    if (!teams || teamId !== undefined) {
      return;
    }

    const persistedTeamId = parseStatisticsId(localStorage.getItem(STICKY_TEAM_KEY));
    if (
      persistedTeamId !== undefined &&
      teams.some((team) => team.id === persistedTeamId)
    ) {
      updateSelection({ teamId: persistedTeamId }, { replace: true });
    }
  }, [teamId, teams, updateSelection]);

  useEffect(() => {
    if (teamId === undefined) {
      return;
    }

    localStorage.setItem(STICKY_TEAM_KEY, String(teamId));
  }, [teamId]);

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

    const refreshQueryKeys: QueryKey[] = [
      queryKeys.teams,
      queryKeys.competitionsByTeam(teamId),
      queryKeys.games,
      teamStatsQueryKey,
      teamEvolutionQueryKey,
      teamPlayerStatsQueryKey,
      teamStrategyStatsQueryKey,
    ];

    if (selectedGame !== undefined) {
      refreshQueryKeys.push(gamePointTimelineQueryKey);
    }

    setIsManualRefreshing(true);
    try {
      await invalidateQueryKeys(queryClient, refreshQueryKeys, { exact: true });
    } finally {
      setIsManualRefreshing(false);
    }
  }, [
    gamePointTimelineQueryKey,
    queryClient,
    selectedGame,
    teamEvolutionQueryKey,
    teamId,
    teamPlayerStatsQueryKey,
    teamStatsQueryKey,
    teamStrategyStatsQueryKey,
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
