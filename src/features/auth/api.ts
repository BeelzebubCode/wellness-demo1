// src/features/auth/api.ts
import type { LoginCredentials, LoginResponse, AuthUser } from "./types";

const API_BASE = "/api/v1/auth";

export type VerifyResponse = {
  valid: boolean;
  account?: AuthUser;
  error?: string;
};

// ✅ helper: GET แบบ cookie-based และไม่ทำให้ 401/403 กลายเป็น exception
async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "include", // ⭐ cookie-based auth
    cache: "no-store",
  });

  // ✅ 401/403 = expected เมื่อยังไม่ login / logout แล้ว
  if (res.status === 401 || res.status === 403) {
    return { valid: false } as unknown as T;
  }

  if (!res.ok) {
    // พยายามอ่าน error แบบไม่พัง
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
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include", // ⭐ สำคัญ ให้ cookie ถูก set
    });

    return res.json();
  },

  // ✅ Verify กลาง (login อยู่ไหม)
  async verify(): Promise<VerifyResponse> {
    return get<VerifyResponse>(`${API_BASE}/verify`);
  },

  // ✅ Verify เฉพาะ Admin/Head
  async verifyAdmin(): Promise<VerifyResponse> {
    return get<VerifyResponse>(`${API_BASE}/verify-admin`);
  },

  // ✅ Verify เฉพาะ Consultant
  async verifyConsultant(): Promise<VerifyResponse> {
    return get<VerifyResponse>(`${API_BASE}/verify-consultant`);
  },

  // ✅ Verify เฉพาะ Student
  async verifyStudent(): Promise<VerifyResponse> {
    return get<VerifyResponse>(`${API_BASE}/verify-student`);
  },

  // ✅ Logout (server-side cookie based)
  async logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include",
    });

    // ถ้า backend ส่ง 204 ก็ถือว่า ok
    if (!res.ok && res.status !== 204) {
      // ไม่ throw ก็ได้ แต่แนะนำ throw เพื่อให้ UI แสดง toast error ได้
      throw new Error(`Logout failed: ${res.status}`);
    }
  },
};

export default authApi;
