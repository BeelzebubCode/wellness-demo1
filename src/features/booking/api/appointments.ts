// src/features/booking/api/appointments.ts

import type { MyAppointmentsResponse, MyBookingDto } from "../types";

// ✅ Returns the full response (items + total)
export async function getMyAppointmentsFull(
  opts?: { 
    universityId?: number; 
    statusGroup?: "ALL" | "ACTIVE" | "HISTORY";
    limit?: number;
    signal?: AbortSignal 
  },
): Promise<MyAppointmentsResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.universityId != null) headers["x-university-id"] = String(opts.universityId);

  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.statusGroup) params.set("statusGroup", opts.statusGroup);

  const res = await fetch(`/api/v2/bookings/my?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to fetch my appointments (${res.status}): ${msg}`);
  }

  const data: MyAppointmentsResponse = await res.json().catch(() => {
    throw new Error("Invalid JSON response from my appointments API");
  });

  if (!data.success) {
    throw new Error("error" in data ? data.error : "API returned unsuccessful response");
  }

  return data;
}

// ✅ Keep old signature for compatibility
export async function getMyAppointments(
  opts?: { 
    universityId?: number; 
    statusGroup?: "ALL" | "ACTIVE" | "HISTORY";
    limit?: number;
    signal?: AbortSignal 
  },
): Promise<MyBookingDto[]> {
  const data = await getMyAppointmentsFull(opts);
  if (data.success === true) {
    return Array.isArray(data.items) ? data.items : [];
  }
  return [];
}

export interface BookingHistoryResponse {
  items: MyBookingDto[];
  total: number;
  page: number;
  limit: number;
}

export async function getBookingHistory(
  opts?: { 
    universityId?: number; 
    page?: number; 
    limit?: number; 
    signal?: AbortSignal 
  }
): Promise<BookingHistoryResponse> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.universityId != null) headers["x-university-id"] = String(opts.universityId);

  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  params.set("statusGroup", "HISTORY");

  const res = await fetch(`/api/v2/bookings/my?${params.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch booking history (${res.status})`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "API returned unsuccessful response");
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total || 0),
    page: Number(data.page || 1),
    limit: Number(data.limit || 10),
  };
}
