// src/features/booking/api/http.ts
import { authFetch } from "@/lib/authFetch";

type ApiOpts = {
  universityId?: number;
  signal?: AbortSignal;
};

function withUniHeader(opts?: ApiOpts, init?: HeadersInit) {
  const headers = new Headers(init ?? {});
  if (opts?.universityId != null) {
    headers.set("x-university-id", String(opts.universityId));
  }
  headers.set("Accept", "application/json");
  return headers;
}

function errMsg(failed: { status: number; data?: any }) {
  const msg =
    failed?.data?.error ??
    failed?.data?.message ??
    (typeof failed?.data === "string" ? failed.data : null) ??
    `HTTP ${failed.status}`;
  return String(msg);
}

export async function apiGet<T>(url: string, opts?: ApiOpts): Promise<T> {
  const res = await authFetch<T>(url, {
    method: "GET",
    headers: withUniHeader(opts),
    next: { revalidate: 60 }, // cache 1 minute for GET requests
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(errMsg(res));
  return res.data;
}

export async function apiPost<T>(url: string, body: any, opts?: ApiOpts): Promise<T> {
  const res = await authFetch<T>(url, {
    method: "POST",
    headers: withUniHeader(opts, { "content-type": "application/json" }),
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(errMsg(res));
  return res.data;
}

/** ✅ เพิ่มใหม่: PATCH */
export async function apiPatch<T>(url: string, body: any, opts?: ApiOpts): Promise<T> {
  const res = await authFetch<T>(url, {
    method: "PATCH",
    headers: withUniHeader(opts, { "content-type": "application/json" }),
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(errMsg(res));
  return res.data;
}
