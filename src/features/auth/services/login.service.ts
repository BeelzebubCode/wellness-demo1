import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateToken, verifyPassword } from "@/lib/auth/jwt";

/* =========================================================
  Tenant Helpers
========================================================= */
function parseHost(req: NextRequest) {
  const hostHeader = req.headers.get("host") || ""; // nu.wellness.local:3000
  const host = hostHeader.split(":")[0].toLowerCase();
  const parts = host.split(".");
  const hasSubdomain = parts.length >= 3;
  const subdomain = hasSubdomain ? parts[0] : null; // nu/kku/cu
  const baseDomain = hasSubdomain ? parts.slice(1).join(".") : host; // wellness.local
  return { hostHeader, host, subdomain, baseDomain };
}

function isLocalHostLike(domain: string) {
  return (
    domain === "localhost" ||
    domain === "127.0.0.1" ||
    domain.endsWith(".localhost")
  );
}

function normalizeRootDomain(baseDomain: string) {
  const d = String(baseDomain || "").toLowerCase().trim();
  // remove any port if somehow included
  return d.split(":")[0];
}

function cookieDomainFor(rootDomain: string) {
  const d = normalizeRootDomain(rootDomain);
  if (!d || isLocalHostLike(d)) return undefined;
  return `.${d}`; // .wellness.local
}

/* =========================================================
  Service Logic
========================================================= */

export async function handleLogin(request: NextRequest) {
  try {
    const { subdomain, baseDomain, hostHeader } = parseHost(request);

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

    /* =========================================================
      ✅ Cookie domain computed once (ใช้ทั้งกรณี super และปกติ)
    ========================================================= */
    const rootDomain = normalizeRootDomain(process.env.ROOT_DOMAIN || baseDomain);
    const cookieDomain = cookieDomainFor(rootDomain);

    // 1) tenant from subdomain (optional)
    const requestedUni = subdomain
      ? await prisma.university.findUnique({
          where: { university_code: subdomain.toUpperCase() },
          select: { university_id: true, university_code: true },
        })
      : null;

    // 2) load account + role entities + accesses
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

        universityAccesses: {
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
      .catch(() => {});

    console.log(`[LOGIN_DEBUG] Login success step 1: ${username} (role=${account.account_role})`);
    
    /* =========================================================
      ✅ SUPER_ADMIN / MINISTRY: platform-level (ไม่ต้องผูกมหาลัย)
      - login ได้ที่ wellness.local (ไม่มี subdomain)
      - activeUniversityId = null
      - allowedUniversityIds = []
      - tenant_code = PLATFORM
    ========================================================= */
    if (account.account_role === "SUPER_ADMIN" || account.account_role === "MINISTRY") {
      const token = await generateToken({
        accountId: account.account_id,
        username: account.account_username,
        role: account.account_role,
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
          suggestedSubdomain: null,
        },
        tenants: [],
        account: {
          id: account.account_id,
          username: account.account_username,
          name: account.account_username,
          role: account.account_role,
          consultantId: null,
          studentId: null,
          homeUniversityId: account.account_home_university_id ?? null,
          allowedUniversityIds: [],
          activeUniversityId: null,
        },
      });

      // debug header
      if (process.env.NODE_ENV !== "production") {
        res.headers.set(
          "x-auth-debug",
          JSON.stringify({
            hostHeader,
            baseDomain,
            rootDomain,
            cookieDomain: cookieDomain ?? null,
            superAdmin: true,
          })
        );
      }

      // auth_token (httpOnly)
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

      // tenant_code (readable by client)
      res.cookies.set({
        name: "tenant_code",
        value: "PLATFORM",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });

      return res;
    }

    /* =========================================================
      ✅ Normal flow (ต้องมีสิทธิ์ผูกมหาลัย)
    ========================================================= */

    // 3) resolve memberships
    const consultantId = account.consultant?.consultant_id ?? null;
    const studentId = account.student?.student_id ?? null;

    const homeUniversityId = account.account_home_university_id ?? null;
    const studentUniId = account.student?.university_id ?? null;
    const consultantUniId = account.consultant?.university_id ?? null;

    let allowedUniversityIds: number[] = [];
    try {
      const grantedUniversityIds = account.universityAccesses.map((x) => x.university_id);
      
      allowedUniversityIds = Array.from(
        new Set(
          [
            ...(homeUniversityId ? [homeUniversityId] : []),
            ...(studentUniId ? [studentUniId] : []),
            ...(consultantUniId ? [consultantUniId] : []),
            ...grantedUniversityIds,
          ].filter(Boolean)
        )
      ).sort((a, b) => a - b);
      
      console.log(`[LOGIN_DEBUG] Allowed IDs resolved: ${JSON.stringify(allowedUniversityIds)}`);
    } catch (err) {
      console.error("[LOGIN_DEBUG] Error resolving allowedUniversityIds:", err);
      throw err;
    }

    if (!allowedUniversityIds.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "บัญชีนี้ไม่มีสิทธิ์ผูกกับมหาวิทยาลัยใดเลย (home_university / entity / universityAccesses ว่าง)",
        },
        { status: 403 }
      );
    }

    // 4) domain lock: if login from uni subdomain -> must have access
    if (requestedUni) {
      if (!allowedUniversityIds.includes(requestedUni.university_id)) {
        console.log(`[LOGIN_DEBUG] Domain mismatched: requested ${requestedUni.university_id} but allowed ${JSON.stringify(allowedUniversityIds)}`);
        return NextResponse.json(
          {
            success: false,
            error:
              "บัญชีไม่มีสิทธิ์ในมหาวิทยาลัยของโดเมนนี้ (ตรวจสอบ home_university / entity / universityAccesses)",
          },
          { status: 403 }
        );
      }
    }

    // 5) choose active university
    const role = account.account_role;

    const roleDefaultUniId =
      role === "STUDENT"
        ? studentUniId
        : role === "CONSULTANT" || role === "HEAD_CONSULTANT"
          ? consultantUniId
          : null;

    const canUsePreferred =
      preferredUniversityId !== null && allowedUniversityIds.includes(preferredUniversityId);

    const activeUniId =
      requestedUni?.university_id ??
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

    // 6) issue token
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

    console.log(`[LOGIN_DEBUG] Token generated for ${username}`);

    // 7) display name
    let displayName = account.account_username;
    if (account.consultant?.profile) {
      displayName = `${account.consultant.profile.consultant_first_name} ${account.consultant.profile.consultant_last_name}`;
    }

    // 8) tenants list
    const tenants = await prisma.university.findMany({
      where: { university_id: { in: allowedUniversityIds } },
      select: { university_id: true, university_code: true },
      orderBy: { university_id: "asc" },
    });

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

    // debug header
    if (process.env.NODE_ENV !== "production") {
      res.headers.set(
        "x-auth-debug",
        JSON.stringify({
          hostHeader,
          baseDomain,
          rootDomain,
          cookieDomain: cookieDomain ?? null,
        })
      );
    }

    // auth_token (httpOnly)
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

    const tenantCode =
      requestedUni?.university_code?.toUpperCase() ??
      activeUni?.university_code?.toUpperCase() ??
      "DEFAULT";

    // tenant_code (readable by client)
    res.cookies.set({
      name: "tenant_code",
      value: tenantCode,
      httpOnly: false,
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
