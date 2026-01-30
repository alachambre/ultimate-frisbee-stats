import { apiClient } from './api';
import type { Call, CallCreate, CallUpdate } from '../types';

export const getCall = async (callId: number): Promise<Call> => {
  const response = await apiClient.get(`/calls/${callId}`);
  return response.data;
};

export const getCallsByPoint = async (pointId: number): Promise<Call[]> => {
  const response = await apiClient.get(`/calls/points/${pointId}/calls`);
  return response.data;
};

export const createCall = async (call: CallCreate): Promise<Call> => {
  const response = await apiClient.post(`/calls`, call);
  return response.data;
};

export const updateCall = async (callId: number, callUpdate: CallUpdate): Promise<Call> => {
  const response = await apiClient.put(`/calls/${callId}`, callUpdate);
  return response.data;
};

export const deleteCall = async (callId: number): Promise<void> => {
  await apiClient.delete(`/calls/${callId}`);
};
