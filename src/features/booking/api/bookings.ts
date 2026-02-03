// src/features/booking/api/timeSlots.ts
import type { BookingPayload, CreateBookingResponse } from "../types";

export async function createBooking(
  payload: BookingPayload,
  opts?: { universityId?: number; signal?: AbortSignal },
): Promise<CreateBookingResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (opts?.universityId) headers["x-university-id"] = String(opts.universityId);

  const res = await fetch(`/api/v2/bookings`, {
    method: "POST",
    headers,
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(payload),
    signal: opts?.signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to create booking (${res.status}): ${msg}`);
  }

  const data = (await res.json().catch(() => null)) as CreateBookingResponse | null;
  if (!data?.success) throw new Error(data?.error ?? "Create booking failed");

  return data;
}
