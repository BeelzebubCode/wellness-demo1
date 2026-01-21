// src/lib/tenant.ts
import type { NextRequest } from "next/server";
import { getAccountFromRequest } from "@/lib/jwt";
import type { AccountContext } from "@/lib/jwt";

export type TenantContext = {
  account: AccountContext;
  activeUniversityId: number;
};

const STAFF_ROLES = ["HEAD_CONSULTANT", "ADMIN", "SUPER_ADMIN", "RECTOR"] as const;

function err(message: string, status: number) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

/**
 * tenant guard (สำคัญสุด)
 * - ต้อง login
 * - STUDENT/CONSULTANT: บังคับใช้ homeUniversityId เท่านั้น (ห้ามเลือกเอง)
 * - STAFF: เลือกได้ แต่ต้องอยู่ใน allowedUniversityIds (ถ้ามี)
 *
 * priority ของ tenant สำหรับ STAFF:
 *   1) header x-university-id
 *   2) account.activeUniversityId (มาจาก token/claim ถ้าคุณมี)
 *   3) account.homeUniversityId
 */
export async function requireTenant(request: NextRequest): Promise<TenantContext> {
  const account = await getAccountFromRequest(request);
  if (!account) throw err("UNAUTHORIZED", 401);

  // ====== 1) STUDENT / CONSULTANT: lock tenant ======
  if (account.role === "STUDENT" || account.role === "CONSULTANT") {
    const home = account.homeUniversityId;
    if (!home) throw err("NO_HOME_UNIVERSITY", 400);

    // ✅ ignore activeUniversityId / header ทั้งหมด
    return { account, activeUniversityId: home };
  }

  // ====== 2) STAFF: allow switching ======
  const headerUni = request.headers.get("x-university-id");
  const headerUniId = headerUni ? Number(headerUni) : NaN;

  const picked =
    Number.isFinite(headerUniId) && headerUniId > 0
      ? headerUniId
      : account.activeUniversityId ?? account.homeUniversityId ?? null;

  if (!picked) throw err("NO_UNIVERSITY_CONTEXT", 400);

  // ✅ check allow-list (ถ้าคุณมีระบบยืมมหาลัย)
  const allowed = account.allowedUniversityIds ?? [];
  if (allowed.length > 0 && !allowed.includes(picked)) {
    throw err("UNIVERSITY_NOT_ALLOWED", 403);
  }

  return { account, activeUniversityId: picked };
}

/** เช็ค role แบบง่าย ๆ (ถ้าไม่ผ่าน -> 403) */
export function assertRole(role: string, allow: string[]) {
  if (!allow.includes(role)) {
    throw err("FORBIDDEN", 403);
  }
}
