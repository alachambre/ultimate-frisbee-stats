import { apiClient } from "./api";
import type {
  Competition,
  CompetitionCreate,
  CompetitionUpdate,
  CompetitionWithPlayers,
  CompetitionWithTeam,
  Player,
  PlayerIdsRequest,
  GameWithScore,
} from "../types";

// Create a new competition
export const createCompetition = async (
  data: CompetitionCreate
): Promise<Competition> => {
  const response = await apiClient.post<Competition>("/competitions", data);
  return response.data;
};

// Get all competitions (optionally filtered by team)
export const getCompetitions = async (
  teamId?: number
): Promise<CompetitionWithTeam[]> => {
  const params = teamId ? { team_id: teamId } : {};
  const response = await apiClient.get<CompetitionWithTeam[]>("/competitions", {
    params,
  });
  return response.data;
};

// Get competition by ID with players
export const getCompetition = async (
  competitionId: number
): Promise<CompetitionWithPlayers> => {
  const response = await apiClient.get<CompetitionWithPlayers>(
    `/competitions/${competitionId}`
  );
  return response.data;
};

// Update competition
export const updateCompetition = async (
  competitionId: number,
  data: CompetitionUpdate
): Promise<Competition> => {
  const response = await apiClient.put<Competition>(
    `/competitions/${competitionId}`,
    data
  );
  return response.data;
};

// Delete competition
export const deleteCompetition = async (
  competitionId: number
): Promise<void> => {
  await apiClient.delete(`/competitions/${competitionId}`);
};

// Get competition players (roster)
export const getCompetitionPlayers = async (
  competitionId: number
): Promise<Player[]> => {
  const response = await apiClient.get<Player[]>(
    `/competitions/${competitionId}/players`
  );
  return response.data;
};

// Add players to competition roster
export const addPlayersToRoster = async (
  competitionId: number,
  playerIds: number[]
): Promise<CompetitionWithPlayers> => {
  const response = await apiClient.post<CompetitionWithPlayers>(
    `/competitions/${competitionId}/players`,
    { player_ids: playerIds } as PlayerIdsRequest
  );
  return response.data;
};

// Remove players from competition roster
export const removePlayersFromRoster = async (
  competitionId: number,
  playerIds: number[]
): Promise<CompetitionWithPlayers> => {
  const response = await apiClient.delete<CompetitionWithPlayers>(
    `/competitions/${competitionId}/players`,
    { data: { player_ids: playerIds } as PlayerIdsRequest }
  );
  return response.data;
};

// Get competition games
export const getCompetitionGames = async (
  competitionId: number
): Promise<GameWithScore[]> => {
  const response = await apiClient.get<GameWithScore[]>(
    `/competitions/${competitionId}/games`
  );
  return response.data;
};
