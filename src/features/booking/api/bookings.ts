// src/features/booking/api/bookings.ts

import type { BookingPayload, CreateBookingResponse, CancelBookingInput } from "../types";
import { apiPost, apiPatch } from "./http";

export async function createBooking(
  payload: BookingPayload,
  opts?: { universityId?: number; signal?: AbortSignal },
): Promise<CreateBookingResponse> {
  const data = await apiPost<CreateBookingResponse>("/api/v2/bookings", payload, {
    universityId: opts?.universityId,
    signal: opts?.signal,
  });

  if ((data as any)?.success !== true) {
    const msg = (data as any)?.error ?? "Create booking failed";
    throw new Error(String(msg));
  }

  return data;
}

export async function cancelBooking(
  input: CancelBookingInput,
  opts?: { universityId?: number; signal?: AbortSignal },
): Promise<{ success: true; status: string } | { success: false; error: string }> {
  const universityId = opts?.universityId ?? input.universityId;

  const data = await apiPatch<{ success: true; status: string } | { success: false; error: string }>(
    `/api/v2/bookings/${input.bookingId}/cancel`,
    { 
      cancellationReasonId: input.cancellationReasonId,
      cancellationNote: input.cancellationNote,
    },
    { universityId, signal: opts?.signal },
  );

  if ((data as any)?.success !== true) {
    const msg = (data as any)?.error ?? "Cancel booking failed";
    throw new Error(String(msg));
  }

  return data;
}
