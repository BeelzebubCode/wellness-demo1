// src/app/api/v2/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || ""; // wellness.local

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

export async function POST(_req: NextRequest) {
  const res = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store, must-revalidate", Pragma: "no-cache" } }
  );

  // host-only (กันของเก่าค้าง)
  clearCookie(res, "auth_token", undefined, true);
  clearCookie(res, "tenant_code", undefined, false);

  // shared domain (.wellness.local)
  if (ROOT_DOMAIN) {
    const cookieDomain = `.${ROOT_DOMAIN}`;
    clearCookie(res, "auth_token", cookieDomain, true);
    clearCookie(res, "tenant_code", cookieDomain, false);
  }

  return res;
}
