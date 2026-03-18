import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, verifyPassword } from "@/lib/auth/jwt";
import { verifyToken } from "@/lib/auth/token";

/* =========================================================
  Service Logic — ไม่ต้องดู domain/subdomain อีกต่อไป
  ใช้ account_home_university_id เป็นหลัก
========================================================= */

export async function handleLogin(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();
    const preferredUniversityIdRaw = body?.preferredUniversityId;

    const preferredUniversityId =
      preferredUniversityIdRaw === null || preferredUniversityIdRaw === undefined
        ? null
        : Number(preferredUniversityIdRaw);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    if (preferredUniversityId !== null && !Number.isFinite(preferredUniversityId)) {
      return NextResponse.json(
        { success: false, error: "preferredUniversityId ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // load account + role entities + accesses
    const account = await prisma.account.findUnique({
      where: { account_username: username },
      select: {
        account_id: true,
        account_username: true,
        account_password: true,
        account_home_university_id: true,
        roleCategory: { select: { code: true, name_th: true } },

        consultant: {
          select: {
            consultant_id: true,
            university_id: true,
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
            university_id: true,
          },
        },

        accessPermissions: {
          where: { access_revoked_at: null },
          select: { university_id: true },
          orderBy: { university_id: "asc" },
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

    // update last login (fire and forget)
    prisma.account
      .update({
        where: { account_id: account.account_id },
        data: { account_last_login_at: new Date() },
      })
      .catch(() => { });

    console.log(`[LOGIN] Success: ${username} (role=${account.roleCategory.code})`);

    /* =========================================================
      ✅ SUPER_ADMIN / MINISTRY: platform-level (ไม่ผูกมหาลัย)
      activeUniversityId = null
    ========================================================= */
    const role = account.roleCategory.code;

    if (role === "SUPER_ADMIN" || role === "MINISTRY") {
      const token = await generateToken({
        accountId: account.account_id,
        username: account.account_username,
        role: role,
        homeUniversityId: account.account_home_university_id ?? undefined,
        activeUniversityId: undefined,
        allowedUniversityIds: [],
      });

      const res = NextResponse.json({
        success: true,
        token,
        tenant: {
          universityId: null,
          universityCode: "PLATFORM",
        },
        tenants: [],
        account: {
          id: account.account_id,
          username: account.account_username,
          name: account.account_username,
          role: role,
          consultantId: null,
          studentId: null,
          homeUniversityId: account.account_home_university_id ?? null,
          allowedUniversityIds: [],
          activeUniversityId: null,
        },
      });

      // auth_token (httpOnly, host-only — ไม่ต้องตั้ง domain)
      res.cookies.set({
        name: "auth_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      // tenant_code (readable by client — for theming)
      res.cookies.set({
        name: "tenant_code",
        value: "PLATFORM",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return res;
    }

    /* =========================================================
      ✅ Normal flow — ทุก role อื่น ใช้ account_home_university_id
    ========================================================= */

    // resolve memberships
    const consultantId = account.consultant?.consultant_id ?? null;
    const studentId = account.student?.student_id ?? null;

    const homeUniversityId = account.account_home_university_id ?? null;
    const studentUniId = account.student?.university_id ?? null;
    const consultantUniId = account.consultant?.university_id ?? null;

    const grantedUniversityIds = account.accessPermissions.map((x) => x.university_id);

    const allowedUniversityIds = Array.from(
      new Set(
        [
          ...(homeUniversityId ? [homeUniversityId] : []),
          ...(studentUniId ? [studentUniId] : []),
          ...(consultantUniId ? [consultantUniId] : []),
          ...grantedUniversityIds,
        ].filter(Boolean)
      )
    ).sort((a, b) => a - b);

    if (!allowedUniversityIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "บัญชีนี้ไม่มีสิทธิ์ผูกกับมหาวิทยาลัยใดเลย",
        },
        { status: 403 }
      );
    }

    // ✅ choose active university (ไม่ต้องดูจาก domain)
    // role already set from roleCategory.code above for SUPER_ADMIN/MINISTRY
    // For other roles, use the same value
    // (role is set at line ~107 for platform roles, need to re-set here for normal flow)

    const roleDefaultUniId =
      role === "STUDENT"
        ? studentUniId
        : role === "CONSULTANT" || role === "HEAD_CONSULTANT"
          ? consultantUniId
          : null;

    const canUsePreferred =
      preferredUniversityId !== null && allowedUniversityIds.includes(preferredUniversityId);

    const activeUniId =
      (canUsePreferred ? preferredUniversityId : null) ??
      roleDefaultUniId ??
      homeUniversityId ??
      allowedUniversityIds[0] ??
      null;

    const activeUni =
      activeUniId !== null
        ? await prisma.university.findUnique({
          where: { university_id: activeUniId },
          select: { university_id: true, university_code: true },
        })
        : null;

    // issue token
    const token = await generateToken({
      accountId: account.account_id,
      username: account.account_username,
      role: role,
      consultantId: consultantId ?? undefined,
      studentId: studentId ?? undefined,
      homeUniversityId: homeUniversityId ?? undefined,
      activeUniversityId: activeUniId ?? undefined,
      allowedUniversityIds: allowedUniversityIds,
    });

    // display name
    let displayName = account.account_username;
    if (account.consultant?.profile) {
      displayName = `${account.consultant.profile.consultant_first_name} ${account.consultant.profile.consultant_last_name}`;
    }

    // tenants list
    const tenants = await prisma.university.findMany({
      where: { university_id: { in: allowedUniversityIds } },
      select: { university_id: true, university_code: true },
      orderBy: { university_id: "asc" },
    });

    const tenantCode = activeUni?.university_code?.toUpperCase() ?? "DEFAULT";

    const res = NextResponse.json({
      success: true,
      token,
      tenant: {
        universityId: activeUni?.university_id ?? null,
        universityCode: tenantCode,
      },
      tenants: tenants.map((t) => ({
        universityId: t.university_id,
        code: t.university_code,
      })),
      account: {
        id: account.account_id,
        username: account.account_username,
        name: displayName,
        role: role,
        consultantId,
        studentId,
        homeUniversityId,
        allowedUniversityIds,
        activeUniversityId: activeUniId,
      },
    });

    // auth_token (httpOnly, host-only)
    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // tenant_code (for theming)
    res.cookies.set({
      name: "tenant_code",
      value: tenantCode,
      httpOnly: false,
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
      { status: 500 }
    );
  }
}
