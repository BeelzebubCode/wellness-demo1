// src/services/booking/handlers/assignBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

type AssignBody = { consultantId?: number; note?: string };

async function resolveAssignerConsultantId(params: {
  accountId: number;
  activeUniversityId?: number;
}) {
  const { accountId, activeUniversityId } = params;

  // ถ้ามี activeUniversityId ให้ match ตาม tenant ก่อน
  const row = await prisma.consultant.findFirst({
    where: {
      account_id: accountId,
      ...(typeof activeUniversityId === "number"
        ? { university_id: activeUniversityId }
        : {}),
    },
    select: { consultant_id: true },
  });

  return row?.consultant_id ?? null;
}

export async function handleAssignBooking(
  ctx: AccountContext & { activeUniversityId?: number }, // ✅ เผื่อ route ส่งมา
  bookingIdRaw: string,
  body: AssignBody
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const role = ctx.role as AccountRole;
  if (role !== "HEAD_CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ✅ ผู้มอบหมาย: ถ้า ctx.consultantId ไม่มี ให้หาเองจาก DB
  let assignedById = (ctx as any).consultantId as number | undefined;
  if (typeof assignedById !== "number") {
    assignedById = await resolveAssignerConsultantId({
      accountId: (ctx as any).accountId,
      activeUniversityId: (ctx as any).activeUniversityId,
    }) as any;
  }

  if (typeof assignedById !== "number") {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลผู้ให้คำปรึกษาของผู้มอบหมาย (consultantId)" },
      { status: 400 }
    );
  }

  const consultantId = body?.consultantId;
  if (typeof consultantId !== "number") {
    return NextResponse.json({ error: "กรุณาระบุผู้ให้คำปรึกษา" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { booking_id: bookingId },
    select: { booking_id: true, university_id: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // tenant guard (เดิม)
  const deniedUni = requireUniversity(ctx as any, booking.university_id);
  if (deniedUni) return deniedUni;

  // ✅ กันมอบหมายข้ามมหาลัย (กันเคสพลาด)
  const assignee = await prisma.consultant.findUnique({
    where: { consultant_id: consultantId },
    select: { university_id: true },
  });
  if (!assignee) {
    return NextResponse.json({ error: "ไม่พบผู้ให้คำปรึกษาที่เลือก" }, { status: 400 });
  }
  if (assignee.university_id !== booking.university_id) {
    return NextResponse.json(
      { error: "ไม่สามารถมอบหมายให้ผู้ให้คำปรึกษาต่างมหาวิทยาลัยได้" },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { booking_id: bookingId },
      data: { booking_status: BookingStatus.ASSIGNED, consultant_id: consultantId },
    });

    await tx.bookingAssignment.create({
      data: {
        booking_id: bookingId,
        booking_assignment_assigned_by_id: assignedById,
        booking_assignment_assigned_to_id: consultantId,
        booking_assignment_note: body?.note ?? null,
      },
    });
  });

  return NextResponse.json({ success: true, status: BookingStatus.ASSIGNED });
}
