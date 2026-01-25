// src/app/api/v2/profile/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";
import type { ProfileMeDTO, ProfileType } from "@/shared/types/profile";

// helper
function joinName(first?: string | null, last?: string | null) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  const full = `${f} ${l}`.trim();
  return full || null;
}

function normalizeRole(role: any): ProfileType {
  const r = String(role || "").toUpperCase();
  if (
    r === "STUDENT" ||
    r === "CONSULTANT" ||
    r === "HEAD_CONSULTANT" ||
    r === "RECTOR" ||
    r === "SUPER_ADMIN"
  ) {
    return r as ProfileType;
  }
  // fallback เผื่อ role แปลกๆ
  return "STUDENT";
}

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);

    const role = normalizeRole(account.role);

    // base dto (fallback)
    let dto: ProfileMeDTO = {
      role,
      displayName: account.username ?? "ผู้ใช้งาน",
      profile: {
        type: role,
        universityId: activeUniversityId ?? null,
      },
    };

    // ==============================
    // STUDENT -> table student + student_profile
    // ==============================
    if (role === "STUDENT") {
      const s = await prisma.student.findFirst({
        where: {
          account_id: account.accountId,
          university_id: activeUniversityId,
        },
        select: {
          student_id: true,
          profile: {
            select: {
              student_prefix: true,
              student_first_name: true,
              student_last_name: true,
              student_nickname: true,
              student_email: true,
              student_phone_number: true,
            },
          },
        },
      });

      if (s) {
        const p = s.profile;
        const displayName =
          joinName(p?.student_first_name, p?.student_last_name) ??
          account.username ??
          "นิสิต";

        dto = {
          role,
          displayName,
          profile: {
            type: "STUDENT",
            id: s.student_id,
            prefix: p?.student_prefix ?? null,
            firstName: p?.student_first_name ?? null,
            lastName: p?.student_last_name ?? null,
            nickname: p?.student_nickname ?? null,
            email: p?.student_email ?? null,
            phone: p?.student_phone_number ?? null,
            universityId: activeUniversityId ?? null,
          },
        };
      }

      return NextResponse.json({ success: true, data: dto });
    }

    // ==============================
    // CONSULTANT / HEAD_CONSULTANT -> table consultant + consultant_profile + organization
    // ==============================
    if (role === "CONSULTANT" || role === "HEAD_CONSULTANT") {
      const c = await prisma.consultant.findFirst({
        where: {
          account_id: account.accountId,
          university_id: activeUniversityId,
        },
        select: {
          consultant_id: true,
          organization: {
            select: {
              // ✅ จาก error ของคุณ: organization_name_th ไม่มี -> ใช้ organization_name
              organization_name: true,
            },
          },
          profile: {
            select: {
              consultant_prefix: true,
              consultant_first_name: true,
              consultant_last_name: true,
              consultant_nickname: true,
              consultant_email: true,
              consultant_phone_number: true,
            },
          },
        },
      });

      if (c) {
        const p = c.profile;

        const displayName =
          joinName(p?.consultant_first_name, p?.consultant_last_name) ??
          account.username ??
          "ผู้ให้คำปรึกษา";

        dto = {
          role,
          displayName,
          profile: {
            type: "CONSULTANT", // ✅ โปรไฟล์ชนิด consultant (UI ใช้ง่าย)
            id: c.consultant_id,
            prefix: p?.consultant_prefix ?? null,
            firstName: p?.consultant_first_name ?? null,
            lastName: p?.consultant_last_name ?? null,
            nickname: p?.consultant_nickname ?? null,
            email: p?.consultant_email ?? null,
            phone: p?.consultant_phone_number ?? null,
            universityId: activeUniversityId ?? null,
            organizationName: c.organization?.organization_name ?? null,
          },
        };
      }

      return NextResponse.json({ success: true, data: dto });
    }

    // ==============================
    // RECTO R / SUPER_ADMIN (ยังไม่มี profile table ใน schema ที่ส่งมา)
    // -> ส่งขั้นต่ำก่อน (เอา username เป็นชื่อ)
    // ==============================
    if (role === "RECTOR" || role === "SUPER_ADMIN") {
      dto = {
        role,
        displayName: account.username ?? (role === "RECTOR" ? "ผู้บริหาร" : "ผู้ดูแลระบบ"),
        profile: {
          type: role,
          universityId: activeUniversityId ?? null,
        },
      };

      return NextResponse.json({ success: true, data: dto });
    }

    // fallback
    return NextResponse.json({ success: true, data: dto });
  } catch (e: any) {
    console.error("[GET /api/v2/profile/me]", {
      message: e?.message,
      code: e?.code,
      meta: e?.meta,
      stack: e?.stack,
      status: e?.status,
    });

    const status = e?.status ?? 500;
    const message =
      status === 401
        ? "Unauthorized"
        : status === 403
        ? "Permission denied"
        : e?.message ?? "Failed to load profile";

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
