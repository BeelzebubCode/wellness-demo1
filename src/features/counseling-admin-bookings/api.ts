// features/counseling-admin-bookings/api.ts

import type { AdminBookingRow, AssigneeOption } from "./type";
import type { BookingStatus } from "@/shared/types/booking";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export type AdminBookingStatusFilter = BookingStatus | "ALL";

export async function fetchAdminBookingsV2(
  date: string,
  status: AdminBookingStatusFilter = "ALL",
): Promise<AdminBookingRow[]> {
  const qs = new URLSearchParams();
  qs.set("date", date);

  // ✅ ใส่ status เฉพาะตอนเลือกไม่ใช่ ALL
  if (status !== "ALL") qs.set("status", status);

  const res = await fetch(`/api/v2/bookings?${qs.toString()}`, {
    credentials: "include",
  });

  const data = await safeJson(res);
  return (data.bookings ?? []) as AdminBookingRow[];
}

// ✅ ใช้ endpoint ที่คุณมีจริง
export async function fetchAssigneesV2(): Promise<AssigneeOption[]> {
  const res = await fetch(`/api/v2/consultants`, { credentials: "include" });
  const data = await safeJson(res);

  const raw = (data.consultants ?? []) as any[];

  return raw
    .map((c) => {
      const id = Number(c.id ?? c.consultantId ?? c.consultant_id);
      const name =
        c.name ??
        c.consultantName ??
        (c.profile
          ? `${c.profile.consultant_first_name ?? ""} ${c.profile.consultant_last_name ?? ""}`.trim()
          : null);

      if (!Number.isFinite(id) || !name) return null;
      return { id, name } as AssigneeOption;
    })
    .filter(Boolean) as AssigneeOption[];
}
