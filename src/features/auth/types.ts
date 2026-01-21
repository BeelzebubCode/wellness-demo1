// src/features/auth/types.ts
import type { AccountRole } from "@prisma/client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: AccountRole;
  consultantId?: number | null;

  // ✅ tenant context (มาจาก /me และจาก login response v2)
  homeUniversityId?: number | null;
  allowedUniversityIds?: number[];
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  account?: AuthUser;
  error?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
