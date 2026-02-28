// src/lib/tenant/server.ts
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/context";
import type { AccountContext } from "@/lib/auth/context";

export type TenantContext = {
  // ✅ fields ที่ route อยากได้
  accountId: number;
  role: string;
  universityId: number;

  // ✅ เก็บของเดิมไว้ (ใช้ต่อได้)
  account: AccountContext;
  activeUniversityId: number;
  tenantCode: string;
};

function err(message: string, status: number) {
  const e: any = new Error(message);
  e.status = status;
  return e;
}

/**
 * ✅ helper: เช็คว่า universityId มีจริงใน DB และ active
 * (กัน header / cookie ใส่มั่ว แล้ว prisma query อื่นพังทีหลัง)
 */
async function assertUniversityExists(universityId: number) {
  const uni = await prisma.university.findUnique({
    where: { university_id: universityId },
    select: { university_id: true },
  });
  if (!uni) throw err("UNIVERSITY_NOT_FOUND", 404);
}

/**
 * ✅ resolve university code จาก university_id (สำหรับ theming/branding)
 */
async function resolveUniversityCode(universityId: number): Promise<string> {
  const uni = await prisma.university.findUnique({
    where: { university_id: universityId },
    select: { university_code: true },
  });
  return uni?.university_code ?? "DEFAULT";
}

const LOCK_HOME_ONLY_ROLES = new Set([
  "RECTOR",
  "HEAD_CONSULTANT",
  "ADMIN",
]);

export async function requireTenant(request: NextRequest): Promise<TenantContext> {
  const account = await getAccountFromRequest(request);
  if (!account) throw err("UNAUTHORIZED", 401);

  const accountId = Number(account.accountId);
  const role = String(account.role || "").toUpperCase();

  const allowed = Array.isArray(account.allowedUniversityIds)
    ? account.allowedUniversityIds
    : [];

  const home =
    typeof account.homeUniversityId === "number" ? account.homeUniversityId : null;

  // =========================
  // 1) SUPER_ADMIN  (✅ platform scope)
  // =========================
  if (role === "SUPER_ADMIN") {
    let active: number | null = null;

    // priority:
    // 1) x-university-id header (สำหรับ switch มหาลัย)
    // 2) account.activeUniversityId (จาก JWT)
    // 3) home
    // 4) allowed[0] (ถ้ามี)
    // 5) fallback: first university in DB
    const headerUni = request.headers.get("x-university-id");
    const headerUniId = headerUni ? Number(headerUni) : NaN;
    if (Number.isFinite(headerUniId) && headerUniId > 0) {
      active = headerUniId;
    } else if (typeof account.activeUniversityId === "number" && account.activeUniversityId > 0) {
      active = account.activeUniversityId;
    } else if (home) {
      active = home;
    } else if (allowed[0]) {
      active = allowed[0];
    } else {
      const firstUni = await prisma.university.findFirst({
        orderBy: { university_id: "asc" },
        select: { university_id: true },
      });
      active = firstUni?.university_id ?? null;
    }

    if (!active || !Number.isFinite(active)) throw err("NO_UNIVERSITY_CONTEXT", 400);

    await assertUniversityExists(active);

    if (allowed.length > 0 && !allowed.includes(active)) {
      throw err("UNIVERSITY_NOT_ALLOWED", 403);
    }

    const tenantCode = await resolveUniversityCode(active);

    return {
      accountId,
      role,
      universityId: active,
      account,
      activeUniversityId: active,
      tenantCode,
    };
  }

  // =========================
  // 2) LOCK HOME roles (RECTOR, HEAD_CONSULTANT, ADMIN)
  // =========================
  if (LOCK_HOME_ONLY_ROLES.has(role)) {
    if (!home) throw err("NO_HOME_UNIVERSITY", 403);
    if (allowed.length && !allowed.includes(home)) throw err("UNIVERSITY_NOT_ALLOWED", 403);

    const tenantCode = await resolveUniversityCode(home);

    return {
      accountId,
      role,
      universityId: home,
      account,
      activeUniversityId: home,
      tenantCode,
    };
  }

  // =========================
  // 2.5) GLOBAL roles (MINISTRY, DEAN) - bypass university permission check
  // =========================
  const GLOBAL_ROLES = new Set(["MINISTRY", "DEAN"]);
  if (GLOBAL_ROLES.has(role)) {
    const active =
      (account.activeUniversityId && Number.isFinite(account.activeUniversityId)
        ? account.activeUniversityId
        : null) ??
      home ??
      allowed[0] ??
      null;

    if (active && Number.isFinite(active)) {
      await assertUniversityExists(active);
    }

    const tenantCode = active ? await resolveUniversityCode(active) : "DEFAULT";

    return {
      accountId,
      role,
      universityId: active ?? 0, // 0 = global scope
      account,
      activeUniversityId: active ?? 0,
      tenantCode,
    };
  }

  // =========================
  // 3) other roles (STUDENT, CONSULTANT, etc.)
  // =========================
  if (!allowed.length) throw err("NO_ALLOWED_UNIVERSITIES", 403);

  const active =
    account.activeUniversityId ??
    home ??
    allowed[0] ??
    null;

  if (!active || !Number.isFinite(active)) throw err("NO_UNIVERSITY_CONTEXT", 400);
  if (!allowed.includes(active)) throw err("UNIVERSITY_NOT_ALLOWED", 403);

  const tenantCode = await resolveUniversityCode(active);

  return {
    accountId,
    role,
    universityId: active,
    account,
    activeUniversityId: active,
    tenantCode,
  };
}

/** เช็ค role แบบง่าย ๆ (ถ้าไม่ผ่าน -> 403) */
export function assertRole(role: string, allow: readonly string[]) {
  if (!allow.includes(role)) throw err("FORBIDDEN_ROLE", 403);
}
