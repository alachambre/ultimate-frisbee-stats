import { apiClient } from './api';
import type { Turnover, TurnoverWithPlayer, TurnoverCreate, TurnoverUpdate } from '../types';

export const getTurnover = async (turnoverId: number): Promise<TurnoverWithPlayer> => {
  const response = await apiClient.get(`/turnovers/${turnoverId}`);
  return response.data;
};

export const getTurnoversByPoint = async (pointId: number): Promise<TurnoverWithPlayer[]> => {
  const response = await apiClient.get(`/turnovers/points/${pointId}/turnovers`);
  return response.data;
};

export const getTurnoversByPlayer = async (playerId: number): Promise<Turnover[]> => {
  const response = await apiClient.get(`/turnovers/players/${playerId}/turnovers`);
  return response.data;
};

export const createTurnover = async (turnover: TurnoverCreate): Promise<TurnoverWithPlayer> => {
  const response = await apiClient.post(`/turnovers`, turnover);
  return response.data;
};

export const updateTurnover = async (turnoverId: number, turnoverUpdate: TurnoverUpdate): Promise<TurnoverWithPlayer> => {
  const response = await apiClient.put(`/turnovers/${turnoverId}`, turnoverUpdate);
  return response.data;
};

export const deleteTurnover = async (turnoverId: number): Promise<void> => {
  await apiClient.delete(`/turnovers/${turnoverId}`);
};
