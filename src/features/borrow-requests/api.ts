// src/features/borrow-requests/api.ts

import type {
  BorrowRequest,
  BorrowRequestDetail,
  CreateBorrowRequestInput,
  BorrowRequestListResponse,
  PlatformListParams,
  AssignBorrowRequestInput,
  UpdateBorrowRequestInput,
} from "./types";

async function safeJson(res: Response) {
  const txt = await res.text();
  try {
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });

  const data = await safeJson(res);

  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

function qs(obj: Record<string, any>) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || v === "ALL") return;
    p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

// --------------------
// HEAD (counseling-admin)
// --------------------
const HEAD_BASE = "/api/v2/borrow-request";

export const borrowRequestsApi = {
  listMy: () => apiFetch<{ ok: true; data: BorrowRequest[] }>(HEAD_BASE),

  create: (input: CreateBorrowRequestInput) =>
    apiFetch<{ ok: true; data: BorrowRequest }>(HEAD_BASE, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  get: (id: number) =>
    apiFetch<{ ok: true; data: BorrowRequestDetail }>(`${HEAD_BASE}/${id}`),

  update: (id: number, input: UpdateBorrowRequestInput) =>
    apiFetch<{ ok: true; data: BorrowRequest }>(`${HEAD_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  submit: (id: number) =>
    apiFetch<{ ok: true; data: BorrowRequest }>(`${HEAD_BASE}/${id}/submit`, {
      method: "POST",
    }),

  cancel: (id: number) =>
    apiFetch<{ ok: true; data: BorrowRequest }>(`${HEAD_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
};

// --------------------
// SUPER_ADMIN (platform)
// --------------------
export const platformBorrowRequestsApi = {
  // ✅ แก้ return type ให้ถูกต้อง
  list: (params: PlatformListParams) =>
    apiFetch<{ ok: true; data: BorrowRequestListResponse }>(
      `/api/v2/platform/borrow-requests${qs(params)}`
    ),

  get: (id: number) =>
    apiFetch<{ ok: true; data: BorrowRequestDetail }>(
      `/api/v2/platform/borrow-requests/${id}`
    ),

  approve: (id: number) =>
    apiFetch<{ ok: true; data: BorrowRequest }>(
      `/api/v2/platform/borrow-requests/${id}/approve`,
      { method: "POST" }
    ),

  assign: (id: number, input: AssignBorrowRequestInput) =>
    apiFetch<{ ok: true; data: BorrowRequestDetail }>(
      `/api/v2/platform/borrow-requests/${id}/assign`,
      { method: "POST", body: JSON.stringify(input) }
    ),
};