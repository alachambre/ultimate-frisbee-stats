import { apiClient } from "./api";
import type {
  Line,
  LineCreate,
  LineUpdate,
  LineWithPlayers,
  Player,
  PlayerIdsRequest,
} from "../types";

// Create a new line
export const createLine = async (data: LineCreate): Promise<Line> => {
  const response = await apiClient.post<Line>("/lines", data);
  return response.data;
};

// Get all lines (optionally filtered by team)
export const getLines = async (teamId?: number): Promise<LineWithPlayers[]> => {
  const params = teamId ? { team_id: teamId } : {};
  const response = await apiClient.get<LineWithPlayers[]>("/lines", { params });
  return response.data;
};

// Get line by ID with players
export const getLine = async (lineId: number): Promise<LineWithPlayers> => {
  const response = await apiClient.get<LineWithPlayers>(`/lines/${lineId}`);
  return response.data;
};

// Update line
export const updateLine = async (
  lineId: number,
  data: LineUpdate
): Promise<Line> => {
  const response = await apiClient.put<Line>(`/lines/${lineId}`, data);
  return response.data;
};

// Delete line
export const deleteLine = async (lineId: number): Promise<void> => {
  await apiClient.delete(`/lines/${lineId}`);
};

// Get line players
export const getLinePlayers = async (lineId: number): Promise<Player[]> => {
  const response = await apiClient.get<Player[]>(`/lines/${lineId}/players`);
  return response.data;
};

// Add players to line
export const addPlayersToLine = async (
  lineId: number,
  playerIds: number[]
): Promise<LineWithPlayers> => {
  const response = await apiClient.post<LineWithPlayers>(
    `/lines/${lineId}/players`,
    { player_ids: playerIds } as PlayerIdsRequest
  );
  return response.data;
};

// Remove players from line
export const removePlayersFromLine = async (
  lineId: number,
  playerIds: number[]
): Promise<LineWithPlayers> => {
  const response = await apiClient.delete<LineWithPlayers>(
    `/lines/${lineId}/players`,
    { data: { player_ids: playerIds } as PlayerIdsRequest }
  );
  return response.data;
};
