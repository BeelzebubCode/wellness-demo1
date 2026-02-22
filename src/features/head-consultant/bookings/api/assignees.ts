// src/features/head-consultant/bookings/api/assignees.ts
import type { AssigneeOption } from "../types";

async function safeJson(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export async function fetchAssignees(date?: string): Promise<AssigneeOption[]> {
  const url = date
    ? `/api/v2/consultants?includeBorrowed=true&date=${date}`
    : `/api/v2/consultants?includeBorrowed=true`;

  const res = await fetch(url, { credentials: "include" });
  const data = await safeJson(res);

  const raw = (data.consultants ?? []) as any[];

  return raw
    .map((c) => {
      const consultantId = Number(c.consultant_id ?? c.consultantId ?? c.id);

      const name =
        c.name ??
        c.consultantName ??
        (c.profile
          ? `${c.profile.consultant_first_name ?? ""} ${c.profile.consultant_last_name ?? ""}`.trim()
          : null);

      if (!Number.isFinite(consultantId) || !name) return null;

      const borrowAssignmentId = Number(c.borrowAssignmentId);

      return {
        id: consultantId,
        name,
        borrowAssignmentId: Number.isFinite(borrowAssignmentId) ? borrowAssignmentId : undefined,
        activeBookings: typeof c.activeBookings === "number" ? c.activeBookings : 0,
        avgRating: typeof c.avgRating === "number" ? c.avgRating : null,
        feedbackCount: typeof c.feedbackCount === "number" ? c.feedbackCount : 0,
        accountRole: c.accountRole ?? null,
        specializations: c.specializations ?? [],
        busySlots: c.busySlots ?? [],
      } as AssigneeOption;
    })
    .filter((c): c is AssigneeOption => c !== null)
    // ✅ Filter out staff/head roles — head should not assign work to themselves
    .filter((c) => {
      const staffRoles = ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN", "RECTOR"];
      return !staffRoles.includes(c.accountRole ?? "");
    });
}