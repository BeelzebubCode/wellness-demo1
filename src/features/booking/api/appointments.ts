// src/features/booking/api/appointments.ts

import type { MyAppointmentsResponse, MyBookingDto } from "../types";

export async function getMyAppointments(
  opts?: { universityId?: number; signal?: AbortSignal },
): Promise<MyBookingDto[]> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts?.universityId != null) headers["x-university-id"] = String(opts.universityId);

  const res = await fetch("/api/v2/bookings/my", {
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

  // ✅ v2 ตอบ items
  return Array.isArray(data.items) ? data.items : [];
}
