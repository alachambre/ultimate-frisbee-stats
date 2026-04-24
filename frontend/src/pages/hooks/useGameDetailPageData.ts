import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGame, getGameLiveState, getGameTurnovers, getLiveGameStatistics } from "../../services";
import { getCompetition } from "../../services/competitions";
import { getGenderScopedPlayerHighlight } from "../../utils/playerHighlighting";
import { queryKeys } from "../../utils/queryKeys";
import {
  GAME_DETAIL_REFRESH_INTERVAL_MS,
  LIVE_TRACKER_REFRESH_INTERVAL_MS,
} from "../../utils/refreshIntervals";

export function useGameDetailPageData(
  gameId: string | undefined,
  includeLiveStats = true
) {
  const gameIdNumber = Number(gameId);
  const gameIdValid = Number.isFinite(gameIdNumber);

  const {
    data: game,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.game(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGame(gameIdNumber),
    enabled: gameIdValid,
    refetchInterval: (query) => {
      const currentGame = query.state.data as { status?: string } | undefined;
      return currentGame?.status === "ended"
        ? false
        : GAME_DETAIL_REFRESH_INTERVAL_MS;
    },
  });

  const { data: liveState } = useQuery({
    queryKey: queryKeys.gameLiveState(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGameLiveState(gameIdNumber),
    enabled: gameIdValid && game?.status === "started",
    refetchInterval:
      game?.status === "started"
        ? LIVE_TRACKER_REFRESH_INTERVAL_MS
        : false,
    refetchIntervalInBackground: true,
  });

  const { data: gameTurnovers } = useQuery({
    queryKey: queryKeys.gameTurnovers(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getGameTurnovers(gameIdNumber),
    enabled:
      gameIdValid &&
      Boolean(game) &&
      Boolean(game?.halftime || game?.status === "ended"),
    refetchInterval:
      game?.status === "started" && Boolean(game?.halftime)
        ? GAME_DETAIL_REFRESH_INTERVAL_MS
        : false,
  });

  const { data: liveStats } = useQuery({
    queryKey: queryKeys.liveStats(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getLiveGameStatistics(gameIdNumber),
    enabled:
      includeLiveStats &&
      gameIdValid &&
      (game?.status === "started" || game?.status === "ended"),
    refetchInterval:
      game?.status === "started" ? GAME_DETAIL_REFRESH_INTERVAL_MS : false,
  });

  const competitionId = game?.competition_id;
  const { data: competition } = useQuery({
    queryKey: queryKeys.competition(competitionId ?? 0),
    queryFn: () => getCompetition(competitionId as number),
    enabled: !!competitionId,
  });

  const competitionPath = competitionId ? `/competitions/${competitionId}` : "/competitions";
  const activePoint = game?.status === "started"
    ? liveState?.active_point ?? null
    : null;

  const liveStatsByPlayerId = useMemo(
    () => new Map((liveStats || []).map((stats) => [stats.player_id, stats])),
    [liveStats]
  );

  const completedPointCount = useMemo(
    () => game?.points.filter((point) => point.status === "completed").length ?? 0,
    [game?.points]
  );

  const menPlayers = useMemo(
    () =>
      (game?.players ?? [])
        .filter((player) => player.gender === "M")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [game?.players]
  );

  const womenPlayers = useMemo(
    () =>
      (game?.players ?? [])
        .filter((player) => player.gender === "W")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [game?.players]
  );

  const rosterPlayersForTabs = useMemo(
    () => [...menPlayers, ...womenPlayers],
    [menPlayers, womenPlayers]
  );

  const getRosterPlayerHighlight = (playerId: number): "high" | "low" | null => {
    if (!liveStats || !game) {
      return null;
    }

    return getGenderScopedPlayerHighlight(playerId, game.players, liveStatsByPlayerId, {
      completedPointsPlayed: completedPointCount,
    });
  };

  return {
    gameIdNumber,
    gameIdValid,
    game,
    isLoading,
    error,
    activePoint,
    liveState,
    activePointTurnovers: activePoint ? liveState?.active_point_turnovers ?? [] : [],
    activePointStoppages: activePoint ? liveState?.active_point_stoppages ?? [] : [],
    gameTurnovers,
    liveStats,
    liveStatsByPlayerId,
    competition,
    competitionPath,
    rosterPlayersForTabs,
    getRosterPlayerHighlight,
  };
}
