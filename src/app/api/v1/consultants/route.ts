// src/app/api/v1/consultants/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTenant } from "@/lib/tenant/server"; // ✅ ใช้ tenant guard

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const organizationId = searchParams.get("organizationId");
    const universityIdQ = searchParams.get("universityId");

    // ✅ ดึง activeUniversityId จาก tenant (ปลอดภัยสุด)
    const { activeUniversityId } = await requireTenant(req);

    const where: Record<string, unknown> = {
      university_id: activeUniversityId, // ✅ ล็อกตามมหาลัยที่กำลังใช้งาน
    };

    // ✅ เผื่ออยาก filter เพิ่ม
    if (organizationId) where.organization_id = parseInt(organizationId);

    // ✅ ถ้ามีคนส่ง universityId มา ให้ “ยอม” เฉพาะกรณีตรงกับ tenant เท่านั้น
    if (universityIdQ) {
      const uniId = parseInt(universityIdQ);
      if (Number.isFinite(uniId) && uniId !== activeUniversityId) {
        return NextResponse.json(
          { success: false, error: "universityId does not match active tenant" },
          { status: 403 }
        );
      }
    }

    const consultants = await prisma.consultant.findMany({
      where,
      include: {
        profile: true,
        organization: true,
        specializations: true,
        languages: true,
        account: {
          select: {
            account_username: true,
            account_role: true,
            account_line_id: true,
          },
        },
      },
      orderBy: { consultant_created_at: "desc" },
    });

    const formattedConsultants = consultants.map((c) => ({
      id: c.consultant_id,
      accountId: c.account_id,
      universityId: c.university_id, // ✅ ช่วย debug
      username: c.account.account_username,
      role: c.account.account_role,
      lineId: c.account.account_line_id,

      name: c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`
        : null,
      firstName: c.profile?.consultant_first_name ?? null,
      lastName: c.profile?.consultant_last_name ?? null,
      nickname: c.profile?.consultant_nickname ?? null,
      gender: c.profile?.consultant_gender ?? null,
      phone: c.profile?.consultant_phone_number ?? null,
      email: c.profile?.consultant_email ?? null,

      organization: c.organization?.organization_name ?? null,
      organizationId: c.organization_id,

      specializations: c.specializations.map((s) => s.consultant_specialization_topic),
      languages: c.languages.map((l) => ({
        code: l.consultant_language_code,
        level: l.consultant_language_fluency_level,
      })),

      createdAt: c.consultant_created_at.toISOString(),
    }));

    return NextResponse.json({ success: true, consultants: formattedConsultants });
  } catch (error) {
    console.error("Error fetching consultants:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch consultants" }, { status: 500 });
  }
}

// POST /api/v1/consultants
export async function POST(req: NextRequest) {
  try {
    // ✅ ดึง tenant ก่อน (เอา university_id ที่ active)
    const { activeUniversityId } = await requireTenant(req);

    const body = await req.json();
    const {
      username,
      password,
      role = "CONSULTANT",
      organizationId,
      firstName,
      lastName,
      nickname,
      gender,
      phone,
      email,
      specializations = [],
      languages = [],
    } = body;

    // ===== Validate =====
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username และ Password จำเป็น" },
        { status: 400 }
      );
    }

    const orgId = Number(organizationId);
    if (!Number.isFinite(orgId) || orgId <= 0) {
      return NextResponse.json(
        { success: false, error: "Organization ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "ชื่อและนามสกุลจำเป็น" },
        { status: 400 }
      );
    }

    // กัน username ซ้ำ
    const existingAccount = await prisma.account.findUnique({
      where: { account_username: username },
    });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, error: "Username นี้ถูกใช้งานแล้ว" },
        { status: 400 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1) create account
      const account = await tx.account.create({
        data: {
          account_username: username,
          account_password: hashedPassword,
          account_role: role,
          // ถ้าสคีมาคุณมี home university -> ใส่ได้เลย (ถ้าไม่มี ให้ลบออก)
          // account_home_university_id: activeUniversityId,
        },
      });

      // 2) create consultant (✅ ต้องใส่ university_id)
      const consultant = await tx.consultant.create({
        data: {
          account_id: account.account_id,
          university_id: activeUniversityId, // ✅ FIX: required field
          organization_id: orgId,
        },
      });

      // 3) profile
      await tx.consultantProfile.create({
        data: {
          consultant_id: consultant.consultant_id,
          consultant_first_name: firstName,
          consultant_last_name: lastName,
          consultant_nickname: nickname,
          consultant_gender: gender,
          consultant_phone_number: phone,
          consultant_email: email,
        },
      });

      // 4) specializations
      if (Array.isArray(specializations) && specializations.length > 0) {
        await tx.consultantSpecialization.createMany({
          data: specializations
            .filter(Boolean)
            .map((topic: string) => ({
              consultant_id: consultant.consultant_id,
              consultant_specialization_topic: String(topic),
            })),
        });
      }

      // 5) languages
      if (Array.isArray(languages) && languages.length > 0) {
        await tx.consultantLanguage.createMany({
          data: languages
            .filter((l: any) => l?.code)
            .map((lang: { code: string; level?: string }) => ({
              consultant_id: consultant.consultant_id,
              consultant_language_code: String(lang.code),
              consultant_language_fluency_level: lang.level ?? null,
            })),
        });
      }

      return { consultant, account };
    });

    return NextResponse.json({
      success: true,
      consultant: {
        id: result.consultant.consultant_id,
        accountId: result.account.account_id,
        universityId: activeUniversityId,
        name: `${firstName} ${lastName}`,
      },
    });
  } catch (error) {
    console.error("Error creating consultant:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create consultant" },
      { status: 500 }
    );
  }
}
