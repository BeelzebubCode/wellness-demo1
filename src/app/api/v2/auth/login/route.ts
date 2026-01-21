// src/app/api/v2/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, verifyPassword } from "@/lib/jwt";

function parseHost(req: NextRequest) {
  const hostHeader = req.headers.get("host") || ""; // nu.wellness.local:3000
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const subdomain = hasSubdomain ? parts[0] : null; // nu/kku/cu
  const baseDomain = hasSubdomain ? parts.slice(1).join(".") : host; // wellness.local
  return { hostHeader, host, subdomain, baseDomain };
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

export async function POST(request: NextRequest) {
  try {
    const { subdomain, baseDomain } = parseHost(request);

    const body = await request.json().catch(() => null);
    const username = body?.username;
    const password = body?.password;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ✅ ถ้ามี subdomain → map ไปมหาลัยจาก university_code
    const requestedUni = subdomain
      ? await prisma.university.findUnique({
          where: { university_code: subdomain.toUpperCase() },
          select: { university_id: true, university_code: true },
        })
      : null;

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
            university_id: true, // ✅ เอามาใช้เลือก tenant แบบชัวร์
            profile: {
              select: {
                consultant_first_name: true,
                consultant_last_name: true,
              },
            },
          },
        },

        student: {
          select: {
            student_id: true,
            university_id: true, // ✅ เอามาใช้เลือก tenant แบบชัวร์
          },
        },

        universityAccesses: {
          where: { access_revoked_at: null },
          select: { university_id: true },
          orderBy: { university_id: "asc" }, // ✅ ให้ลำดับเสถียร
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, account.account_password);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    prisma.account
      .update({
        where: { account_id: account.account_id },
        data: { account_last_login_at: new Date() },
      })
      .catch(() => {});

    const consultantId = account.consultant?.consultant_id ?? null;

    const grantedUniversityIds = account.universityAccesses.map((x) => x.university_id);

    // ✅ ทำ allowedUniversityIds ให้เสถียร (sort)
    const allowedUniversityIds = Array.from(
      new Set([
        ...(account.account_home_university_id ? [account.account_home_university_id] : []),
        ...grantedUniversityIds,
      ])
    ).sort((a, b) => a - b);

    // ✅ ถ้า login ผ่านโดเมนมหาลัย → ต้องมีสิทธิ์ในมหาลัยนั้น
    if (requestedUni) {
      const canUseThisDomain = allowedUniversityIds.includes(requestedUni.university_id);
      if (!canUseThisDomain) {
        return NextResponse.json(
          {
            success: false,
            error:
              "บัญชีไม่มีสิทธิ์ในมหาวิทยาลัยของโดเมนนี้ (ตรวจสอบ home_university หรือ universityAccesses)",
          },
          { status: 403 }
        );
      }
    }

    const homeUniversityId = account.account_home_university_id ?? null;

    // ✅ เลือก tenant แบบ deterministic ตาม role/entity จริง
    const studentUniId = account.student?.university_id ?? null;
    const consultantUniId = account.consultant?.university_id ?? null;

    const activeUniId =
      requestedUni?.university_id ??
      // ถ้าโดเมนกลาง ให้ใช้ entity จริงก่อน
      (account.account_role === "STUDENT" ? studentUniId : null) ??
      ((account.account_role === "CONSULTANT" || account.account_role === "HEAD_CONSULTANT")
        ? consultantUniId
        : null) ??
      homeUniversityId ??
      allowedUniversityIds[0] ??
      null;

    const activeUni = activeUniId
      ? await prisma.university.findUnique({
          where: { university_id: activeUniId },
          select: { university_id: true, university_code: true },
        })
      : null;

    const token = await generateToken({
      accountId: account.account_id,
      username: account.account_username,
      role: account.account_role,
      consultantId: consultantId ?? undefined,
      homeUniversityId: homeUniversityId ?? undefined,
      allowedUniversityIds: allowedUniversityIds.length ? allowedUniversityIds : undefined,
    });

    let displayName = account.account_username;
    if (account.consultant?.profile) {
      displayName = `${account.consultant.profile.consultant_first_name} ${account.consultant.profile.consultant_last_name}`;
    }

    const res = NextResponse.json({
      success: true,
      token,
      tenant: {
        universityId: activeUni?.university_id ?? null,
        universityCode: activeUni?.university_code ?? "DEFAULT",
        suggestedSubdomain: activeUni?.university_code
          ? activeUni.university_code.toLowerCase()
          : null,
      },
      account: {
        id: account.account_id,
        username: account.account_username,
        name: displayName,
        role: account.account_role,
        consultantId,
        homeUniversityId,
        allowedUniversityIds,
      },
    });

    const cookieDomain = cookieDomainFor(baseDomain);

    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    return res;
  } catch (e) {
    console.error("[LOGIN_API_ERROR]", e);
    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    );
  }
}
