// src/app/api/v2/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true }, { status: 200 });

  // ✅ ลบ auth_token
  res.cookies.set({
    name: "auth_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  // ✅ ลบ tenant_code
  res.cookies.set({
    name: "tenant_code",
    value: "",
    httpOnly: false,
    expires: new Date(0),
    path: "/",
  });

  // ✅ ลบ admin_token
  res.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  // Fallback: กวาดล้างด้วย Set-Cookie headers (กัน cookie ค้าง)
  res.headers.append(
    "Set-Cookie",
    `auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
  );
  res.headers.append(
    "Set-Cookie",
    `tenant_code=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
  );

  return res;
}
