// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tenantFromHost, getSharedCookieDomain } from "@/config/tenant-domains";
import { verifyToken } from "@/lib/auth/token";

// ✅ Public paths that do not require authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/help",
  "/help/ai",
  "/login",
  "/booking",
]);

// ✅ Helper to check if path starts with public prefix
function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Check prefixes
  if (pathname.startsWith("/pr")) return true;
  if (pathname.startsWith("/liff")) return true;
  if (pathname.startsWith("/api")) return true; // Optional: Allow API to handle its own auth or block it here? Use caution.
  // Actually, usually APIs have their own 401 response which is better than redirecting to HTML page.
  // Let's allow API to pass through, assuming they are protected by their own logic/headers.
  // If we redirect API calls to "/", it breaks clients.
  return false;
}

export async function middleware(req: NextRequest) {
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

  // ✅ cookie ไว้ debug/ฝั่ง client ใช้ได้ (ใช้ shared domain เพื่อไม่ให้ clash)
  const cookieDomain = getSharedCookieDomain(host);
  res.cookies.set("tenant_code", tenant, { 
    path: "/", 
    sameSite: "lax",
    ...(cookieDomain ? { domain: cookieDomain } : {})
  });

  // ===== admin guard (ของเดิม) =====
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) return res;
    
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return res;
  }

  // ===== User/Student Guard =====
  // 1. If public path -> allow
  if (isPublicPath(pathname)) {
    return res;
  }

  // 2. Check for user token
  const token = req.cookies.get("auth_token")?.value;
  let isValid = false;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) isValid = true;
  }

  if (!isValid) {
    // Redirect to landing page (public)
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icons|images|assets).*)"],
};
