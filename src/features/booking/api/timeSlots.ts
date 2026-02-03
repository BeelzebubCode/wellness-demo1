// src/features/booking/api/timeSlots.ts

import type { TimeSlot } from "../types";

interface GetTimeSlotsResponse {
  success: boolean;
  date: string;
  universityId: number;
  slots: TimeSlot[];
}

export async function getTimeSlots(
  date: string,
  opts?: { universityId?: number; signal?: AbortSignal },
): Promise<TimeSlot[]> {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (opts?.universityId) headers["x-university-id"] = String(opts.universityId);

  const res = await fetch(`/api/v2/time-slots?date=${encodeURIComponent(date)}`, {
    method: "GET",
    headers,
    credentials: "include",
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Failed to fetch time slots (${res.status}): ${msg}`);
  }

  const data: GetTimeSlotsResponse = await res.json().catch(() => {
    throw new Error("Invalid JSON response from time-slots API");
  });

  if (!data?.success) throw new Error("API returned unsuccessful response");

  return Array.isArray(data.slots) ? data.slots : [];
}
