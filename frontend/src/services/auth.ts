import { apiClient } from "./api";
import type {
  AppCapabilities,
  AppRole,
  AuthEnforcementMode,
} from "../auth/types";

interface ApiCapabilityFlags {
  can_view_public_content: boolean;
  can_view_comments: boolean;
  can_view_strategies: boolean;
  can_edit_data: boolean;
  can_view_statistics: boolean;
  can_export_statistics: boolean;
  can_manage_users: boolean;
}

interface ApiAuthMeResponse {
  role: AppRole;
  capabilities: ApiCapabilityFlags;
  is_authenticated: boolean;
  has_app_access: boolean;
  enforcement_mode: AuthEnforcementMode;
  email: string | null;
  auth_user_id: string | null;
}

export interface AuthMeResponse {
  role: AppRole;
  capabilities: AppCapabilities;
  is_authenticated: boolean;
  has_app_access: boolean;
  enforcement_mode: AuthEnforcementMode;
  email: string | null;
  auth_user_id: string | null;
}

export function mapAuthMeResponse(response: ApiAuthMeResponse): AuthMeResponse {
  return {
    ...response,
    capabilities: {
      canViewPublicContent: response.capabilities.can_view_public_content,
      canViewComments: response.capabilities.can_view_comments,
      canViewStrategies: response.capabilities.can_view_strategies,
      canEditData: response.capabilities.can_edit_data,
      canViewStatistics: response.capabilities.can_view_statistics,
      canExportStatistics: response.capabilities.can_export_statistics,
      canManageUsers: response.capabilities.can_manage_users,
    },
  };
}

export const getAuthMe = async (): Promise<AuthMeResponse> => {
  const response = await apiClient.get<ApiAuthMeResponse>("/auth/me");
  return mapAuthMeResponse(response.data);
};
