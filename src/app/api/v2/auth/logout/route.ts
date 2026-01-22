// src/app/api/v2/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

/* =========================================================
  Tenant Helpers (เหมือน login)
========================================================= */
function parseHost(req: NextRequest) {
  const hostHeader = req.headers.get("host") || ""; // nu.wellness.local:3000
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const baseDomain = hasSubdomain ? parts.slice(1).join(".") : host; // wellness.local
  return { hostHeader, host, baseDomain };
}

function cookieDomainFor(baseDomain: string) {
  if (
    baseDomain === "localhost" ||
    baseDomain === "127.0.0.1" ||
    baseDomain.endsWith(".localhost")
  ) {
    return undefined;
  }
  return `.${baseDomain}`; // .wellness.local
}

function clearCookie(
  res: NextResponse,
  name: string,
  domain?: string,
  httpOnly = true
) {
  res.cookies.set({
    name,
    value: "",
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(domain ? { domain } : {}),
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function POST(req: NextRequest) {
  const { baseDomain } = parseHost(req);

  // ✅ ถ้ามี env ROOT_DOMAIN ให้ใช้เป็นหลัก (เหมาะกับ prod)
  // ✅ ถ้าไม่มี ให้ fallback เป็น baseDomain (เหมาะกับ dev ที่ wellness.local)
  const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || baseDomain).toLowerCase();
  const sharedDomain = cookieDomainFor(ROOT_DOMAIN); // ".wellness.local" หรือ undefined

  const res = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );

  // 1) ลบแบบ host-only (กันของเก่าค้าง)
  clearCookie(res, "auth_token", undefined, true);
  clearCookie(res, "tenant_code", undefined, false);

  // 2) ลบแบบ shared domain (สำคัญสุดสำหรับข้าม subdomain)
  if (sharedDomain) {
    clearCookie(res, "auth_token", sharedDomain, true);
    clearCookie(res, "tenant_code", sharedDomain, false);
  }

  return res;
}
