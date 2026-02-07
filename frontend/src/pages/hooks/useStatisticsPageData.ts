import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCompetitionGames, getCompetitions, getTeams } from "../../services";
import {
  downloadCompetitionStatisticsCSV,
  downloadGameStatisticsCSV,
  downloadTeamStatisticsCSV,
  getCompetitionPlayerStatistics,
  getCompetitionStrategyStatistics,
  getCompetitionTeamStatistics,
  getGameStrategyStatistics,
  getGameTeamStatistics,
  getLiveGameStatistics,
  getTeamPlayerStatistics,
  getTeamStrategyStatistics,
  getTeamTeamStatistics,
  type StatisticsExportDetailMode,
} from "../../services/statistics";
import type { PlayerGameStats } from "../../types";
import { queryKeys } from "../../utils/queryKeys";

export type StatisticsMode = "competition" | "player";
export type StatisticsScope = "team" | "competition" | "game" | "player";

interface StatisticsSelection {
  teamId?: number;
  mode: StatisticsMode;
  competitionId?: number;
  gameId?: number;
  playerId?: number;
}

const STICKY_TEAM_KEY = "statistics:selectedTeamId";

function parseOptionalId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildSearchParams(selection: StatisticsSelection): URLSearchParams {
  const params = new URLSearchParams();

  if (selection.teamId !== undefined) {
    params.set("teamId", String(selection.teamId));
  }

  params.set("mode", selection.mode);

  if (selection.mode === "competition") {
    if (selection.competitionId !== undefined) {
      params.set("competitionId", String(selection.competitionId));
    }

    if (selection.gameId !== undefined) {
      params.set("gameId", String(selection.gameId));
    }
  }

  if (selection.mode === "player" && selection.playerId !== undefined) {
    params.set("playerId", String(selection.playerId));
  }

  return params;
}

export function useStatisticsPageData() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const rawMode = searchParams.get("mode");
  const rawPlayerId = parseOptionalId(searchParams.get("playerId"));

  const selection: StatisticsSelection = {
    teamId: parseOptionalId(searchParams.get("teamId")),
    mode:
      rawMode === "player" || (rawMode == null && rawPlayerId !== undefined)
        ? "player"
        : "competition",
    competitionId: parseOptionalId(searchParams.get("competitionId")),
    gameId: parseOptionalId(searchParams.get("gameId")),
    playerId: rawPlayerId,
  };

  const mode: StatisticsMode = selection.mode;
  const teamId = selection.teamId;
  const competitionId = mode === "competition" ? selection.competitionId : undefined;
  const gameId = mode === "competition" ? selection.gameId : undefined;
  const playerId = mode === "player" ? selection.playerId : undefined;

  const updateSelection = useCallback(
    (updates: Partial<StatisticsSelection>, options?: { replace?: boolean }) => {
      const merged: StatisticsSelection = {
        teamId,
        mode,
        competitionId,
        gameId,
        playerId,
        ...updates,
      };

      if (merged.mode === "competition") {
        merged.playerId = undefined;
      }

      if (merged.mode === "player") {
        merged.competitionId = undefined;
        merged.gameId = undefined;
      }

      if (merged.teamId === undefined) {
        merged.competitionId = undefined;
        merged.gameId = undefined;
        merged.playerId = undefined;
      }

      setSearchParams(buildSearchParams(merged), {
        replace: options?.replace,
      });
    },
    [competitionId, gameId, mode, playerId, setSearchParams, teamId]
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
    data: games,
    isLoading: isLoadingGames,
    error: gamesError,
  } = useQuery({
    queryKey: queryKeys.competitionGames(competitionId ?? 0),
    queryFn: () => getCompetitionGames(competitionId as number),
    enabled: mode === "competition" && competitionId !== undefined,
  });

  const activeScope: StatisticsScope | undefined = useMemo(() => {
    if (teamId === undefined) return undefined;

    if (mode === "player") {
      return playerId !== undefined ? "player" : undefined;
    }

    if (gameId !== undefined) return "game";
    if (competitionId !== undefined) return "competition";

    return "team";
  }, [competitionId, gameId, mode, playerId, teamId]);

  const {
    data: teamStats,
    isLoading: isLoadingTeamStats,
    error: teamStatsError,
  } = useQuery({
    queryKey: queryKeys.teamTeamStatistics(teamId ?? 0),
    queryFn: () => getTeamTeamStatistics(teamId as number),
    enabled: activeScope === "team" && teamId !== undefined,
  });

  const {
    data: teamPlayerStats,
    isLoading: isLoadingTeamPlayerStats,
    error: teamPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.teamPlayerStatistics(teamId ?? 0),
    queryFn: () => getTeamPlayerStatistics(teamId as number),
    enabled:
      teamId !== undefined &&
      (mode === "player" || activeScope === "team" || activeScope === "player"),
  });

  const {
    data: teamStrategyStats,
    isLoading: isLoadingTeamStrategyStats,
    error: teamStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.teamStrategyStatistics(teamId ?? 0),
    queryFn: () => getTeamStrategyStatistics(teamId as number),
    enabled: activeScope === "team" && teamId !== undefined,
  });

  const {
    data: competitionTeamStats,
    isLoading: isLoadingCompetitionTeamStats,
    error: competitionTeamStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionTeamStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionTeamStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: competitionPlayerStats,
    isLoading: isLoadingCompetitionPlayerStats,
    error: competitionPlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionPlayerStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionPlayerStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: competitionStrategyStats,
    isLoading: isLoadingCompetitionStrategyStats,
    error: competitionStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.competitionStrategyStatistics(competitionId ?? 0),
    queryFn: () => getCompetitionStrategyStatistics(competitionId as number),
    enabled: activeScope === "competition" && competitionId !== undefined,
  });

  const {
    data: gameTeamStats,
    isLoading: isLoadingGameTeamStats,
    error: gameTeamStatsError,
  } = useQuery({
    queryKey: queryKeys.gameTeamStatistics(gameId ?? 0),
    queryFn: () => getGameTeamStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
  });

  const {
    data: gamePlayerStats,
    isLoading: isLoadingGamePlayerStats,
    error: gamePlayerStatsError,
  } = useQuery({
    queryKey: queryKeys.liveStats(gameId ?? 0),
    queryFn: () => getLiveGameStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
  });

  const {
    data: gameStrategyStats,
    isLoading: isLoadingGameStrategyStats,
    error: gameStrategyStatsError,
  } = useQuery({
    queryKey: queryKeys.gameStrategyStatistics(gameId ?? 0),
    queryFn: () => getGameStrategyStatistics(gameId as number),
    enabled: activeScope === "game" && gameId !== undefined,
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

  const selectedCompetition = competitionsForTeam.find(
    (competition) => competition.id === competitionId
  );

  const gamesForCompetition = useMemo(
    () =>
      (games ?? []).slice().sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }),
    [games]
  );

  const selectedGame = gamesForCompetition.find((game) => game.id === gameId);

  const playersForTeam = useMemo(
    () => (selectedTeam?.players ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [selectedTeam?.players]
  );
  const selectedPlayer = playersForTeam.find((player) => player.id === playerId);

  const playerStatsById = useMemo(() => {
    const map = new Map<number, PlayerGameStats>();
    for (const playerStat of teamPlayerStats ?? []) {
      map.set(playerStat.player_id, playerStat);
    }
    return map;
  }, [teamPlayerStats]);

  const selectedPlayerStats = teamPlayerStats?.find(
    (stats) => stats.player_id === playerId
  );

  const controlsError = competitionsError || gamesError;
  const controlsLoading =
    (teamId !== undefined && isLoadingCompetitions) ||
    (competitionId !== undefined && isLoadingGames);

  const isScopeLoading =
    (activeScope === "team" &&
      (isLoadingTeamStats || isLoadingTeamPlayerStats || isLoadingTeamStrategyStats)) ||
    (activeScope === "competition" &&
      (isLoadingCompetitionTeamStats ||
        isLoadingCompetitionPlayerStats ||
        isLoadingCompetitionStrategyStats)) ||
    (activeScope === "game" &&
      (isLoadingGameTeamStats || isLoadingGamePlayerStats || isLoadingGameStrategyStats)) ||
    (activeScope === "player" && isLoadingTeamPlayerStats);

  const scopeError =
    (activeScope === "team" &&
      (teamStatsError || teamPlayerStatsError || teamStrategyStatsError)) ||
    (activeScope === "competition" &&
      (competitionTeamStatsError ||
        competitionPlayerStatsError ||
        competitionStrategyStatsError)) ||
    (activeScope === "game" &&
      (gameTeamStatsError || gamePlayerStatsError || gameStrategyStatsError)) ||
    (activeScope === "player" && teamPlayerStatsError);

  const canExport =
    activeScope === "team" || activeScope === "competition" || activeScope === "game";

  const competitionFlowDisabled =
    teamId !== undefined && !controlsLoading && competitionsForTeam.length === 0;
  const playerFlowDisabled = teamId !== undefined && playersForTeam.length === 0;

  const statisticsPathItems = useMemo(() => {
    const items: string[] = [];

    if (selectedTeam) {
      items.push(selectedTeam.name);
    }

    if (mode === "competition") {
      if (selectedCompetition) {
        items.push(selectedCompetition.name);
      }
      if (selectedGame) {
        items.push(`${selectedGame.team_name} vs ${selectedGame.opponent_name}`);
      }
    } else if (selectedPlayer) {
      items.push(selectedPlayer.name);
    }

    return items;
  }, [mode, selectedCompetition, selectedGame, selectedPlayer, selectedTeam]);

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

    if (mode === "competition" && competitionsForTeam.length === 0 && playersForTeam.length > 0) {
      updateSelection(
        {
          mode: "player",
          competitionId: undefined,
          gameId: undefined,
        },
        { replace: true }
      );
      return;
    }

    if (mode === "player" && playersForTeam.length === 0 && competitionsForTeam.length > 0) {
      updateSelection(
        {
          mode: "competition",
          playerId: undefined,
        },
        { replace: true }
      );
    }
  }, [
    teamId,
    controlsLoading,
    controlsError,
    mode,
    competitionsForTeam.length,
    playersForTeam.length,
    updateSelection,
  ]);

  const handleExportCSV = useCallback(
    async (detailMode: StatisticsExportDetailMode) => {
      if (!canExport) {
        return;
      }

      setIsExporting(true);
      try {
        if (activeScope === "team" && teamId !== undefined) {
          await downloadTeamStatisticsCSV(teamId, detailMode);
        } else if (activeScope === "competition" && competitionId !== undefined) {
          await downloadCompetitionStatisticsCSV(competitionId, detailMode);
        } else if (activeScope === "game" && gameId !== undefined) {
          await downloadGameStatisticsCSV(gameId, detailMode);
        }
      } catch (error) {
        console.error("Error exporting CSV:", error);
      } finally {
        setIsExporting(false);
      }
    },
    [activeScope, canExport, competitionId, gameId, teamId]
  );

  return {
    mode,
    teamId,
    competitionId,
    gameId,
    playerId,
    activeScope,
    updateSelection,
    isExporting,
    handleExportCSV,

    teams,
    isLoadingTeams,
    teamsError,
    selectedTeam,
    sortedTeams,

    competitionsForTeam,
    selectedCompetition,
    gamesForCompetition,
    selectedGame,
    playersForTeam,
    selectedPlayer,
    selectedPlayerStats,
    playerStatsById,
    statisticsPathItems,

    controlsLoading,
    controlsError,
    isScopeLoading,
    scopeError,
    canExport,
    competitionFlowDisabled,
    playerFlowDisabled,

    teamStats,
    teamPlayerStats,
    teamStrategyStats,
    competitionTeamStats,
    competitionPlayerStats,
    competitionStrategyStats,
    gameTeamStats,
    gamePlayerStats,
    gameStrategyStats,
  };
}
