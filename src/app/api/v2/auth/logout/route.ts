// src/app/api/v2/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSharedCookieDomain } from "@/config/tenant-domains";

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

export async function POST(req: NextRequest) {
  const hostHeader = req.headers.get("host") || "";
  const sharedDomain = getSharedCookieDomain(hostHeader); // ".wellness.local" หรือ undefined

  // 🔍 Debug logging
  console.log(`[LOGOUT_DEBUG] Host: ${hostHeader}`);
  console.log(`[LOGOUT_DEBUG] Shared Domain: ${sharedDomain || "undefined (host-only)"}`);

  const res = NextResponse.json(
    { success: true },
    { status: 200 }
  );

  // ✅ ลบ auth_token
  res.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  });
  console.log(`[LOGOUT_DEBUG] Cleared auth_token${sharedDomain ? ` (domain: ${sharedDomain})` : " (host-only)"}`);

  // ✅ ลบ tenant_code
  res.cookies.set({
    name: "tenant_code",
    value: "",
    httpOnly: false,
    expires: new Date(0),
    path: "/",
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  });
  console.log(`[LOGOUT_DEBUG] Cleared tenant_code${sharedDomain ? ` (domain: ${sharedDomain})` : " (host-only)"}`);

  // ✅ ลบ admin_token
  res.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    ...(sharedDomain ? { domain: sharedDomain } : {}),
  });
  console.log(`[LOGOUT_DEBUG] Cleared admin_token${sharedDomain ? ` (domain: ${sharedDomain})` : " (host-only)"}`);

  // ✅ Multi-domain fallback: กวาดล้างกรณีมีคุกกี้ที่ไม่มี domain ติดมา (clash)
  // ⚠️ ต้องใช้ append() ไม่ใช่ set() เพราะ set() จะเขียนทับ cookies ที่ตั้งไว้ก่อนหน้า!
  res.headers.append(
    "Set-Cookie",
    `auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
  );
  res.headers.append(
    "Set-Cookie",
    `tenant_code=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  );
  
  // ถ้ามี shared domain ให้ลบแบบมี domain ด้วย (เผื่อมี cookie ซ้ำ)
  if (sharedDomain) {
    res.headers.append(
      "Set-Cookie",
      `auth_token=; Domain=${sharedDomain}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
    );
    res.headers.append(
      "Set-Cookie",
      `tenant_code=; Domain=${sharedDomain}; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    );
  }
  
  console.log(`[LOGOUT_DEBUG] Added Set-Cookie headers for host-only${sharedDomain ? ' and domain' : ''} fallback`);

  return res;
}

