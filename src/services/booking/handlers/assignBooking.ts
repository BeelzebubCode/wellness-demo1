// src/services/booking/handlers/assignBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { requireUniversity } from "@/lib/auth/guard";
import { BookingStatus, AccountRole } from "@prisma/client";

type AssignBody = { consultantId?: number; note?: string };

async function resolveAssignerConsultantId(params: {
  accountId: number;
  activeUniversityId: number;
}) {
  const { accountId, activeUniversityId } = params;

  const row = await prisma.consultant.findFirst({
    where: {
      account_id: accountId,
      university_id: activeUniversityId,
    },
    select: { consultant_id: true },
  });

  return row?.consultant_id ?? null;
}

export async function handleAssignBooking(
  ctx: AccountContext & { activeUniversityId?: number },
  bookingIdRaw: string,
  body: AssignBody,
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const activeUniversityId = (ctx as any).activeUniversityId as
    | number
    | undefined;
  if (typeof activeUniversityId !== "number") {
    return NextResponse.json(
      { error: "activeUniversityId missing" },
      { status: 400 },
    );
  }

  const deniedUni = requireUniversity(ctx as any, activeUniversityId);
  if (deniedUni) return deniedUni;

  const role = ctx.role as AccountRole;
  if (role !== "HEAD_CONSULTANT") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ✅ หา accountId แบบกันเคส ctx ใช้ snake_case
  const accountId = (ctx as any).accountId ?? (ctx as any).account_id;

  if (typeof accountId !== "number") {
    return NextResponse.json({ error: "accountId missing" }, { status: 400 });
  }
  
  // ✅ หา consultantId ของคนมอบหมาย (HEAD_CONSULTANT)
  let assignedById: number | null = (ctx as any).consultantId ?? null;

  if (typeof assignedById !== "number") {
    assignedById = await resolveAssignerConsultantId({
      accountId,
      activeUniversityId,
    });
  }

  if (typeof assignedById !== "number") {
    return NextResponse.json(
      { error: "ไม่พบข้อมูลผู้ให้คำปรึกษาของผู้มอบหมาย (consultantId)" },
      { status: 400 },
    );
  }

  // หลังจากนี้ assignedById จะถูก narrow เป็น number แน่นอน

  // ✅ คนที่จะรับงาน
  const consultantId = Number(body?.consultantId);
  if (!Number.isFinite(consultantId)) {
    return NextResponse.json(
      { error: "กรุณาระบุผู้ให้คำปรึกษา" },
      { status: 400 },
    );
  }

  // ✅ Booking ใช้ composite key: university_id + booking_id
  const booking = await prisma.booking.findUnique({
    where: {
      university_id_booking_id: {
        university_id: activeUniversityId,
        booking_id: bookingId,
      },
    },
    select: {
      booking_id: true,
      university_id: true,
      consultant_id: true,
      booking_status: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "ไม่พบรายการจอง" }, { status: 404 });
  }

  // ✅ ถ้ามีคนรับแล้วก็จบเลย (กันเคส upd.count=0 แล้ว error กว้างไป)
  if (booking.consultant_id !== null) {
    return NextResponse.json(
      { error: "รายการนี้ถูกมอบหมายไปแล้ว" },
      { status: 409 },
    );
  }

  // ✅ Consultant ใน schema เป็น id เดี่ยว (consultant_id เป็น @id) แต่เรายัง tenant-check ด้วย where university_id
  const assignee = await prisma.consultant.findFirst({
    where: {
      consultant_id: consultantId,
      university_id: activeUniversityId,
    },
    select: { consultant_id: true },
  });

  if (!assignee) {
    return NextResponse.json(
      { error: "ไม่พบผู้ให้คำปรึกษาที่เลือก (หรืออยู่นอกมหาวิทยาลัยนี้)" },
      { status: 400 },
    );
  }

  // ✅ แจกได้เฉพาะตอนยังรอแจกงาน
  const allowed: BookingStatus[] = [BookingStatus.PENDING_ASSIGNMENT];

  const result = await prisma.$transaction(async (tx) => {
    const upd = await tx.booking.updateMany({
      where: {
        university_id: activeUniversityId,
        booking_id: bookingId,
        consultant_id: null,
        booking_status: { in: allowed },
      },
      data: {
        booking_status: BookingStatus.ASSIGNED,
        consultant_id: consultantId,
      },
    });

    if (upd.count === 0) return { ok: false as const };

    // ✅ BookingAssignment ต้องใส่ university_id ด้วย (ตาม schema)
    await tx.bookingAssignment.create({
      data: {
        university_id: activeUniversityId,
        booking_id: bookingId,
        booking_assignment_assigned_by_id: assignedById,
        booking_assignment_assigned_to_id: consultantId,
        booking_assignment_note: body?.note ?? null,
      },
    });

    return { ok: true as const };
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "สถานะไม่อนุญาตให้แจกงาน หรือรายการถูกเปลี่ยนไปแล้ว" },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true, status: BookingStatus.ASSIGNED });
}
