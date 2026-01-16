import { apiClient } from "./api";
import type {
  Game,
  GameCreate,
  GameUpdate,
  GameDetail,
  GameWithScore,
  PointWithPlayers,
} from "../types";

// Create a new game
export const createGame = async (data: GameCreate): Promise<Game> => {
  const response = await apiClient.post<Game>("/games", data);
  return response.data;
};

// Get game by ID with score and points
export const getGame = async (gameId: number): Promise<GameDetail> => {
  const response = await apiClient.get<GameDetail>(`/games/${gameId}`);
  return response.data;
};

// Update game
export const updateGame = async (
  gameId: number,
  data: GameUpdate
): Promise<Game> => {
  const response = await apiClient.put<Game>(`/games/${gameId}`, data);
  return response.data;
};

// Finish game
export const finishGame = async (gameId: number): Promise<Game> => {
  const response = await apiClient.post<Game>(`/games/${gameId}/finish`);
  return response.data;
};

// Delete game
export const deleteGame = async (gameId: number): Promise<void> => {
  await apiClient.delete(`/games/${gameId}`);
};

// Get all games
export const getAllGames = async (): Promise<GameWithScore[]> => {
  const response = await apiClient.get<GameWithScore[]>("/games");
  return response.data;
};

// Get all points for a game
export const getGamePoints = async (
  gameId: number
): Promise<PointWithPlayers[]> => {
  const response = await apiClient.get<PointWithPlayers[]>(
    `/games/${gameId}/points`
  );
  return response.data;
};
