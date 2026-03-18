// src/services/consultant/handlers/getConsultant.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus } from "@prisma/client";

function isStaff(role: string) {
  return role === "HEAD_CONSULTANT" || role === "RECTOR" || role === "SUPER_ADMIN";
}

export async function handleGetConsultant(
  ctx: AccountContext & { activeUniversityId?: number },
  consultantIdRaw: string,
) {
  const role = ctx.role as string;
  if (!isStaff(role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = Number(consultantIdRaw);
  if (!Number.isFinite(consultantId)) {
    return NextResponse.json({ error: "Invalid consultant ID" }, { status: 400 });
  }

  const c = await prisma.consultant.findUnique({
    where: { consultant_id: consultantId },
    include: {
      profile: true,
      organization: true,
      specializations: true,
      languages: true,
      account: { select: { account_username: true, roleCategory: { select: { code: true } } } },
      bookings: { select: { booking_status: true } },
      _count: { select: { feedbacks: true } },
    },
  });

  if (!c) {
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ให้คำปรึกษา" }, { status: 404 });
  }

  // ✅ tenant guard (กันข้ามมหาลัย)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const denied = requireUniversity(ctx as any, c.university_id);
  if (denied) return denied;

  const completed = c.bookings.filter((b) => b.booking_status === BookingStatus.COMPLETED).length;
  const pending = c.bookings.filter((b) =>
    b.booking_status === BookingStatus.ASSIGNED || b.booking_status === BookingStatus.IN_PROGRESS
  ).length;

  // ✅ Batch avg rating via raw SQL (no N+1)
  const ratingResult = await prisma.$queryRaw<Array<{ avg_rating: number }>>`
    SELECT AVG(fr.feedback_rating_score)::float AS avg_rating
    FROM feedback_rating fr
    JOIN feedback f ON f.feedback_id = fr.feedback_id
    WHERE f.consultant_id = ${c.consultant_id}
  `;
  const avg = ratingResult[0]?.avg_rating ?? 0;

  return NextResponse.json({
    success: true,
    consultant: {
      id: c.consultant_id,
      accountId: c.account_id,
      universityId: c.university_id,
      username: c.account.account_username,
      role: c.account.roleCategory.code,

      name: c.profile ? `${c.profile.consultant_first_name} ${c.profile.consultant_last_name}` : null,
      firstName: c.profile?.consultant_first_name ?? null,
      lastName: c.profile?.consultant_last_name ?? null,
      nickname: c.profile?.consultant_nickname ?? null,
      phone: c.profile?.consultant_phone_number ?? null,
      email: c.profile?.consultant_email ?? null,

      organizationId: c.organization_id,
      organization: c.organization?.organization_name ?? null,

      specializations: c.specializations.map((s) => s.consultant_specialization_topic),
      languages: c.languages.map((l) => ({ code: l.consultant_language_code, level: l.consultant_language_fluency_level })),

      stats: {
        totalBookings: c.bookings.length,
        completedBookings: completed,
        pendingBookings: pending,
        averageRating: avg,
      },
      createdAt: c.consultant_created_at.toISOString(),
    },
  });
}
