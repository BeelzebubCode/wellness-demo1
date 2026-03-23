// src/features/auth/api.ts
import type { LoginCredentials, LoginResponse, AuthUser } from "./types";

const API_BASE = "/api/v2/auth";

export type MeResponse = {
  valid: boolean;
  account?: AuthUser;
  error?: string;
};

type ApiErrorShape = { error?: string; message?: string };

// =======================
// JSON helper
// =======================
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// =======================
// ✅ Request de-dup (inflight)
// =======================
const inflight = new Map<string, Promise<any>>();
function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const exist = inflight.get(key);
  if (exist) return exist as Promise<T>;

  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

// =======================
// ✅ Me() cache (30s TTL)
// =======================
const ME_CACHE_TTL = 30_000; // 30 seconds
let meCache: { data: MeResponse; ts: number } | null = null;

export function invalidateMeCache() {
  meCache = null;
}

// =======================
// Base methods
// =======================
async function get<T>(url: string): Promise<T> {
  return dedupe(`GET:${url}`, async () => {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (res.status === 401 || res.status === 403) {
      const data = await safeJson<ApiErrorShape>(res);
      return ({ valid: false, ...(data || {}) } as unknown) as T;
    }

    if (!res.ok) {
      const data = await safeJson<ApiErrorShape>(res);
      return ({
        valid: false,
        error: data?.error || data?.message || `HTTP ${res.status}`,
      } as unknown) as T;
    }

    const data = await safeJson<T>(res);
    return (data ??
      (({ valid: false, error: "Invalid JSON response" } as unknown) as T)) as T;
  });
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  // login ไม่ควร dedupe ตาม body เพราะแต่ละครั้งต่างกัน → ไม่ dedupe
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({ success: false, ...(data || {}) } as unknown) as T;
  }

  if (!res.ok) {
    const data = await safeJson<ApiErrorShape>(res);
    return ({
      success: false,
      error: data?.error || data?.message || `HTTP ${res.status}`,
    } as unknown) as T;
  }

  const data = await safeJson<T>(res);
  return (data ??
    (({ success: false, error: "Invalid JSON response" } as unknown) as T)) as T;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return post<LoginResponse>(`${API_BASE}/login`, credentials);
  },

  async me(): Promise<MeResponse> {
    // ✅ Return cached result if still fresh
    if (meCache && Date.now() - meCache.ts < ME_CACHE_TTL) {
      return meCache.data;
    }
    const data = await get<MeResponse>(`${API_BASE}/me`);
    if (data?.valid) {
      meCache = { data, ts: Date.now() };
    }
    return data;
  },

  async logout(): Promise<void> {
    invalidateMeCache(); // ✅ Clear cache on logout
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok && res.status !== 204) {
      const data = await safeJson<ApiErrorShape>(res);
      throw new Error(data?.error || data?.message || `Logout failed: ${res.status}`);
    }
  },

  async switchTenant(universityId: number): Promise<{
    success: boolean;
    activeUniversityId?: number;
    universityCode?: string;
    error?: string;
  }> {
    invalidateMeCache(); // ✅ Clear cache on tenant switch
    return post(`${API_BASE}/switch-tenant`, { universityId });
  },
};

export default authApi;
