import { apiClient } from "./api";
import type { Player, PlayerCreate, PlayerUpdate } from "../types";

// Create a new player
export const createPlayer = async (data: PlayerCreate): Promise<Player> => {
  const response = await apiClient.post<Player>("/players", data);
  return response.data;
};

// Get player by ID
export const getPlayer = async (playerId: number): Promise<Player> => {
  const response = await apiClient.get<Player>(`/players/${playerId}`);
  return response.data;
};

// Update player
export const updatePlayer = async (
  playerId: number,
  data: PlayerUpdate
): Promise<Player> => {
  const response = await apiClient.put<Player>(`/players/${playerId}`, data);
  return response.data;
};

// Delete player
export const deletePlayer = async (playerId: number): Promise<void> => {
  await apiClient.delete(`/players/${playerId}`);
};
