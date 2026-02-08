import { apiClient } from "./api";
import type { Halftime, HalftimeCreate, HalftimeUpdate } from "../types";

export const createHalftime = async (halftime: HalftimeCreate): Promise<Halftime> => {
  const response = await apiClient.post<Halftime>("/halftimes", halftime);
  return response.data;
};

export const getHalftimeByGame = async (gameId: number): Promise<Halftime> => {
  const response = await apiClient.get<Halftime>(`/halftimes/games/${gameId}/halftime`);
  return response.data;
};

export const updateHalftime = async (
  halftimeId: number,
  halftimeUpdate: HalftimeUpdate
): Promise<Halftime> => {
  const response = await apiClient.put<Halftime>(`/halftimes/${halftimeId}`, halftimeUpdate);
  return response.data;
};

export const deleteHalftime = async (halftimeId: number): Promise<void> => {
  await apiClient.delete(`/halftimes/${halftimeId}`);
};
