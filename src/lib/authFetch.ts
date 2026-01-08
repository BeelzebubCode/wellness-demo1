// src/lib/authFetch.ts
"use client";

import { useNotificationContext } from "@/components/notification/NotificationProvider";

type AuthFetchOptions = RequestInit & {
  redirectTo?: string;     // default: /login
  nextPath?: string;       // path ที่จะส่งไปเป็น ?next=
  toastKey?: string;       // กัน toast เด้งรัว
  toastTitle?: string;
  toastMessage?: string;
};

export function buildNextLoginUrl(redirectTo: string, nextPath?: string) {
  const base = redirectTo || "/login";
  const next = nextPath && nextPath !== "/login" ? nextPath : "/";
  return `${base}?next=${encodeURIComponent(next)}`;
}

export async function authFetch<T = any>(
  url: string,
  opts: AuthFetchOptions
): Promise<{ ok: true; data: T } | { ok: false; status: number; data?: any }> {
  const res = await fetch(url, {
    ...opts,
    credentials: "include",
    headers: {
      ...(opts.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore json parse error
  }

  if (res.ok) return { ok: true, data };

  return { ok: false, status: res.status, data };
}

/**
 * ใช้ใน hook (client) เพื่อ:
 * - ถ้า 401 -> toast "กรุณาเข้าสู่ระบบ" + redirect ไป login
 */
export function useAuthRedirectHelper() {
  const { push } = useNotificationContext();

  const toastOnce = (key: string, payload: { title: string; message: string }) => {
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {}
    push({
      type: "warning",
      title: payload.title,
      message: payload.message,
      duration: 2200,
    });
  };

  const clearToastOnce = (key: string) => {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  };

  return { toastOnce, clearToastOnce };
}
