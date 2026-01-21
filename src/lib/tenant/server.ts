// src/lib/tenant/server.ts
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
 * - STUDENT/CONSULTANT: lock tenant (ใช้ activeUniversityId ที่ resolve จาก DB แล้ว)
 * - STAFF: เลือกได้ แต่ต้องอยู่ใน allowedUniversityIds
 *
 * priority ของ tenant สำหรับ STAFF:
 *   1) header x-university-id
 *   2) account.activeUniversityId
 *   3) account.homeUniversityId
 */
export async function requireTenant(request: NextRequest): Promise<TenantContext> {
  const account = await getAccountFromRequest(request);
  if (!account) throw err("UNAUTHORIZED", 401);

  const role = String(account.role || "").toUpperCase();

  // ====== 1) STUDENT / CONSULTANT: lock tenant ======
  if (role === "STUDENT" || role === "CONSULTANT") {
    // ✅ ใช้ activeUniversityId ก่อน (ถูกล็อกจาก DB แล้วใน getAccountFromRequest)
    const locked = account.activeUniversityId ?? account.homeUniversityId ?? null;
    if (!locked) throw err("NO_UNIVERSITY_CONTEXT", 400);

    // ✅ ignore header x-university-id ทั้งหมด
    return { account, activeUniversityId: locked };
  }

  // ====== 2) STAFF: allow switching ======
  const headerUni = request.headers.get("x-university-id");
  const headerUniId = headerUni ? Number(headerUni) : NaN;

  const picked =
    Number.isFinite(headerUniId) && headerUniId > 0
      ? headerUniId
      : account.activeUniversityId ?? account.homeUniversityId ?? null;

  if (!picked) throw err("NO_UNIVERSITY_CONTEXT", 400);

  // ✅ check allow-list
  const allowed = account.allowedUniversityIds ?? [];
  if (allowed.length > 0 && !allowed.includes(picked)) {
    throw err("UNIVERSITY_NOT_ALLOWED", 403);
  }

  return { account, activeUniversityId: picked };
}

/** เช็ค role แบบง่าย ๆ (ถ้าไม่ผ่าน -> 403) */
export function assertRole(role: string, allow: string[]) {
  if (!allow.includes(role)) throw err("FORBIDDEN", 403);
}
