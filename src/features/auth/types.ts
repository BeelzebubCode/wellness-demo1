// src/features/auth/types.ts

export interface LoginCredentials {
  username: string;
  password: string;
  preferredUniversityId?: number;
}

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
  consultantId?: number | null;
  studentId?: number | null;

  // ✅ tenant context (มาจาก /me และจาก login response v2)
  homeUniversityId?: number | null;
  allowedUniversityIds?: number[];
  activeUniversityId?: number | null;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  account?: AuthUser;
  error?: string;

  // ✅ v2 response fields
  tenant?: {
    universityId: number | null;
    universityCode: string;
    suggestedSubdomain?: string | null;
  };
  tenants?: { universityId: number; code: string }[];
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
