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

export async function getLiveGameStatistics(gameId: number): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(`/statistics/games/${gameId}/live`);
  return response.data;
}

export async function getGameTeamStatistics(gameId: number): Promise<GameTeamStats> {
  const response = await apiClient.get(`/statistics/games/${gameId}/team`);
  return response.data;
}

export async function getGameStrategyStatistics(gameId: number): Promise<GameStrategyStats> {
  const response = await apiClient.get(`/statistics/games/${gameId}/strategies`);
  return response.data;
}

export async function getCompetitionPlayerStatistics(competitionId: number): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(`/statistics/competitions/${competitionId}/players`);
  return response.data;
}

export async function getTeamPlayerStatistics(teamId: number): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(`/statistics/teams/${teamId}/players`);
  return response.data;
}

export async function getCompetitionTeamStatistics(competitionId: number): Promise<CompetitionTeamStats> {
  const response = await apiClient.get(`/statistics/competitions/${competitionId}/team`);
  return response.data;
}

export async function getTeamTeamStatistics(teamId: number): Promise<TeamTeamStats> {
  const response = await apiClient.get(`/statistics/teams/${teamId}/team`);
  return response.data;
}

export async function getCompetitionStrategyStatistics(competitionId: number): Promise<CompetitionStrategyStats> {
  const response = await apiClient.get(`/statistics/competitions/${competitionId}/strategies`);
  return response.data;
}

export async function getTeamStrategyStatistics(teamId: number): Promise<TeamStrategyStats> {
  const response = await apiClient.get(`/statistics/teams/${teamId}/strategies`);
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
  detailMode: StatisticsExportDetailMode = "summary"
): Promise<void> {
  await downloadStatisticsCsv(
    `/exports/teams/${teamId}/csv?detail=${detailMode}`,
    `team-${teamId}-statistics.csv`
  );
}
