export interface StatisticsSelection {
  teamId?: number;
  competitionIds: number[];
  gameIds: number[];
  playerIds: number[];
}

type StatisticsSelectionUpdate = Partial<StatisticsSelection>;

export function parseStatisticsId(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeStatisticsIds(ids: readonly number[]): number[] {
  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function parseIds(value: string | null): number[] {
  if (!value) {
    return [];
  }

  return normalizeStatisticsIds(
    value
      .split(",")
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))
  );
}

export function parseStatisticsSelection(searchParams: URLSearchParams): StatisticsSelection {
  const legacyCompetitionId = parseStatisticsId(searchParams.get("competitionId"));
  const legacyGameId = parseStatisticsId(searchParams.get("gameId"));
  const rawPlayerIds = parseIds(searchParams.get("playerIds"));
  const legacyPlayerId = parseStatisticsId(searchParams.get("playerId"));

  return {
    teamId: parseStatisticsId(searchParams.get("teamId")),
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
}

export function serializeStatisticsSelection(selection: StatisticsSelection): URLSearchParams {
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

export function mergeStatisticsSelection(
  selection: StatisticsSelection,
  updates: StatisticsSelectionUpdate
): StatisticsSelection {
  const merged: StatisticsSelection = {
    ...selection,
    ...updates,
  };

  merged.competitionIds = normalizeStatisticsIds(merged.competitionIds ?? []);
  merged.gameIds = normalizeStatisticsIds(merged.gameIds ?? []);
  merged.playerIds = normalizeStatisticsIds(merged.playerIds ?? []);

  if (merged.teamId === undefined) {
    merged.competitionIds = [];
    merged.gameIds = [];
    merged.playerIds = [];
  }

  return merged;
}
