// src/features/auth/api.ts

import type { LoginCredentials, LoginResponse, AuthUser } from './types';

const API_BASE = '/api/v1/auth';

export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // ⭐ สำคัญ ให้ cookie ถูก set
    });

    return res.json();
  },

  // ✅ Verify จาก httpOnly cookie เท่านั้น
  async verify(): Promise<{ valid: boolean; account?: AuthUser; error?: string }> {
    const res = await fetch(`${API_BASE}/verify`, {
      method: 'GET',
      credentials: 'include', // ⭐ สำคัญมาก
    });

    if (!res.ok) {
      return { valid: false };
    }

    return res.json();
  },

  // Logout (server-side cookie based)
  async logout(): Promise<void> {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    window.location.href = '/admin/login';
  },
};

export default authApi;
