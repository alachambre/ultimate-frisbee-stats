import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllGames, getCompetitions, getTeams } from "../../services";
import {
  downloadTeamStatisticsCSV,
  getGamePointTimeline,
  getTeamPlayerStatistics,
  getTeamStrategyStatistics,
  getTeamTeamStatistics,
  type StatisticsDatasetFilters,
  type StatisticsExportDetailMode,
} from "../../services/statistics";
import type { Player, PlayerGameStats } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

interface StatisticsSelection {
  teamId?: number;
  competitionIds: number[];
  gameIds: number[];
  playerIds: number[];
}

const STICKY_TEAM_KEY = "statistics:selectedTeamId";

function parseOptionalId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeIds(ids: number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function parseIds(value: string | null): number[] {
  if (!value) {
    return [];
  }

  return normalizeIds(
    value
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
  );
}

function buildSearchParams(selection: StatisticsSelection): URLSearchParams {
  const params = new URLSearchParams();

  if (selection.teamId !== undefined) {
    params.set("teamId", String(selection.teamId));
  }

  if (selection.competitionIds.length > 0) {
    params.set("competitionIds", selection.competitionIds.join(","));
  }

  if (selection.gameIds.length > 0) {
    params.set("gameIds", selection.gameIds.join(","));
  }

  if (selection.playerIds.length > 0) {
    params.set("playerIds", selection.playerIds.join(","));

    if (selection.playerIds.length === 1) {
      params.set("playerId", String(selection.playerIds[0]));
    }
  }

  return params;
}

function buildDatasetFilters(selection: StatisticsSelection): StatisticsDatasetFilters {
  return {
    competitionIds: selection.competitionIds,
    gameIds: selection.gameIds,
    playerIds: selection.playerIds,
  };
}

export function useStatisticsPageData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const legacyCompetitionId = parseOptionalId(searchParams.get("competitionId"));
  const legacyGameId = parseOptionalId(searchParams.get("gameId"));
  const rawPlayerIds = parseIds(searchParams.get("playerIds"));
  const legacyPlayerId = parseOptionalId(searchParams.get("playerId"));

  const selection: StatisticsSelection = {
    teamId: parseOptionalId(searchParams.get("teamId")),
    competitionIds: (() => {
      const ids = parseIds(searchParams.get("competitionIds"));
      if (ids.length > 0) {
        return ids;
      }
      return legacyCompetitionId !== undefined ? [legacyCompetitionId] : [];
    })(),
    gameIds: (() => {
      const ids = parseIds(searchParams.get("gameIds"));
      if (ids.length > 0) {
        return ids;
      }
      return legacyGameId !== undefined ? [legacyGameId] : [];
    })(),
    playerIds:
      rawPlayerIds.length > 0
        ? rawPlayerIds
        : legacyPlayerId !== undefined
          ? [legacyPlayerId]
          : [],
  };

  const teamId = selection.teamId;
  const competitionIds = selection.competitionIds;
  const gameIds = selection.gameIds;
  const playerIds = selection.playerIds;
  const statisticsFilters = buildDatasetFilters(selection);

  const updateSelection = useCallback(
    (updates: Partial<StatisticsSelection>, options?: { replace?: boolean }) => {
      const merged: StatisticsSelection = {
        teamId,
        competitionIds,
        gameIds,
        playerIds,
        ...updates,
      };

      merged.competitionIds = normalizeIds(merged.competitionIds ?? []);
      merged.gameIds = normalizeIds(merged.gameIds ?? []);
      merged.playerIds = normalizeIds(merged.playerIds ?? []);

      if (merged.teamId === undefined) {
        merged.competitionIds = [];
        merged.gameIds = [];
        merged.playerIds = [];
      }

      setSearchParams(buildSearchParams(merged), {
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
    queryKey: ["competitions", "team", teamId ?? 0],
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

  const sortedTeams = useMemo(
    () => (teams ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [teams]
  );

  const selectedTeam = teams?.find((team) => team.id === teamId);

  const competitionsForTeam = useMemo(
    () =>
      (competitions ?? []).slice().sort((a, b) => {
        const startA = new Date(a.start_date).getTime();
        const startB = new Date(b.start_date).getTime();
        return startB - startA;
      }),
    [competitions]
  );

  const competitionIdsForTeam = useMemo(
    () => new Set(competitionsForTeam.map((competition) => competition.id)),
    [competitionsForTeam]
  );

  const teamGames = useMemo(() => {
    if (!allGames || competitionIdsForTeam.size === 0) {
      return [];
    }

    return allGames
      .filter((game) => competitionIdsForTeam.has(game.competition_id))
      .slice()
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
  }, [allGames, competitionIdsForTeam]);

  const selectedCompetitionIdsSet = useMemo(() => new Set(competitionIds), [competitionIds]);
  const selectedGameIdsSet = useMemo(() => new Set(gameIds), [gameIds]);
  const selectedPlayerIdsSet = useMemo(() => new Set(playerIds), [playerIds]);

  const availableGames = useMemo(() => {
    if (competitionIds.length === 0) {
      return teamGames;
    }

    return teamGames.filter((game) => selectedCompetitionIdsSet.has(game.competition_id));
  }, [competitionIds.length, selectedCompetitionIdsSet, teamGames]);

  const selectedCompetitions = useMemo(
    () => competitionsForTeam.filter((competition) => selectedCompetitionIdsSet.has(competition.id)),
    [competitionsForTeam, selectedCompetitionIdsSet]
  );

  const selectedGames = useMemo(
    () => teamGames.filter((game) => selectedGameIdsSet.has(game.id)),
    [selectedGameIdsSet, teamGames]
  );

  const selectedGame = selectedGames.length === 1 ? selectedGames[0] : undefined;
  const selectedCompetition = selectedCompetitions.length === 1 ? selectedCompetitions[0] : undefined;

  const selectedDatasetGames = useMemo(() => {
    if (selectedGames.length > 0) {
      return selectedGames;
    }

    if (competitionIds.length > 0) {
      return teamGames.filter((game) => selectedCompetitionIdsSet.has(game.competition_id));
    }

    return teamGames;
  }, [competitionIds.length, selectedCompetitionIdsSet, selectedGames, teamGames]);

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.teamTeamStatistics(teamId ?? 0, competitionIds, gameIds, playerIds),
    queryFn: () => getTeamTeamStatistics(teamId as number, statisticsFilters),
    enabled: teamId !== undefined,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.teamPlayerStatistics(teamId ?? 0, competitionIds, gameIds, playerIds),
    queryFn: () => getTeamPlayerStatistics(teamId as number, statisticsFilters),
    enabled: teamId !== undefined,
  });

  const {
    data: teamStrategyStats,
    isLoading: isLoadingTeamStrategyStats,
    error: teamStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.teamStrategyStatistics(teamId ?? 0, competitionIds, gameIds, playerIds),
    queryFn: () => getTeamStrategyStatistics(teamId as number, statisticsFilters),
    enabled: teamId !== undefined,
  });

  const {
    data: gamePointTimeline,
    isLoading: isLoadingGamePointTimeline,
    error: gamePointTimelineError,
  } = useQuery({
    queryKey: queryKeys.gamePointTimeline(selectedGame?.id ?? 0, playerIds),
    queryFn: () => getGamePointTimeline(selectedGame!.id, playerIds),
    enabled: selectedGame !== undefined,
  });

  const playerStatsById = useMemo(() => {
    const map = new Map<number, PlayerGameStats>();
    for (const playerStat of teamPlayerStats ?? []) {
      map.set(playerStat.player_id, playerStat);
    }
    return map;
  }, [teamPlayerStats]);

  const teamPlayersById = useMemo(
    () => new Map((selectedTeam?.players ?? []).map((player) => [player.id, player])),
    [selectedTeam?.players]
  );

  const filteredPlayerIdsFromStats = useMemo(() => {
    const shouldScopePlayerOptions =
      competitionIds.length > 0 || gameIds.length > 0 || playerIds.length > 0;

    if (!shouldScopePlayerOptions || !teamPlayerStats) {
      return null;
    }

    return teamPlayerStats
      .filter((playerStat) => {
        if (playerIds.length === 0) {
          return true;
        }

        return (
          playerStat.points_played > 0 || selectedPlayerIdsSet.has(playerStat.player_id)
        );
      })
      .map((playerStat) => playerStat.player_id);
  }, [competitionIds.length, gameIds.length, playerIds.length, selectedPlayerIdsSet, teamPlayerStats]);

  const playersForTeam = useMemo(() => {
    const sourcePlayers =
      filteredPlayerIdsFromStats === null
        ? selectedTeam?.players ?? []
        : filteredPlayerIdsFromStats
            .map((playerId) => teamPlayersById.get(playerId))
            .filter((player): player is Player => player !== undefined);

    return sourcePlayers.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPlayerIdsFromStats, selectedTeam?.players, teamPlayersById]);

  const selectedPlayers = useMemo(
    () => playersForTeam.filter((player) => selectedPlayerIdsSet.has(player.id)),
    [playersForTeam, selectedPlayerIdsSet]
  );

  const selectedPlayer = selectedPlayers.length === 1 ? selectedPlayers[0] : undefined;

  const controlsError = competitionsError || allGamesError;
  const controlsLoading =
    teamId !== undefined && (isLoadingCompetitions || isLoadingAllGames);
  const isPlayerOptionsLoading =
    teamId !== undefined &&
    isLoadingTeamPlayerStats &&
    (competitionIds.length > 0 || gameIds.length > 0 || playerIds.length > 0);

  const isScopeLoading =
    teamId !== undefined &&
    (isLoadingTeamStats || isLoadingTeamPlayerStats || isLoadingTeamStrategyStats);

  const scopeError = teamStatsError || teamPlayerStatsError || teamStrategyStatsError;

  const canExport = teamId !== undefined;
  const shouldShowFieldSideStats = selectedGames.length === 1;

  useEffect(() => {
    if (!teams || teamId !== undefined) {
      return;
    }

    const persistedTeamId = parseOptionalId(localStorage.getItem(STICKY_TEAM_KEY));
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

  return {
    teamId,
    competitionIds,
    gameIds,
    playerIds,
    statisticsFilters,
    updateSelection,
    isExporting,
    handleExportCSV,

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
    isScopeLoading,
    scopeError,
    canExport,
    shouldShowFieldSideStats,

    teamStats,
    teamPlayerStats,
    teamStrategyStats,
    gamePointTimeline,
    isLoadingGamePointTimeline,
    gamePointTimelineError,
  };
}
