// src/app/api/v2/profile/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server";

type ProfileType =
  | "STUDENT"
  | "CONSULTANT"
  | "HEAD_CONSULTANT"
  | "RECTOR"
  | "SUPER_ADMIN";

export type ProfileMeDTO = {
  role: ProfileType;
  displayName: string;
  activeUniversityId: number;
  profile: {
    type: ProfileType;
    id?: number | null;

    // common
    prefix?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    nickname?: string | null;
    email?: string | null;
    phone?: string | null;

    universityId?: number | null;
    universityCode?: string | null;
    universityName?: string | null;

    // consultant
    organizationName?: string | null;
    languages?: { code: string; fluencyLevel?: string | null }[];
    specializations?: string[];

    // student extras
    gender?: string | null;
    birthday?: string | null; // ISO
    bloodGroup?: string | null;
    nationality?: string | null;
    religion?: string | null;

    // academic
    program?: string | null;
    degree?: string | null;
    degreeName?: string | null;
    admitAcademicYear?: number | null;

    facultyName?: string | null;
    facultyNameEn?: string | null;

    departmentName?: string | null;
    departmentNameEn?: string | null;

    advisorName?: string | null;

    // addresses
    addresses?: {
      type: "CURRENT" | "PERMANENT";
      detail: string | null;
      subDistrict: string | null;
      district: string | null;
      provinceName: string | null;
      postalCode: string | null;
    }[];
  };
};

function pickIncludes(req: NextRequest) {
  const include = (new URL(req.url).searchParams.get("include") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const set = new Set(include);
  return {
    // consultant flags
    languages: set.has("languages"),
    specializations: set.has("specializations"),
    organization: set.has("organization"),
    university: set.has("university"),

    // student flags
    academic: set.has("academic"),
    addresses: set.has("addresses"),
  };
}

function formatDisplayName(
  prefix?: string | null,
  first?: string | null,
  last?: string | null
) {
  const p = prefix?.trim() ? `${prefix.trim()} ` : "";
  const f = first?.trim() ?? "";
  const l = last?.trim() ? ` ${last.trim()}` : "";
  const name = `${p}${f}${l}`.trim();
  return name || "ผู้ใช้งาน";
}

function pickStudentNames(
  req: NextRequest,
  p: {
    student_first_name_th: string;
    student_last_name_th: string;
    student_nickname_th: string | null;
    student_first_name_en: string | null;
    student_last_name_en: string | null;
    student_nickname_en: string | null;
    student_prefix: string | null;
  }
) {
  // รองรับ ?lang=en, ค่าอื่นๆ ใช้ th
  const lang = (new URL(req.url).searchParams.get("lang") || "th")
    .toLowerCase()
    .trim();

  const isEn = lang === "en";

  const first = (isEn ? p.student_first_name_en : p.student_first_name_th) ?? p.student_first_name_th;
  const last = (isEn ? p.student_last_name_en : p.student_last_name_th) ?? p.student_last_name_th;
  const nick = (isEn ? p.student_nickname_en : p.student_nickname_th) ?? p.student_nickname_th;

  return { first, last, nick };
}

export async function GET(req: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(req);
    const role = String(account.role || "").toUpperCase() as ProfileType;
    const inc = pickIncludes(req);

    // =========================
    // CONSULTANT / HEAD_CONSULTANT
    // =========================
    if (role === "CONSULTANT" || role === "HEAD_CONSULTANT") {
      const consultant = await prisma.consultant.findFirst({
        where: {
          account_id: account.accountId,
        },
        include: {
          profile: true,
          organization: inc.organization,
          university: inc.university,
          languages: inc.languages,
          specializations: inc.specializations,
        },
      });

      if (!consultant || !consultant.profile) {
        return NextResponse.json(
          { error: "CONSULTANT_PROFILE_NOT_FOUND" },
          { status: 404 }
        );
      }

      const p = consultant.profile;

      const dto: ProfileMeDTO = {
        activeUniversityId,
        role,
        displayName: formatDisplayName(
          p.consultant_prefix,
          p.consultant_first_name,
          p.consultant_last_name
        ),
        profile: {
          type: role,
          id: consultant.consultant_id,

          prefix: p.consultant_prefix,
          firstName: p.consultant_first_name,
          lastName: p.consultant_last_name,
          nickname: p.consultant_nickname,
          email: p.consultant_email,
          phone: p.consultant_phone_number,

          universityId: consultant.university_id,
          universityCode: inc.university
            ? consultant.university?.university_code ?? null
            : undefined,
          universityName: inc.university
            ? consultant.university?.university_name_th ?? null
            : undefined,

          organizationName: inc.organization
            ? consultant.organization?.organization_name ?? null
            : undefined,

          languages: inc.languages
            ? consultant.languages
              .slice()
              .sort((a, b) =>
                a.consultant_language_code.localeCompare(
                  b.consultant_language_code
                )
              )
              .map((l) => ({
                code: l.consultant_language_code,
                fluencyLevel: l.consultant_language_fluency_level,
              }))
            : undefined,

          specializations: inc.specializations
            ? consultant.specializations
              .slice()
              .sort((a, b) =>
                a.consultant_specialization_topic.localeCompare(
                  b.consultant_specialization_topic
                )
              )
              .map((s) => s.consultant_specialization_topic)
            : undefined,
        },
      };

      return NextResponse.json({ data: dto });
    }

    // =========================
    // STUDENT
    // =========================
    if (role === "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          account_id: account.accountId,
          university_id: activeUniversityId,
        },
        include: {
          profile: true,
          university: inc.university,

          // จะ include ไว้ตลอดก็ได้ (ง่ายและชัวร์)
          // หรือถ้าต้องการประหยัด query: ใช้ inc.academic/inc.addresses เป็นเงื่อนไขแทนได้
          academic: {
            include: {
              faculty: true,
              department: true,
              advisor: true,
            },
          },

          addresses: {
            include: { province: true },
            orderBy: { student_address_type: "asc" },
          },
        },
      });

      if (!student || !student.profile) {
        return NextResponse.json(
          { error: "STUDENT_PROFILE_NOT_FOUND" },
          { status: 404 }
        );
      }

      const p = student.profile;
      const a = student.academic ?? null;

      // ✅ ใช้ field *_th/_en ตาม schema
      const { first, last, nick } = pickStudentNames(req, p);

      const dto: ProfileMeDTO = {
        activeUniversityId,
        role,
        displayName: formatDisplayName(p.student_prefix, first, last),
        profile: {
          type: role,
          id: student.student_id,

          // common
          prefix: p.student_prefix ?? null,
          firstName: first ?? null,
          lastName: last ?? null,
          nickname: nick ?? null,
          email: p.student_email ?? null,
          phone: p.student_phone_number ?? null,

          universityId: student.university_id,
          universityName: inc.university
            ? student.university?.university_name_th ?? null
            : undefined,

          // student extras
          gender: p.student_gender ? String(p.student_gender) : null,
          birthday: p.student_birthday ? p.student_birthday.toISOString() : null,
          bloodGroup: p.student_blood_group ?? null,
          nationality: p.student_nationality ?? null,
          religion: p.student_religion ?? null,

          // academic
          program: inc.academic ? a?.student_program ?? null : undefined,
          degree: inc.academic ? a?.student_degree ?? null : undefined,
          degreeName: inc.academic ? a?.student_degree_name ?? null : undefined,
          admitAcademicYear: inc.academic
            ? a?.student_admit_academic_year ?? null
            : undefined,

          facultyName: inc.academic ? a?.faculty?.faculty_name_th ?? null : undefined,
          facultyNameEn: inc.academic ? a?.faculty?.faculty_name_en ?? null : undefined,

          departmentName: inc.academic
            ? a?.department?.department_name_th ?? null
            : undefined,
          departmentNameEn: inc.academic
            ? a?.department?.department_name_en ?? null
            : undefined,

          advisorName: inc.academic
            ? a?.advisor
              ? formatDisplayName(
                a.advisor.advisor_prefix,
                a.advisor.advisor_first_name,
                a.advisor.advisor_last_name
              )
              : null
            : undefined,

          // addresses
          addresses: inc.addresses
            ? (student.addresses ?? []).map((x) => ({
              type: x.student_address_type as "CURRENT" | "PERMANENT",
              detail: x.student_address_detail ?? null,
              subDistrict: x.student_address_sub_district ?? null,
              district: x.student_address_district ?? null,
              provinceName:
                x.province?.province_name_th ??
                // เผื่อ schema ใช้ชื่อ province_name
                (x.province as any)?.province_name ??
                null,
              postalCode: x.student_address_postal_code ?? null,
            }))
            : undefined,
        },
      };

      return NextResponse.json({ data: dto });
    }

    // =========================
    // STAFF (RECTOR / SUPER_ADMIN)
    // =========================
    const dto: ProfileMeDTO = {
      activeUniversityId,
      role,
      displayName: account.username,
      profile: {
        type: role,
        id: account.accountId,
        firstName: account.username,
        universityId: activeUniversityId,
      },
    };

    return NextResponse.json({ data: dto });
  } catch (e: any) {
    const status = Number(e?.status) || 500;
    const message = e?.message || "INTERNAL_SERVER_ERROR";
    console.error("[PROFILE_ME_V2]", e);
    return NextResponse.json({ error: message }, { status });
  }
}
