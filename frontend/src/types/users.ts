import type { ManagedUserRole } from "./enums";

export interface ManagedUser {
  id: number;
  auth_user_id: string;
  email: string;
  role: ManagedUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManagedUserCreate {
  email: string;
  password: string;
  role: ManagedUserRole;
  is_active: boolean;
}

export interface ManagedUserUpdate {
  email?: string;
  password?: string;
  role?: ManagedUserRole;
  is_active?: boolean;
}
