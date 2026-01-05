// src/app/api/v1/consultants/route.ts
// ✅ Fixed: Uses Consultant model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/v1/consultants
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');

    const where: Record<string, unknown> = {};

    if (organizationId) {
      where.organization_id = parseInt(organizationId);
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
      orderBy: { consultant_created_at: 'desc' },
    });

    const formattedConsultants = consultants.map((c) => ({
      id: c.consultant_id,
      accountId: c.account_id,
      username: c.account.account_username,
      role: c.account.account_role,
      lineId: c.account.account_line_id,
      
      // Profile
      name: c.profile
        ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`
        : null,
      firstName: c.profile?.consultant_first_name,
      lastName: c.profile?.consultant_last_name,
      nickname: c.profile?.consultant_nickname,
      gender: c.profile?.consultant_gender,
      phone: c.profile?.consultant_phone_number,
      email: c.profile?.consultant_email,

      // Organization
      organization: c.organization.organization_name,
      organizationId: c.organization_id,

      // Specializations
      specializations: c.specializations.map((s) => s.consultant_specialization_topic),

      // Languages
      languages: c.languages.map((l) => ({
        code: l.consultant_language_code,
        level: l.consultant_language_fluency_level,
      })),

      createdAt: c.consultant_created_at.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      consultants: formattedConsultants,
    });
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultants' },
      { status: 500 }
    );
  }
}

// POST /api/v1/consultants
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username,
      password,
      role = 'CONSULTANT',
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

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username และ Password จำเป็น' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization จำเป็น' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'ชื่อและนามสกุลจำเป็น' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingAccount = await prisma.account.findUnique({
      where: { account_username: username },
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Username นี้ถูกใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // Hash password (ควรใช้ bcrypt)
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account, consultant, profile in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create account
      const account = await tx.account.create({
        data: {
          account_username: username,
          account_password: hashedPassword,
          account_role: role,
        },
      });

      // 2. Create consultant
      const consultant = await tx.consultant.create({
        data: {
          account_id: account.account_id,
          organization_id: organizationId,
        },
      });

      // 3. Create profile
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

      // 4. Create specializations
      if (specializations.length > 0) {
        await tx.consultantSpecialization.createMany({
          data: specializations.map((topic: string) => ({
            consultant_id: consultant.consultant_id,
            consultant_specialization_topic: topic,
          })),
        });
      }

      // 5. Create languages
      if (languages.length > 0) {
        await tx.consultantLanguage.createMany({
          data: languages.map((lang: { code: string; level?: string }) => ({
            consultant_id: consultant.consultant_id,
            consultant_language_code: lang.code,
            consultant_language_fluency_level: lang.level,
          })),
        });
      }

      return consultant;
    });

    return NextResponse.json({
      success: true,
      consultant: {
        id: result.consultant_id,
        name: `${firstName} ${lastName}`,
      },
    });
  } catch (error) {
    console.error('Error creating consultant:', error);
    return NextResponse.json(
      { error: 'Failed to create consultant' },
      { status: 500 }
    );
  }
}