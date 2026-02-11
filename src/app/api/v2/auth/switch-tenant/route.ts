import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { generateToken } from "@/lib/auth/jwt";

function isLocalHostLike(domain: string) {
  return (
    domain === "localhost" ||
    domain === "127.0.0.1" ||
    domain.endsWith(".localhost")
  );
}

function normalizeRootDomain(baseDomain: string) {
  const d = String(baseDomain || "").toLowerCase().trim();
  // remove any port if somehow included
  return d.split(":")[0];
}

function cookieDomainFor(rootDomain: string) {
  const d = normalizeRootDomain(rootDomain);
  if (!d || isLocalHostLike(d)) return undefined;
  return `.${d}`; // .wellness.local
}

function getBaseDomain(req: NextRequest) {
  const hostHeader = req.headers.get("host") || "";
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  return parts.length >= 3 ? parts.slice(1).join(".") : host;
}

export async function POST(req: NextRequest) {
  const ctx = await getAccountFromRequest(req);
  if (!ctx) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const universityId = Number(body?.universityId);
  if (!Number.isFinite(universityId)) {
    return NextResponse.json({ success: false, error: "Invalid universityId" }, { status: 400 });
  }
  if (!ctx.allowedUniversityIds.includes(universityId)) {
    return NextResponse.json({ success: false, error: "Forbidden: university" }, { status: 403 });
  }

  const token = await generateToken({
    accountId: ctx.accountId,
    username: ctx.username,
    role: ctx.role,
    consultantId: ctx.consultantId,
    studentId: ctx.studentId,
    homeUniversityId: ctx.homeUniversityId,
    activeUniversityId: universityId,
    allowedUniversityIds: ctx.allowedUniversityIds,
  });

  const baseDomain = getBaseDomain(req);
  const rootDomain = normalizeRootDomain(process.env.ROOT_DOMAIN || baseDomain);
  const cookieDomain = cookieDomainFor(rootDomain);

  const res = NextResponse.json({ success: true, activeUniversityId: universityId });
  res.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return res;
}
