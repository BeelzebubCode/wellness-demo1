// src/features/auth/api.ts
import type { LoginCredentials, LoginResponse, AuthUser } from "./types";

const API_BASE = "/api/v2/auth";

export type MeResponse = {
  valid: boolean;
  account?: AuthUser;
  error?: string;
};

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    return { valid: false } as unknown as T;
  }

  if (!res.ok) {
    try {
      const data = await res.json();
      return { valid: false, ...data } as unknown as T;
    } catch {
      return { valid: false } as unknown as T;
    }
  }

  return res.json();
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    });
    return res.json();
  },

  // ✅ เหลือแค่นี้
  async me(): Promise<MeResponse> {
    return get<MeResponse>(`${API_BASE}/me`);
  },

  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Logout failed: ${res.status}`);
    }
  },
};

export default authApi;
