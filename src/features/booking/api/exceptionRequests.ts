// src/features/booking/api/exceptionRequests.ts
import { ExceptionStatus } from "@prisma/client";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

export async function requestException(bookingId: number, reasonCode: string, reasonDetail: string) {
  const res = await fetch(`/api/v2/bookings/${bookingId}/exception-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason_code: reasonCode,
      reason_detail: reasonDetail,
    }),
  });
  return safeJson(res);
}

export async function uploadExceptionEvidences(requestId: number, urls: string[]) {
  const res = await fetch(`/api/v2/exception-requests/${requestId}/evidences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  return safeJson(res);
}

export async function uploadExceptionEvidencesFiles(requestId: number, files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));

  const res = await fetch(`/api/v2/exception-requests/${requestId}/evidences/upload`, {
    method: "POST",
    body: formData,
  });
  return safeJson(res);
}

export async function submitExceptionRequest(requestId: number) {
  const res = await fetch(`/api/v2/exception-requests/${requestId}/submit`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  return safeJson(res);
}
