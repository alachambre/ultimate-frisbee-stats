import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGame, getGameTurnovers, getLiveGameStatistics } from "../../services";
import { getCompetition } from "../../services/competitions";
import { getActivePoint } from "../../services/points";
import { getGenderScopedPlayerHighlight } from "../../utils/playerHighlighting";
import { queryKeys } from "../../utils/queryKeys";

const GAME_DETAIL_REFRESH_INTERVAL_MS = 30000;

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

  const hasScoredPoint = useMemo(() => {
    return game?.points.some((point) => point.status === "scored") ?? false;
  }, [game?.points]);

  const { data: activePoint } = useQuery({
    queryKey: queryKeys.activePoint(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getActivePoint(gameIdNumber),
    enabled: gameIdValid && game?.status === "started" && !hasScoredPoint,
    refetchInterval:
      game?.status === "started" && !hasScoredPoint
        ? GAME_DETAIL_REFRESH_INTERVAL_MS
        : false,
    retry: false,
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
    gameTurnovers,
    liveStats,
    liveStatsByPlayerId,
    competition,
    competitionPath,
    rosterPlayersForTabs,
    getRosterPlayerHighlight,
  };
}
