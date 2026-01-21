// src/app/api/v2/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, verifyPassword } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = body?.username;
    const password = body?.password;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 },
      );
    }

    const account = await prisma.account.findUnique({
      where: { account_username: username },
      select: {
        account_id: true,
        account_username: true,
        account_password: true,
        account_role: true,
        account_home_university_id: true,

        consultant: {
          select: {
            consultant_id: true,
            profile: {
              select: {
                consultant_first_name: true,
                consultant_last_name: true,
              },
            },
          },
        },

        // ✅ ชื่อ relation ที่ถูกต้องตาม schema
        universityAccesses: {
          select: { university_id: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(password, account.account_password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 },
      );
    }

    prisma.account
      .update({
        where: { account_id: account.account_id },
        data: { account_last_login_at: new Date() },
      })
      .catch(() => {});

    const consultantId = account.consultant?.consultant_id ?? null;

    const grantedUniversityIds = account.universityAccesses.map(
      (x) => x.university_id,
    );

    const allowedUniversityIds = Array.from(
      new Set([
        ...(account.account_home_university_id
          ? [account.account_home_university_id]
          : []),
        ...grantedUniversityIds,
      ]),
    );

    const token = await generateToken({
      accountId: account.account_id,
      username: account.account_username,
      role: account.account_role,
      consultantId: consultantId ?? undefined,
      homeUniversityId: account.account_home_university_id ?? undefined,
      allowedUniversityIds: allowedUniversityIds.length
        ? allowedUniversityIds
        : undefined,
    });

    let displayName = account.account_username;
    if (account.consultant?.profile) {
      displayName = `${account.consultant.profile.consultant_first_name} ${account.consultant.profile.consultant_last_name}`;
    }

    const res = NextResponse.json({
      success: true,
      token,
      account: {
        id: account.account_id,
        username: account.account_username,
        name: displayName,
        role: account.account_role,
        consultantId,
        homeUniversityId: account.account_home_university_id ?? null,
        allowedUniversityIds,
      },
    });

    // ✅ cookie: httpOnly + secure + sameSite
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
  } catch (e) {
    console.error("[LOGIN_API_ERROR]", e);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 },
    );
  }
}
