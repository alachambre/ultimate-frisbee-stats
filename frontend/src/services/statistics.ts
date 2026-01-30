import { apiClient } from "./api";
import type { PlayerGameStats, GameTeamStats } from "../types";

export async function getLiveGameStatistics(gameId: number): Promise<PlayerGameStats[]> {
  const response = await apiClient.get(`/statistics/games/${gameId}/live`);
  return response.data;
}

export async function getGameTeamStatistics(gameId: number): Promise<GameTeamStats> {
  const response = await apiClient.get(`/statistics/games/${gameId}/team`);
  return response.data;
}
