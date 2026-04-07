import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGame, getLiveGameStatistics } from "../../services";
import { getCompetition } from "../../services/competitions";
import { getActivePoint } from "../../services/points";
import type { PlayerGameStats } from "../../types";
import { getPlayerHighlight } from "../../utils/playerHighlighting";
import { queryKeys } from "../../utils/queryKeys";

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
  });

  const hasScoredPoint = useMemo(() => {
    return game?.points.some((point) => point.status === "scored") ?? false;
  }, [game?.points]);

  const { data: activePoint } = useQuery({
    queryKey: queryKeys.activePoint(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getActivePoint(gameIdNumber),
    enabled: gameIdValid && game?.status === "started" && !hasScoredPoint,
    refetchInterval: game?.status === "started" && !hasScoredPoint ? 5000 : false,
    retry: false,
  });

  const { data: liveStats } = useQuery({
    queryKey: queryKeys.liveStats(gameIdValid ? gameIdNumber : 0),
    queryFn: () => getLiveGameStatistics(gameIdNumber),
    enabled:
      includeLiveStats &&
      gameIdValid &&
      (game?.status === "started" || game?.status === "ended"),
    refetchInterval: game?.status === "started" ? 5000 : false,
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
    if (!liveStats || liveStats.length < 5) {
      return null;
    }

    const playerStats = liveStatsByPlayerId.get(playerId) as PlayerGameStats | undefined;
    if (!playerStats) {
      return null;
    }

    return getPlayerHighlight(playerStats, liveStats);
  };

  return {
    gameIdNumber,
    gameIdValid,
    game,
    isLoading,
    error,
    activePoint,
    liveStats,
    liveStatsByPlayerId,
    competition,
    competitionPath,
    rosterPlayersForTabs,
    getRosterPlayerHighlight,
  };
}
