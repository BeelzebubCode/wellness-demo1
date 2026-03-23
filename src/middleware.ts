// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/token";

// ✅ Public paths that do not require authentication
const PUBLIC_PATHS = new Set([
  "/",
  "/about",
  "/help",
  "/help/ai",
  "/login",
  "/booking",
  "/docs",
]);

// ✅ Helper to check if path starts with public prefix
function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  // Check prefixes
  if (pathname.startsWith("/pr")) return true;
  if (pathname.startsWith("/liff")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/docs")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ ไม่ต้อง resolve tenant จาก domain อีกต่อไป — ใช้ account_home_university_id แทน
  const res = NextResponse.next();

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
