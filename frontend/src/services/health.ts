import { apiClient } from "./api";

export interface ApiHealthStatus {
  status: "ok";
  service: string;
  version: string;
}

export async function getApiHealthStatus(): Promise<ApiHealthStatus> {
  const response = await apiClient.get<ApiHealthStatus>("/health");
  return response.data;
}
