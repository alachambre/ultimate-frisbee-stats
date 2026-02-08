import { apiClient } from "./api";
import type { Stoppage, StoppageCreate, StoppageUpdate } from "../types";

export const getStoppage = async (stoppageId: number): Promise<Stoppage> => {
  const response = await apiClient.get(`/stoppages/${stoppageId}`);
  return response.data;
};

export const getStoppagesByPoint = async (pointId: number): Promise<Stoppage[]> => {
  const response = await apiClient.get(`/stoppages/points/${pointId}/stoppages`);
  return response.data;
};

export const createStoppage = async (stoppage: StoppageCreate): Promise<Stoppage> => {
  const response = await apiClient.post(`/stoppages`, stoppage);
  return response.data;
};

export const updateStoppage = async (
  stoppageId: number,
  stoppageUpdate: StoppageUpdate
): Promise<Stoppage> => {
  const response = await apiClient.put(`/stoppages/${stoppageId}`, stoppageUpdate);
  return response.data;
};

export const deleteStoppage = async (stoppageId: number): Promise<void> => {
  await apiClient.delete(`/stoppages/${stoppageId}`);
};
