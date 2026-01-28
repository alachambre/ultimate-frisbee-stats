import axios from 'axios';
import { Turnover, TurnoverWithPlayer, TurnoverCreate, TurnoverUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getTurnover = async (turnoverId: number): Promise<TurnoverWithPlayer> => {
  const response = await axios.get(`${API_URL}/turnovers/${turnoverId}`);
  return response.data;
};

export const getTurnoversByPoint = async (pointId: number): Promise<TurnoverWithPlayer[]> => {
  const response = await axios.get(`${API_URL}/turnovers/points/${pointId}/turnovers`);
  return response.data;
};

export const getTurnoversByPlayer = async (playerId: number): Promise<Turnover[]> => {
  const response = await axios.get(`${API_URL}/turnovers/players/${playerId}/turnovers`);
  return response.data;
};

export const createTurnover = async (turnover: TurnoverCreate): Promise<TurnoverWithPlayer> => {
  const response = await axios.post(`${API_URL}/turnovers`, turnover);
  return response.data;
};

export const updateTurnover = async (turnoverId: number, turnoverUpdate: TurnoverUpdate): Promise<TurnoverWithPlayer> => {
  const response = await axios.put(`${API_URL}/turnovers/${turnoverId}`, turnoverUpdate);
  return response.data;
};

export const deleteTurnover = async (turnoverId: number): Promise<void> => {
  await axios.delete(`${API_URL}/turnovers/${turnoverId}`);
};
