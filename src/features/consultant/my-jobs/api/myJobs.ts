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

  // ✅ backend ส่ง MyBookingDto[] ใน data.items
  const items = (data.items ?? data.bookings ?? []);

  // ✅ แปลงจาก MyBookingDto เป็น MyBookingApiRow
  return items.map((item: any) => ({
    id: item.bookingId ?? item.id,
    status: item.status,
    problemType: item.problemCategoryNameTh ?? item.problemType ?? null,
    createdAt: null,
    updatedAt: null,

    // ✅ แปลง startAt/endAt ISO string เป็น date/startTime/endTime
    date: item.startAt ? item.startAt.slice(0, 10) : null,
    startTime: item.startAt ? new Date(item.startAt).toTimeString().slice(0, 5) : null,
    endTime: item.endAt ? new Date(item.endAt).toTimeString().slice(0, 5) : null,

    studentName: item.studentName ?? item.consultantName ?? null,
    bookingDetailText: null,

    serviceMode: item.serviceMode ?? null,
    onlineChannelUrl: item.session?.joinUrl ?? null,
    onlineChannelNote: item.session?.extraDetail ?? null,
    preferredOnlineChannel: item.onlineChannel ?? null,
    phoneNumber: item.session?.phoneNumber ?? null,

    universityName: item.universityName ?? null,
    universityCode: item.universityCode ?? null,
  }));
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
