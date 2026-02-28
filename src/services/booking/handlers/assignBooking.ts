// src/services/booking/handlers/assignBooking.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";
import { autoExpireAssignments } from "@/services/borrow-requests";

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
  // ✅ Lazy expiration: auto-complete expired borrow assignments
  await autoExpireAssignments();

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

  // ✅ อนุญาตแจกเฉพาะสถานะที่ยังแก้ไขได้ (ไม่อนุญาต COMPLETED / CANCELLED)
  const reassignableStatuses: BookingStatus[] = [
    BookingStatus.PENDING_ASSIGNMENT,
    BookingStatus.ASSIGNED,
    BookingStatus.IN_PROGRESS,
  ];
  if (!reassignableStatuses.includes(booking.booking_status)) {
    return NextResponse.json(
      { error: "ไม่สามารถเปลี่ยนผู้ดูแลได้ในสถานะนี้ (เสร็จสิ้น/ยกเลิก)" },
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
          accessPermissions: {
            where: {
              university_id: activeUniversityId,
              access_revoked_at: null,
              access_role: { in: ["CONSULTANT", "HEAD_CONSULTANT"] },
            },
            select: { account_university_permission_id: true },
          },
        },
      },
    },
  });

  if (!assignee) {
    return NextResponse.json({ error: "ไม่พบผู้ให้คำปรึกษาที่เลือก" }, { status: 400 });
  }

  const consultantUniversityId = assignee.university_id;
  const hasAccess = (assignee.account?.accessPermissions?.length || 0) > 0;

  let borrowAssignmentId: number | null = null;
  const baIdRaw = body?.borrowAssignmentId;

  // ✅ 1. ถ้ามีส่ง borrowAssignmentId มาจากหน้าบ้าน ให้บังคับตรวจเงื่อนไขการยืมตัวเสมอ
  // ✅ 2. ถ้ามาจากต่างมอ และไม่ส่ง baIdRaw มา ต้องมี hasAccess (Ghost Account ถาวร) จึงจะผ่านได้
  if (baIdRaw || (!hasAccess && consultantUniversityId !== activeUniversityId)) {
    const baId = Number(baIdRaw);
    if (!Number.isFinite(baId)) {
      return NextResponse.json(
        { error: "แจกข้ามมหาลัยต้องระบุ borrowAssignmentId หรือยังไม่มีสิทธิ์เข้าถึง" },
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

    // ✅ Fetch the booking's time slot to check if it falls within the borrowed period
    const bookingDetails = await prisma.booking.findUnique({
      where: {
        university_id_booking_id: {
          university_id: activeUniversityId,
          booking_id: bookingId,
        },
      },
      select: {
        timeSlot: {
          select: {
            time_slot_start_datetime: true,
          },
        },
      },
    });

    if (!bookingDetails?.timeSlot?.time_slot_start_datetime) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเวลาของรายการจอง" }, { status: 400 });
    }

    const bookingTime = bookingDetails.timeSlot.time_slot_start_datetime;

    // ✅ window ต้องครอบคลุมเวลาของ booking — ป้องกัน assignงานนอกช่วงเวลาที่ยืมตัวมา
    if (bookingTime < ba.borrow_assign_start_at || bookingTime > ba.borrow_assign_end_at) {
      return NextResponse.json(
        { error: "ไม่สามารถแจกงานนอกช่วงเวลาที่ยืมตัวมาได้" },
        { status: 400 }
      );
    }

    // สถานะคำขอควรพร้อมใช้งาน (ปรับได้ตาม flow จริงของคุณ)
    const okStatuses = ["APPROVED", "ASSIGNED", "COMPLETED"] as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!okStatuses.includes(ba.borrowRequest.borrow_request_status as any)) {
      return NextResponse.json({ error: "borrowRequest ยังไม่พร้อมใช้งาน" }, { status: 409 });
    }

    borrowAssignmentId = ba.borrow_assignment_id;
  }

  // ✅ ทำธุรกรรมแจกงาน: update booking + create booking_assignment
  try {
    await prisma.$transaction(async (tx) => {
      // update booking (กัน race condition)
      // ✅ Booking FK ใช้แค่ consultant_id (autoincrement, globally unique)
      // ไม่ใช่ composite [university_id, consultant_id] → set ได้เลยแม้ข้ามมหาลัย
      const upd = await tx.booking.updateMany({
        where: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          booking_status: { in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS] },
        },
        data: {
          booking_status: BookingStatus.ASSIGNED,
          consultant_id: consultantId,
        },
      });

      if (upd.count === 0) {
        throw Object.assign(new Error("RACE_OR_STATUS"), { status: 409 });
      }

      // ✅ 1. Deactivate old assignments to keep history
      await tx.bookingAssignment.updateMany({
        where: {
          university_id: activeUniversityId,
          booking_id: bookingId,
          is_active: true,
        },
        data: {
          is_active: false,
        },
      });

      // ✅ 2. Create booking_assignment (schema ใหม่ - บันทึกประวัติใหม่)
      await tx.bookingAssignment.create({
        data: {
          university_id: activeUniversityId,
          booking_id: bookingId,

          consultant_id: consultantId,
          consultant_university_id: consultantUniversityId,
          borrow_assignment_id: borrowAssignmentId,

          assigned_by_account_id: ctx.accountId,
          assigned_note: body?.note ?? null,
          is_active: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      status: BookingStatus.ASSIGNED,
    });
  } catch (e: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = (e as any)?.status ?? 500;
    const msg =
      status === 409
        ? "สถานะไม่อนุญาตให้แจกงาน หรือรายการถูกเปลี่ยนไปแล้ว"
        : "Failed to assign booking";

    return NextResponse.json({ error: msg }, { status });
  }
}
