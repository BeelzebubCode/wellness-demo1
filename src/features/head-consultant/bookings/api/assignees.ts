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

export async function fetchAssignees(): Promise<AssigneeOption[]> {
  const res = await fetch(`/api/v2/consultants?includeBorrowed=true`, { credentials: "include" });
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
      } as AssigneeOption;
    })
    .filter(Boolean) as AssigneeOption[];
}