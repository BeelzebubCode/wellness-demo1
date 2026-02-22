// src/features/head-consultant/exception-requests/api/requests.ts
import type { ExceptionRequestRow, ExceptionRequestDetail } from "../types";
import { ExceptionStatus } from "@prisma/client";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function fetchExceptionRequests(
  statusFilter: ExceptionStatus | "ALL" = "ALL",
  page: number = 1
): Promise<{ data: ExceptionRequestRow[]; meta: any }> {
  const qs = new URLSearchParams();
  if (statusFilter !== "ALL") qs.set("status", statusFilter);
  qs.set("page", page.toString());

  const res = await fetch(`/api/v2/head-consultant/exception-requests?${qs.toString()}`, {
    credentials: "include",
  });
  return safeJson(res);
}

export async function fetchExceptionRequestDetail(id: number): Promise<ExceptionRequestDetail> {
  const res = await fetch(`/api/v2/head-consultant/exception-requests/${id}`, {
    credentials: "include",
  });
  const json = await safeJson(res);
  return json.data;
}

export async function reviewExceptionRequest(id: number, action: "APPROVE" | "REJECT", decisionNote?: string) {
  const res = await fetch(`/api/v2/head-consultant/exception-requests/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, decision_note: decisionNote }),
  });
  return safeJson(res);
}
