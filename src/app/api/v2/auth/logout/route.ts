// src/app/api/v2/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

function parseHost(req: NextRequest) {
  const hostHeader = req.headers.get("host") || ""; // nu.wellness.local:3000
  const host = hostHeader.split(":")[0].toLowerCase();
  const port = hostHeader.includes(":") ? hostHeader.split(":")[1] : "";
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const baseDomain = hasSubdomain ? parts.slice(1).join(".") : host; // wellness.local
  return { hostHeader, host, port, baseDomain };
}

function cookieDomainFor(baseDomain: string) {
  // ใช้ domain เฉพาะกรณีที่เป็นโดเมนจริง ไม่ใช่ localhost/127.0.0.1
  if (
    baseDomain === "localhost" ||
    baseDomain === "127.0.0.1" ||
    baseDomain.endsWith(".localhost")
  ) {
    return undefined;
  }
  return `.${baseDomain}`; // .wellness.local
}

export async function POST(request: NextRequest) {
  const { baseDomain } = parseHost(request);
  const cookieDomain = cookieDomainFor(baseDomain);

  const res = NextResponse.json(
    { success: true },
    {
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );

  res.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  if (cookieDomain) {
    res.cookies.set({
      name: "auth_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      domain: cookieDomain,
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return res;
}
