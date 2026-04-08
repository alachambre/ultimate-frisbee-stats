import { apiClient } from "./api";
import type {
  PlayerGameStats,
  GameTeamStats,
  CompetitionTeamStats,
  TeamTeamStats,
  GameStrategyStats,
  CompetitionStrategyStats,
  TeamStrategyStats,
} from "../types";

export type StatisticsExportDetailMode = "summary" | "full";
export interface StatisticsDatasetFilters {
  competitionIds?: number[];
  gameIds?: number[];
  playerIds?: number[];
}

function normalizeIds(ids?: number[]): number[] {
  if (!ids || ids.length === 0) {
    return [];
  }

  return Array.from(new Set(ids)).sort((a, b) => a - b);
}

function appendStatisticsFilters(path: string, filters?: StatisticsDatasetFilters): string {
  const competitionIds = normalizeIds(filters?.competitionIds);
  const gameIds = normalizeIds(filters?.gameIds);
  const playerIds = normalizeIds(filters?.playerIds);

  if (competitionIds.length === 0 && gameIds.length === 0 && playerIds.length === 0) {
    return path;
  }

  const [basePath, existingQuery = ""] = path.split("?", 2);
  const params = new URLSearchParams(existingQuery);
  competitionIds.forEach((competitionId) => {
    params.append("competition_ids", String(competitionId));
  });
  gameIds.forEach((gameId) => {
    params.append("game_ids", String(gameId));
  });
  playerIds.forEach((playerId) => {
    params.append("player_ids", String(playerId));
  });

  return `${basePath}?${params.toString()}`;
}

function parseFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallback;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function downloadStatisticsCsv(path: string, fallbackFilename: string): Promise<void> {
  const response = await apiClient.get(path, { responseType: "blob" });
  const filename = parseFilename(response.headers["content-disposition"], fallbackFilename);
  downloadBlob(response.data as Blob, filename);
}

export async function getLiveGameStatistics(
  gameId: number,
  playerIds?: number[]
): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/games/${gameId}/live`, { playerIds })
  );
  return response.data;
}

export async function getGameTeamStatistics(
  gameId: number,
  playerIds?: number[]
): Promise<GameTeamStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/games/${gameId}/team`, { playerIds })
  );
  return response.data;
}

export async function getGameStrategyStatistics(
  gameId: number,
  playerIds?: number[]
): Promise<GameStrategyStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/games/${gameId}/strategies`, { playerIds })
  );
  return response.data;
}

export async function getCompetitionPlayerStatistics(
  competitionId: number,
  playerIds?: number[]
): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/competitions/${competitionId}/players`, { playerIds })
  );
  return response.data;
}

export async function getTeamPlayerStatistics(
  teamId: number,
  filters?: StatisticsDatasetFilters
): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/teams/${teamId}/players`, filters)
  );
  return response.data;
}

export async function getCompetitionTeamStatistics(
  competitionId: number,
  playerIds?: number[]
): Promise<CompetitionTeamStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/competitions/${competitionId}/team`, { playerIds })
  );
  return response.data;
}

export async function getTeamTeamStatistics(
  teamId: number,
  filters?: StatisticsDatasetFilters
): Promise<TeamTeamStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/teams/${teamId}/team`, filters)
  );
  return response.data;
}

export async function getCompetitionStrategyStatistics(
  competitionId: number,
  playerIds?: number[]
): Promise<CompetitionStrategyStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/competitions/${competitionId}/strategies`, { playerIds })
  );
  return response.data;
}

export async function getTeamStrategyStatistics(
  teamId: number,
  filters?: StatisticsDatasetFilters
): Promise<TeamStrategyStats> {
  const response = await apiClient.get(
    appendStatisticsFilters(`/statistics/teams/${teamId}/strategies`, filters)
  );
  return response.data;
}

export async function downloadGameStatisticsCSV(
  gameId: number,
  detailMode: StatisticsExportDetailMode = "summary"
): Promise<void> {
  await downloadStatisticsCsv(
    `/exports/games/${gameId}/csv?detail=${detailMode}`,
    `game-${gameId}-statistics.csv`
  );
}

export async function downloadCompetitionStatisticsCSV(
  competitionId: number,
  detailMode: StatisticsExportDetailMode = "summary"
): Promise<void> {
  await downloadStatisticsCsv(
    `/exports/competitions/${competitionId}/csv?detail=${detailMode}`,
    `competition-${competitionId}-statistics.csv`
  );
}

export async function downloadTeamStatisticsCSV(
  teamId: number,
  detailMode: StatisticsExportDetailMode = "summary",
  filters?: StatisticsDatasetFilters
): Promise<void> {
  await downloadStatisticsCsv(
    appendStatisticsFilters(`/exports/teams/${teamId}/csv?detail=${detailMode}`, filters),
    `team-${teamId}-statistics.csv`
  );
}
