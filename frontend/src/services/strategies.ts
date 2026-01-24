import { apiClient } from "./api";
import type { Strategy, StrategyCreate, StrategyUpdate, StrategyCategory } from "../types";

// Create a new strategy
export const createStrategy = async (data: StrategyCreate): Promise<Strategy> => {
  const response = await apiClient.post<Strategy>("/strategies", data);
  return response.data;
};

// Get all strategies with optional category filter
export const getStrategies = async (category?: StrategyCategory): Promise<Strategy[]> => {
  const params = category ? { category } : {};
  const response = await apiClient.get<Strategy[]>("/strategies", { params });
  return response.data;
};

// Get strategy by ID
export const getStrategy = async (strategyId: number): Promise<Strategy> => {
  const response = await apiClient.get<Strategy>(`/strategies/${strategyId}`);
  return response.data;
};

// Update strategy
export const updateStrategy = async (
  strategyId: number,
  data: StrategyUpdate
): Promise<Strategy> => {
  const response = await apiClient.put<Strategy>(`/strategies/${strategyId}`, data);
  return response.data;
};

// Delete strategy
export const deleteStrategy = async (strategyId: number): Promise<void> => {
  await apiClient.delete(`/strategies/${strategyId}`);
};
