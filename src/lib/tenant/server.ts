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

/* ============================================
  Host/Subdomain helpers
============================================ */
function parseHost(req: NextRequest) {
  const hostHeader = req.headers.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const subdomain = hasSubdomain ? parts[0] : null;
  return { hostHeader, host, subdomain };
}

function normalizeTenantCode(s: unknown): string | null {
  const v = String(s ?? "").trim();
  if (!v) return null;
  return v.toUpperCase();
}

/**
 * resolve requested university by:
 * 1) subdomain (nu/kku/cu)
 * 2) tenant_code cookie
 */
async function resolveRequestedUniversity(req: NextRequest) {
  const { subdomain } = parseHost(req);
  const fromSub = subdomain ? normalizeTenantCode(subdomain) : null;
  const fromCookie = normalizeTenantCode(req.cookies.get("tenant_code")?.value);

  const code = fromSub || fromCookie;
  if (!code) return null;

  const uni = await prisma.university.findUnique({
    where: { university_code: code },
    select: { university_id: true, university_code: true },
  });

  return uni
    ? { universityId: uni.university_id, universityCode: uni.university_code }
    : null;
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

  // requested tenant from domain/cookie (optional)
  const requested = await resolveRequestedUniversity(request);
  const requestedUniversityId = requested?.universityId ?? null;
  const tenantCode = requested?.universityCode ?? "DEFAULT";

  // =========================
  // 1) SUPER_ADMIN  (✅ platform scope)
  // =========================
  if (role === "SUPER_ADMIN") {
    // ✅ SUPER_ADMIN ไม่ต้องมี allowed เลย
    // (เก็บ allowed ไว้เฉย ๆ เผื่ออนาคตอยากใช้เป็น whitelist)

    // priority:
    // 1) x-university-id header
    // 2) requestedUniversityId (subdomain/cookie)
    // 3) account.activeUniversityId
    // 4) home
    // 5) allowed[0] (ถ้ามี)
    // 6) fallback: first university in DB
    let active: number | null = null;

    const headerUni = request.headers.get("x-university-id");
    const headerUniId = headerUni ? Number(headerUni) : NaN;
    if (Number.isFinite(headerUniId) && headerUniId > 0) {
      active = headerUniId;
    } else if (requestedUniversityId !== null) {
      active = requestedUniversityId;
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

    // ✅ validate ว่ามีจริง (และจะได้ไม่พังทีหลัง)
    await assertUniversityExists(active);

    // ✅ ถ้าคุณ “ยังอยาก” บังคับ whitelist เฉพาะกรณีมี allowed
    // - ถ้า allowed ว่าง => ALL
    // - ถ้ามี allowed => ต้องอยู่ใน allowed
    if (allowed.length > 0 && !allowed.includes(active)) {
      throw err("UNIVERSITY_NOT_ALLOWED", 403);
    }

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
  // 2) LOCK HOME roles
  // =========================
  if (LOCK_HOME_ONLY_ROLES.has(role)) {
    if (!home) throw err("NO_HOME_UNIVERSITY", 403);
    if (allowed.length && !allowed.includes(home)) throw err("UNIVERSITY_NOT_ALLOWED", 403);

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
    // These roles can operate without a specific university_access record.
    // Ministry = all universities; Dean = their home faculty/university.
    const active =
      requestedUniversityId ??
      (account.activeUniversityId && Number.isFinite(account.activeUniversityId)
        ? account.activeUniversityId
        : null) ??
      home ??
      allowed[0] ??
      null;

    // For MINISTRY, it's okay to have no specific university (null = all universities)
    if (active && Number.isFinite(active)) {
      await assertUniversityExists(active);
    }

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
  // 3) other roles
  // =========================
  if (!allowed.length) throw err("NO_ALLOWED_UNIVERSITIES", 403);

  let active =
    account.activeUniversityId ??
    home ??
    allowed[0] ??
    null;

  if (requestedUniversityId !== null && allowed.includes(requestedUniversityId)) {
    active = requestedUniversityId;
  }

  if (!active || !Number.isFinite(active)) throw err("NO_UNIVERSITY_CONTEXT", 400);
  if (!allowed.includes(active)) throw err("UNIVERSITY_NOT_ALLOWED", 403);

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
