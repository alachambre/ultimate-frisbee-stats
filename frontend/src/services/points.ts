import { apiClient } from "./api";
import type { Point, PointCreate, PointUpdate, PointWithPlayers } from "../types";

// Create a new point
export const createPoint = async (data: PointCreate): Promise<Point> => {
  const response = await apiClient.post<Point>("/points", data);
  return response.data;
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
): Promise<Point> => {
  const response = await apiClient.put<Point>(`/points/${pointId}`, data);
  return response.data;
};

// Delete point
export const deletePoint = async (pointId: number): Promise<void> => {
  await apiClient.delete(`/points/${pointId}`);
};
