import { apiClient } from "./api";
import type {
  AppCapabilities,
  AppRole,
  AuthEnforcementMode,
} from "../auth/types";

export interface AuthMeResponse {
  role: AppRole;
  capabilities: AppCapabilities;
  is_authenticated: boolean;
  has_app_access: boolean;
  enforcement_mode: AuthEnforcementMode;
  email: string | null;
  auth_user_id: string | null;
}

export const getAuthMe = async (): Promise<AuthMeResponse> => {
  const response = await apiClient.get<AuthMeResponse>("/auth/me");
  return response.data;
};
