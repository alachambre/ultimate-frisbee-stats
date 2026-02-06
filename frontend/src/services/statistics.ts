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
