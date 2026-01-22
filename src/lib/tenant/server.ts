// src/lib/tenant/server.ts
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAccountFromRequest } from "@/lib/auth/context";
import type { AccountContext } from "@/lib/auth/context";

export type TenantContext = {
  account: AccountContext;
  activeUniversityId: number;
  tenantCode: string; // เช่น NU / KKU / DEFAULT (เอาไว้ debug/ส่งต่อได้)
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
  const hostHeader = req.headers.get("host") || ""; // nu.wellness.local:3000
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const subdomain = hasSubdomain ? parts[0] : null; // nu/kku/cu
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

export async function requireTenant(request: NextRequest): Promise<TenantContext> {
  const account = await getAccountFromRequest(request);
  if (!account) throw err("UNAUTHORIZED", 401);

  const role = String(account.role || "").toUpperCase();

  const allowed = account.allowedUniversityIds ?? [];
  if (!allowed.length) throw err("NO_ALLOWED_UNIVERSITIES", 403);

  // 1) requested tenant from domain/cookie (optional)
  const requested = await resolveRequestedUniversity(request);
  const requestedUniversityId = requested?.universityId ?? null;
  const tenantCode = requested?.universityCode ?? "DEFAULT";

  // baseline
  let active =
    account.activeUniversityId ??
    account.homeUniversityId ??
    allowed[0] ??
    null;

  // 2) if request is on subdomain/cookie tenant -> must respect it (if allowed)
  if (
    requestedUniversityId !== null &&
    allowed.includes(requestedUniversityId)
  ) {
    active = requestedUniversityId;
  }

  // 3) header switching allowed for STAFF only
  const isStaff =
    role === "HEAD_CONSULTANT" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "RECTOR";

  if (isStaff) {
    const headerUni = request.headers.get("x-university-id");
    const headerUniId = headerUni ? Number(headerUni) : NaN;
    if (Number.isFinite(headerUniId) && headerUniId > 0) {
      if (!allowed.includes(headerUniId)) throw err("UNIVERSITY_NOT_ALLOWED", 403);
      active = headerUniId;
    }
  }

  if (!active || !Number.isFinite(active)) throw err("NO_UNIVERSITY_CONTEXT", 400);
  if (!allowed.includes(active)) throw err("UNIVERSITY_NOT_ALLOWED", 403);

  return { account, activeUniversityId: active, tenantCode };
}

/** เช็ค role แบบง่าย ๆ (ถ้าไม่ผ่าน -> 403) */
export function assertRole(role: string, allow: readonly string[]) {
  if (!allow.includes(role)) throw err("FORBIDDEN_ROLE", 403);
}
