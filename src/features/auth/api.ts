// src/features/auth/api.ts
import type { LoginCredentials, LoginResponse, AuthUser } from "./types";

const API_BASE = "/api/v2/auth";

export type MeResponse = {
  valid: boolean;
  account?: AuthUser;
  error?: string;
};

type ApiErrorShape = { error?: string; message?: string };

async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: { "Accept": "application/json" },
  });

  // auth fail (token missing/expired/forbidden)
  if (res.status === 401 || res.status === 403) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({ valid: false, ...(data || {}) } as unknown) as T;
  }

  if (!res.ok) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({ valid: false, error: data?.error || data?.message || `HTTP ${res.status}` } as unknown) as T;
  }

  const data = await safeJson<T>(res);
  // กันกรณี server ส่งไม่ใช่ JSON
  return (data ?? ({ valid: false, error: "Invalid JSON response" } as unknown)) as T;
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  // login / switch-tenant อาจได้ 401/403 เหมือนกัน
  if (res.status === 401 || res.status === 403) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({ success: false, ...(data || {}) } as unknown) as T;
  }

  if (!res.ok) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({ success: false, error: data?.error || data?.message || `HTTP ${res.status}` } as unknown) as T;
  }

  const data = await safeJson<T>(res);
  return (data ?? ({ success: false, error: "Invalid JSON response" } as unknown)) as T;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // ✅ ใช้ post() เพื่อได้ error handling มาตรฐานเดียว
    return post<LoginResponse>(`${API_BASE}/login`, credentials);
  },

  async me(): Promise<MeResponse> {
    return get<MeResponse>(`${API_BASE}/me`);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    // logout บางทีอาจคืน 204
    if (!res.ok && res.status !== 204) {
      const data = await safeJson<ApiErrorShape>(res);
      throw new Error(data?.error || data?.message || `Logout failed: ${res.status}`);
    }
  },

  /** ✅ เผื่อคุณทำ route /api/v2/auth/switch-tenant แล้ว */
  async switchTenant(universityId: number): Promise<{ success: boolean; activeUniversityId?: number; error?: string }> {
    return post(`${API_BASE}/switch-tenant`, { universityId });
  },
};

export default authApi;
