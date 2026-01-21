// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tenantFromHost } from "@/config/tenant-domains";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ===== 1) resolve tenant จาก domain =====
  const host = req.headers.get("host") || "";
  const tenant = tenantFromHost(host);

  // ✅ IMPORTANT: set ให้ "request headers" เพื่อให้ layout.tsx เห็น
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant", tenant);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ✅ cookie ไว้ debug/ฝั่ง client ใช้ได้
  res.cookies.set("tenant_code", tenant, { path: "/", sameSite: "lax" });

  // ===== admin guard (ของเดิม) =====
  if (pathname.startsWith("/admin/login")) return res;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icons|images|assets).*)"],
};
