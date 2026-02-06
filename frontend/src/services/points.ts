import { apiClient } from "./api";
import type { AxiosError } from "axios";
import type { PointCreate, PointFinish, PointUpdate, PointWithPlayers } from "../types";

// Start a new point (creates an active point)
export const startPoint = async (data: PointCreate): Promise<PointWithPlayers> => {
  const response = await apiClient.post<PointWithPlayers>("/points", data);
  return response.data;
};

// Finish an active point
export const finishPoint = async (
  pointId: number,
  data: PointFinish
): Promise<PointWithPlayers> => {
  const response = await apiClient.post<PointWithPlayers>(`/points/${pointId}/finish`, data);
  return response.data;
};

// Cancel (delete) an active point
export const cancelPoint = async (pointId: number): Promise<void> => {
  await apiClient.delete(`/points/${pointId}/cancel`);
};

// Get active point for a game (ready or running) (returns null if 404)
export const getActivePoint = async (gameId: number): Promise<PointWithPlayers | null> => {
  try {
    const response = await apiClient.get<PointWithPlayers>(`/points/games/${gameId}/active`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Deprecated: Use getActivePoint instead
// Get running point for a game (returns null if 404)
export const getRunningPoint = async (gameId: number): Promise<PointWithPlayers | null> => {
  try {
    const response = await apiClient.get<PointWithPlayers>(`/points/games/${gameId}/running`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get point by ID with player details
export const getPoint = async (pointId: number): Promise<PointWithPlayers> => {
  const response = await apiClient.get<PointWithPlayers>(`/points/${pointId}`);
  return response.data;
};

// Update point
export const updatePoint = async (
  pointId: number,
  data: PointUpdate
): Promise<PointWithPlayers> => {
  const response = await apiClient.put<PointWithPlayers>(`/points/${pointId}`, data);
  return response.data;
};

// Delete point
export const deletePoint = async (pointId: number): Promise<void> => {
  await apiClient.delete(`/points/${pointId}`);
};
