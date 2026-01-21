// src/lib/tenant.ts
import type { NextRequest } from "next/server";
import { getAccountFromRequest } from "@/lib/jwt";
import type { AccountContext } from "@/lib/jwt";

export type TenantContext = {
  account: AccountContext;
  activeUniversityId: number;
};

/** บังคับต้อง login + ต้องมี activeUniversityId */
export async function requireTenant(request: NextRequest): Promise<TenantContext> {
  const account = await getAccountFromRequest(request);

  if (!account) {
    const e: any = new Error("UNAUTHORIZED");
    e.status = 401;
    throw e;
  }

  const activeUniversityId = account.activeUniversityId ?? account.homeUniversityId ?? null;

  if (!activeUniversityId) {
    const e: any = new Error("NO_UNIVERSITY_CONTEXT");
    e.status = 400;
    throw e;
  }

  // ✅ เช็คว่ามหาลัยที่ active อยู่ใน allowed (กันคนแก้ header มั่ว)
  const allowed = account.allowedUniversityIds ?? [];
  if (allowed.length > 0 && !allowed.includes(activeUniversityId)) {
    const e: any = new Error("UNIVERSITY_NOT_ALLOWED");
    e.status = 403;
    throw e;
  }

  return { account, activeUniversityId };
}

/** เช็ค role แบบง่าย ๆ (ถ้าไม่ผ่าน -> 403) */
export function assertRole(role: string, allow: string[]) {
  if (!allow.includes(role)) {
    const e: any = new Error("FORBIDDEN");
    e.status = 403;
    throw e;
  }
}
