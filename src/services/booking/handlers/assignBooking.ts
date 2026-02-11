// src/services/booking/handlers/assignBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type AssignBody = {
  consultantId?: number;
  note?: string;
  borrowAssignmentId?: number; // ✅ ใช้เมื่อแจกข้ามมหาลัย
};

function nowTs() {
  return new Date();
}

export async function handleAssignBooking(
  ctx: { accountId: number; role: string; activeUniversityId: number },
  bookingIdRaw: string,
  body: AssignBody,
) {
  const bookingId = Number(bookingIdRaw);
  if (!Number.isFinite(bookingId)) {
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const activeUniversityId = ctx.activeUniversityId;
  if (!Number.isFinite(activeUniversityId)) {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  if (!["HEAD_CONSULTANT", "SUPER_ADMIN", "ADMIN"].includes(ctx.role)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const consultantId = Number(body?.consultantId);
  if (!Number.isFinite(consultantId)) {
    return NextResponse.json({ error: "กรุณาระบุผู้ให้คำปรึกษา" }, { status: 400 });
  }

  // ✅ booking ต้องอยู่ใน tenant นี้เท่านั้น
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

  // ✅ Re-assignment allowed (schema v2)

  // ✅ อนุญาตแจกเฉพาะสถานะนี้
  if (booking.booking_status !== BookingStatus.PENDING_ASSIGNMENT) {
    return NextResponse.json(
      { error: "สถานะไม่อนุญาตให้แจกงาน" },
      { status: 409 },
    );
  }

  // ✅ หา consultant + university ของ consultant + (NEW) Ghost Account Access
  const assignee = await prisma.consultant.findUnique({
    where: { consultant_id: consultantId },
    select: {
      consultant_id: true,
      university_id: true,
      account: {
        select: {
          universityAccesses: {
            where: {
              university_id: activeUniversityId,
              access_revoked_at: null,
              access_role: { in: ["CONSULTANT", "HEAD_CONSULTANT"] as any },
            },
            select: { account_university_access_id: true },
          },
        },
      },
    },
  });

  if (!assignee) {
    return NextResponse.json({ error: "ไม่พบผู้ให้คำปรึกษาที่เลือก" }, { status: 400 });
  }

  const consultantUniversityId = assignee.university_id;
  const hasAccess = (assignee.account?.universityAccesses?.length || 0) > 0;
  const isSameUniversity = consultantUniversityId === activeUniversityId || hasAccess;

  // ✅ ถ้าข้ามมหาลัย ต้องมี borrowAssignmentId + ตรวจว่า valid ในช่วงเวลา
  let borrowAssignmentId: number | null = null;

  if (!isSameUniversity) {
    const baId = Number(body?.borrowAssignmentId);
    if (!Number.isFinite(baId)) {
      return NextResponse.json(
        { error: "แจกข้ามมหาลัยต้องระบุ borrowAssignmentId" },
        { status: 400 },
      );
    }

    const ba = await prisma.borrowAssignment.findUnique({
      where: { borrow_assignment_id: baId },
      select: {
        borrow_assignment_id: true,
        consultant_id: true,
        consultant_university_id: true,
        borrow_assign_start_at: true,
        borrow_assign_end_at: true,
        borrowRequest: {
          select: {
            from_university_id: true,
            borrow_request_status: true,
          },
        },
      },
    });

    if (!ba) {
      return NextResponse.json({ error: "ไม่พบ borrowAssignmentId" }, { status: 400 });
    }

    // ต้อง match consultant คนเดียวกัน
    if (ba.consultant_id !== consultantId) {
      return NextResponse.json({ error: "borrowAssignment ไม่ตรงกับ consultant" }, { status: 400 });
    }

    // ต้องเป็นงานที่ “ยืมเข้ามหาลัยนี้”
    if (ba.borrowRequest.from_university_id !== activeUniversityId) {
      return NextResponse.json({ error: "borrowAssignment ไม่ได้ยืมเข้ามหาลัยนี้" }, { status: 400 });
    }

    // window ต้องครอบคลุมปัจจุบัน
    const now = nowTs();
    // if (!(ba.borrow_assign_start_at <= now && now <= ba.borrow_assign_end_at)) {
    //   return NextResponse.json({ error: "borrowAssignment หมดช่วงเวลา/ยังไม่ถึงเวลา" }, { status: 409 });
    // }

    // สถานะคำขอควรพร้อมใช้งาน (ปรับได้ตาม flow จริงของคุณ)
    const okStatuses = ["APPROVED", "ASSIGNED", "COMPLETED"] as const;
    if (!okStatuses.includes(ba.borrowRequest.borrow_request_status as any)) {
      return NextResponse.json({ error: "borrowRequest ยังไม่พร้อมใช้งาน" }, { status: 409 });
    }

    borrowAssignmentId = ba.borrow_assignment_id;
  }

  // ✅ ทำธุรกรรมแจกงาน: update booking + create booking_assignment
  try {
    await prisma.$transaction(async (tx) => {
      // update booking (กัน race condition)
      // ✅ ถ้า consultant อยู่คนละมหาลัย (Ghost / Borrow) ห้าม update consultant_id ใน Booking
      // เพราะ Booking ผูก FK [university_id, consultant_id] ซึ่ง consultant ไม่ได้อยู่ที่นี่
      const isLocalConsultant = consultantUniversityId === activeUniversityId;

      const upd = await tx.booking.updateMany({
        where: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          booking_status: { in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED] },
        },
        data: {
          booking_status: BookingStatus.ASSIGNED,
          // ถ้าเป็น local ให้ใส่ id, ถ้าข้ามมหาลัย ให้ปล่อย null (ไปดูใน BookingAssignment แทน)
          consultant_id: isLocalConsultant ? consultantId : undefined,
        },
      });

      if (upd.count === 0) {
        throw Object.assign(new Error("RACE_OR_STATUS"), { status: 409 });
      }

      // create booking_assignment (schema ใหม่)
      await tx.bookingAssignment.create({
        data: {
          university_id: activeUniversityId,
          booking_id: bookingId,

          consultant_id: consultantId,
          consultant_university_id: consultantUniversityId,
          borrow_assignment_id: borrowAssignmentId,

          assigned_by_account_id: ctx.accountId,
          assigned_note: body?.note ?? null,
          // assigned_at ใช้ default(now()) แล้ว
        },
      });
    });

    return NextResponse.json({
      success: true,
      status: BookingStatus.ASSIGNED,
    });
  } catch (e: any) {
    // ถ้า unique (เคยมี bookingAssignment แล้ว)
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "รายการนี้ถูกมอบหมายไปแล้ว" }, { status: 409 });
    }

    const status = e?.status ?? 500;
    const msg =
      status === 409
        ? "สถานะไม่อนุญาตให้แจกงาน หรือรายการถูกเปลี่ยนไปแล้ว"
        : "Failed to assign booking";

    return NextResponse.json({ error: msg }, { status });
  }
}
