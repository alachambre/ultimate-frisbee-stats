import { apiClient } from "./api";
import type { ManagedUser, ManagedUserCreate, ManagedUserUpdate } from "../types";

export async function getUsers(): Promise<ManagedUser[]> {
  const response = await apiClient.get<ManagedUser[]>("/users");
  return response.data;
}

export async function createManagedUser(
  payload: ManagedUserCreate
): Promise<ManagedUser> {
  const response = await apiClient.post<ManagedUser>("/users", payload);
  return response.data;
}

export async function updateManagedUser(
  userId: number,
  payload: ManagedUserUpdate
): Promise<ManagedUser> {
  const response = await apiClient.patch<ManagedUser>(`/users/${userId}`, payload);
  return response.data;
}
