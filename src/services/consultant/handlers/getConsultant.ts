// src/services/consultant/handlers/getConsultant.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { AccountRole, BookingStatus } from "@prisma/client";

function isStaff(role: AccountRole) {
  return role === "HEAD_CONSULTANT" || role === "RECTOR" || role === "SUPER_ADMIN";
}

export async function handleGetConsultant(
  ctx: AccountContext & { activeUniversityId?: number },
  consultantIdRaw: string,
) {
  const role = ctx.role as AccountRole;
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
      account: { select: { account_username: true, account_role: true, account_line_id: true } },
      bookings: { select: { booking_status: true } },
      feedbacks: { include: { ratings: true } },
    },
  });

  if (!c) {
    return NextResponse.json({ error: "ไม่พบข้อมูลผู้ให้คำปรึกษา" }, { status: 404 });
  }

  // ✅ tenant guard (กันข้ามมหาลัย)
  const denied = requireUniversity(ctx as any, c.university_id);
  if (denied) return denied;

  const completed = c.bookings.filter((b) => b.booking_status === BookingStatus.COMPLETED).length;
  const pending = c.bookings.filter((b) =>
    b.booking_status === BookingStatus.ASSIGNED || b.booking_status === BookingStatus.IN_PROGRESS
  ).length;

  let avg = 0;
  const scores = c.feedbacks.flatMap((f) => f.ratings.map((r) => r.feedback_rating_score));
  if (scores.length) avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  return NextResponse.json({
    success: true,
    consultant: {
      id: c.consultant_id,
      accountId: c.account_id,
      universityId: c.university_id,
      username: c.account.account_username,
      role: c.account.account_role,
      lineId: c.account.account_line_id,

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
