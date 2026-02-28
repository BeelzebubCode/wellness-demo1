// src/app/api/v2/auth/switch-tenant/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAccountFromRequest } from "@/lib/auth/context";
import { generateToken } from "@/lib/auth/jwt";

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

  const res = NextResponse.json({ success: true, activeUniversityId: universityId });

  // ✅ host-only cookie (ไม่ต้อง domain)
  res.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
