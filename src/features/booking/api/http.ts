// src/features/booking/api/http.ts
import { authFetch } from "@/lib/authFetch";

export async function apiGet<T>(url: string): Promise<T> {
  const res = await authFetch(url, { method: "GET" });
  if (!res.ok) throw new Error(await safeText(res));
  return (await res.json()) as T;
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await authFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await safeText(res));
  return (await res.json()) as T;
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return `HTTP ${res.status}`;
  }
}
