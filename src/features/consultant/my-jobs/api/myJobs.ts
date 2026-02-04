// src/features/consultant/my-jobs/api/myJobs.ts
import type { MyBookingApiRow } from "../types";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  return data ?? {};
}

export async function fetchMyBookings(): Promise<MyBookingApiRow[]> {
  const res = await fetch("/api/v2/bookings/my", {
    credentials: "include",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error ?? "โหลดงานไม่สำเร็จ");

  return (data.bookings ?? []) as MyBookingApiRow[];
}

/**
 * ✅ Consultant กด “รับเคส”
 * - backend จะเปลี่ยน ASSIGNED -> IN_PROGRESS
 * - ถ้าเป็น ONLINE และยังไม่มีช่องทางออนไลน์ -> requireOnlineChannel: true
 */
export async function startBooking(bookingId: number) {
  const res = await fetch(`/api/v2/bookings/${bookingId}/start`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error ?? "เริ่มงานไม่สำเร็จ");

  return data as {
    success: boolean;
    status: string;
    requireOnlineChannel?: boolean;

    // (optional) ถ้า backend อยากส่งกลับมาให้ UI อัปเดตเลย
    serviceMode?: "ONSITE" | "ONLINE" | string | null;
    onlineChannelUrl?: string | null;
    onlineChannelNote?: string | null;
  };
}

export async function completeBooking(
  bookingId: number,
  body: { consultantNote: string; nextStep?: string | null; riskLevel?: number | null }
) {
  const res = await fetch(`/api/v2/bookings/${bookingId}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error ?? "ส่งงานไม่สำเร็จ");
  return data as { success: boolean; status: string };
}

/**
 * ✅ ส่งช่องทางออนไลน์ให้ student
 * (ใน backend เราจะทำให้เซฟ + (optional) ยิง notification/LINE ตามที่พงษ์ต้องการ)
 */
export async function setOnlineChannel(
  bookingId: number,
  input: { url: string; note?: string }
) {
  const res = await fetch(`/api/v2/bookings/${bookingId}/online-channel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify(input),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error ?? "ส่งช่องทางออนไลน์ไม่สำเร็จ");

  return data as { success: boolean };
}
