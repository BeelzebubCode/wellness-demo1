// src/features/auth/types.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: 'STUDENT' | 'CONSULTANT' | 'HEAD_CONSULTANT';
  consultantId?: number | null;
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