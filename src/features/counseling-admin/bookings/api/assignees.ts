// src/features/counseling-admin/bookings/api/assignees.ts
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
  const res = await fetch(`/api/v2/consultants`, { credentials: "include" });
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
      return { id: consultantId, name } as AssigneeOption;
    })
    .filter(Boolean) as AssigneeOption[];
}