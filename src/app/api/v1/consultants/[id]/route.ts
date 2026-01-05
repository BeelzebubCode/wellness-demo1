// src/app/api/v1/consultants/[id]/route.ts
// ✅ Fixed: Uses Consultant model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/consultants/:id
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const consultantId = parseInt(id);

    if (isNaN(consultantId)) {
      return NextResponse.json(
        { error: 'Invalid consultant ID' },
        { status: 400 }
      );
    }

    const consultant = await prisma.consultant.findUnique({
      where: { consultant_id: consultantId },
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
        // สถิติ
        bookings: {
          select: {
            booking_id: true,
            booking_status: true,
          },
        },
        feedbacks: {
          include: {
            ratings: true,
          },
        },
      },
    });

    if (!consultant) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ให้คำปรึกษา' },
        { status: 404 }
      );
    }

    // คำนวณสถิติ
    const stats = {
      totalBookings: consultant.bookings.length,
      completedBookings: consultant.bookings.filter(
        (b) => b.booking_status === 'COMPLETED'
      ).length,
      pendingBookings: consultant.bookings.filter(
        (b) => b.booking_status === 'ASSIGNED' || b.booking_status === 'IN_PROGRESS'
      ).length,
      averageRating: 0,
    };

    // คำนวณคะแนนเฉลี่ย
    if (consultant.feedbacks.length > 0) {
      const allRatings = consultant.feedbacks.flatMap((f) =>
        f.ratings.map((r) => r.feedback_rating_score)
      );
      if (allRatings.length > 0) {
        stats.averageRating =
          allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      }
    }

    const formattedConsultant = {
      id: consultant.consultant_id,
      accountId: consultant.account_id,
      username: consultant.account.account_username,
      role: consultant.account.account_role,
      lineId: consultant.account.account_line_id,

      // Profile
      name: consultant.profile
        ? `${consultant.profile.consultant_first_name} ${consultant.profile.consultant_last_name}`
        : null,
      firstName: consultant.profile?.consultant_first_name,
      lastName: consultant.profile?.consultant_last_name,
      nickname: consultant.profile?.consultant_nickname,
      gender: consultant.profile?.consultant_gender,
      phone: consultant.profile?.consultant_phone_number,
      email: consultant.profile?.consultant_email,

      // Organization
      organization: consultant.organization.organization_name,
      organizationId: consultant.organization_id,

      // Specializations
      specializations: consultant.specializations.map(
        (s) => s.consultant_specialization_topic
      ),

      // Languages
      languages: consultant.languages.map((l) => ({
        code: l.consultant_language_code,
        level: l.consultant_language_fluency_level,
      })),

      // Stats
      stats,

      createdAt: consultant.consultant_created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      consultant: formattedConsultant,
    });
  } catch (error) {
    console.error('Error fetching consultant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consultant' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/consultants/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const consultantId = parseInt(id);
    const body = await req.json();

    if (isNaN(consultantId)) {
      return NextResponse.json(
        { error: 'Invalid consultant ID' },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      nickname,
      gender,
      phone,
      email,
      organizationId,
      specializations,
      languages,
    } = body;

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update profile
      if (firstName || lastName || nickname || gender || phone || email) {
        await tx.consultantProfile.update({
          where: { consultant_id: consultantId },
          data: {
            ...(firstName && { consultant_first_name: firstName }),
            ...(lastName && { consultant_last_name: lastName }),
            ...(nickname !== undefined && { consultant_nickname: nickname }),
            ...(gender !== undefined && { consultant_gender: gender }),
            ...(phone !== undefined && { consultant_phone_number: phone }),
            ...(email !== undefined && { consultant_email: email }),
          },
        });
      }

      // Update organization
      if (organizationId) {
        await tx.consultant.update({
          where: { consultant_id: consultantId },
          data: { organization_id: organizationId },
        });
      }

      // Update specializations
      if (specializations !== undefined) {
        await tx.consultantSpecialization.deleteMany({
          where: { consultant_id: consultantId },
        });

        if (specializations.length > 0) {
          await tx.consultantSpecialization.createMany({
            data: specializations.map((topic: string) => ({
              consultant_id: consultantId,
              consultant_specialization_topic: topic,
            })),
          });
        }
      }

      // Update languages
      if (languages !== undefined) {
        await tx.consultantLanguage.deleteMany({
          where: { consultant_id: consultantId },
        });

        if (languages.length > 0) {
          await tx.consultantLanguage.createMany({
            data: languages.map((lang: { code: string; level?: string }) => ({
              consultant_id: consultantId,
              consultant_language_code: lang.code,
              consultant_language_fluency_level: lang.level,
            })),
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating consultant:', error);
    return NextResponse.json(
      { error: 'Failed to update consultant' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/consultants/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const consultantId = parseInt(id);

    if (isNaN(consultantId)) {
      return NextResponse.json(
        { error: 'Invalid consultant ID' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามี booking ที่ยังไม่เสร็จหรือไม่
    const activeBookings = await prisma.booking.count({
      where: {
        consultant_id: consultantId,
        booking_status: {
          in: ['ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบได้ เนื่องจากมีงานที่ยังไม่เสร็จ' },
        { status: 400 }
      );
    }

    // ลบข้อมูลทั้งหมด
    await prisma.$transaction(async (tx) => {
      // ลบ specializations
      await tx.consultantSpecialization.deleteMany({
        where: { consultant_id: consultantId },
      });

      // ลบ languages
      await tx.consultantLanguage.deleteMany({
        where: { consultant_id: consultantId },
      });

      // ลบ profile
      await tx.consultantProfile.deleteMany({
        where: { consultant_id: consultantId },
      });

      // Get account id
      const consultant = await tx.consultant.findUnique({
        where: { consultant_id: consultantId },
        select: { account_id: true },
      });

      // ลบ consultant
      await tx.consultant.delete({
        where: { consultant_id: consultantId },
      });

      // ลบ account
      if (consultant) {
        await tx.account.delete({
          where: { account_id: consultant.account_id },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consultant:', error);
    return NextResponse.json(
      { error: 'Failed to delete consultant' },
      { status: 500 }
    );
  }
}