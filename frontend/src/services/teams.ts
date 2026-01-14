import { apiClient } from "./api";
import type {
  Team,
  TeamCreate,
  TeamUpdate,
  TeamWithPlayers,
  Player,
  GameWithScore,
} from "../types";

// Create a new team
export const createTeam = async (data: TeamCreate): Promise<Team> => {
  const response = await apiClient.post<Team>("/teams", data);
  return response.data;
};

// Get all teams
export const getTeams = async (): Promise<Team[]> => {
  const response = await apiClient.get<Team[]>("/teams");
  return response.data;
};

// Get team by ID with players
export const getTeam = async (teamId: number): Promise<TeamWithPlayers> => {
  const response = await apiClient.get<TeamWithPlayers>(`/teams/${teamId}`);
  return response.data;
};

// Update team
export const updateTeam = async (
  teamId: number,
  data: TeamUpdate
): Promise<Team> => {
  const response = await apiClient.put<Team>(`/teams/${teamId}`, data);
  return response.data;
};

// Delete team
export const deleteTeam = async (teamId: number): Promise<void> => {
  await apiClient.delete(`/teams/${teamId}`);
};

// Get team players
export const getTeamPlayers = async (teamId: number): Promise<Player[]> => {
  const response = await apiClient.get<Player[]>(`/teams/${teamId}/players`);
  return response.data;
};

// Get team games
export const getTeamGames = async (
  teamId: number
): Promise<GameWithScore[]> => {
  const response = await apiClient.get<GameWithScore[]>(
    `/teams/${teamId}/games`
  );
  return response.data;
};
