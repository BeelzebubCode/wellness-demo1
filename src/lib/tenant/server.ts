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
  // 1) SUPER_ADMIN
  // =========================
  if (role === "SUPER_ADMIN") {
    if (!allowed.length) throw err("NO_ALLOWED_UNIVERSITIES", 403);

    let active =
      account.activeUniversityId ??
      home ??
      allowed[0] ??
      null;

    if (requestedUniversityId !== null && allowed.includes(requestedUniversityId)) {
      active = requestedUniversityId;
    }

    const headerUni = request.headers.get("x-university-id");
    const headerUniId = headerUni ? Number(headerUni) : NaN;
    if (Number.isFinite(headerUniId) && headerUniId > 0) {
      if (!allowed.includes(headerUniId)) throw err("UNIVERSITY_NOT_ALLOWED", 403);
      active = headerUniId;
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
