// src/features/counseling-admin/bookings/api/bookings.ts
import type { AdminBookingRow, AdminBookingStatusFilter } from "../types";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function fetchAdminBookings(
  date: string,
  status: AdminBookingStatusFilter = "ALL",
): Promise<AdminBookingRow[]> {
  const qs = new URLSearchParams();
  qs.set("date", date);
  if (status !== "ALL") qs.set("status", status);

  const res = await fetch(`/api/v2/bookings?${qs.toString()}`, {
    credentials: "include",
  });
  const data = await safeJson(res);
  return (data.bookings ?? []) as AdminBookingRow[];
}

/** ✅ Assign booking -> ต้องส่ง consultantId */
export async function assignBooking(input: {
  universityId: number;
  bookingId: number;
  consultantId: number;
  note?: string;
}) {
  const { universityId, bookingId, consultantId, note } = input;

  const res = await fetch(`/api/v2/bookings/${bookingId}/assign`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      universityId,
      consultantId, // ✅ key หลักที่ต้องส่ง
      note: note ?? null,
    }),
  });

  return safeJson(res);
}

export async function rescheduleBooking(input: {
  universityId: number;
  bookingId: number;
  newTimeSlotId: number;
  note?: string;
}) {
  const res = await fetch(`/api/v2/bookings/${input.bookingId}/status`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      universityId: input.universityId,
      action: "RESCHEDULE",
      newTimeSlotId: input.newTimeSlotId,
      note: input.note ?? null,
    }),
  });

  return safeJson(res);
}

export async function cancelBooking(input: {
  universityId: number;
  bookingId: number;
  reason: string;
}) {
  const res = await fetch(`/api/v2/bookings/${input.bookingId}/cancel`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      universityId: input.universityId,
      reason: input.reason,
    }),
  });

  return safeJson(res);
}
