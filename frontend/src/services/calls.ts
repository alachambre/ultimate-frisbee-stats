import axios from 'axios';
import type { Call, CallCreate, CallUpdate } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getCall = async (callId: number): Promise<Call> => {
  const response = await axios.get(`${API_URL}/calls/${callId}`);
  return response.data;
};

export const getCallsByPoint = async (pointId: number): Promise<Call[]> => {
  const response = await axios.get(`${API_URL}/calls/points/${pointId}/calls`);
  return response.data;
};

export const createCall = async (call: CallCreate): Promise<Call> => {
  const response = await axios.post(`${API_URL}/calls`, call);
  return response.data;
};

export const updateCall = async (callId: number, callUpdate: CallUpdate): Promise<Call> => {
  const response = await axios.put(`${API_URL}/calls/${callId}`, callUpdate);
  return response.data;
};

export const deleteCall = async (callId: number): Promise<void> => {
  await axios.delete(`${API_URL}/calls/${callId}`);
};
