// src/app/api/v1/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";
import { getAccountFromRequest } from "@/lib/jwt";

/* =========================
   GET /api/v1/bookings
   ========================= */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as BookingStatus | null;
    const studentUsername = searchParams.get("student");
    const consultantId = searchParams.get("consultantId");
    const date = searchParams.get("date"); // yyyy-mm-dd

    const where: any = {};

    if (status) where.booking_status = status;
    if (consultantId) where.consultant_id = Number(consultantId);

    // ✅ filter ตามวันที่ (schema ใหม่: Booking -> timeSlot)
    if (date) {
      where.timeSlot = {
        time_slot_start_datetime: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59.999`),
        },
      };
    }

    if (studentUsername) {
      const student = await prisma.student.findFirst({
        where: { account: { account_username: studentUsername } },
        select: { student_id: true },
      });

      if (!student) return NextResponse.json({ success: true, bookings: [] });
      where.student_id = student.student_id;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          include: {
            profile: true,
            academic: { include: { faculty: true, department: true } },
            account: true,
          },
        },
        consultant: { include: { profile: true } },
        problemCategory: true,
        timeSlot: true, // ✅ เปลี่ยนจาก bookingSlots
        outcome: true,
        cancellation: true,
      },
      orderBy: { booking_created_at: "desc" },
    });

    const formatted = bookings.map((b) => {
      const slot = b.timeSlot;
      const studentProfile = b.student.profile;
      const consultantProfile = b.consultant?.profile;

      return {
        id: b.booking_id,
        status: b.booking_status,

        // ✅ alias สำหรับหน้า /admin/bookings
        userName: studentProfile
          ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
          : "ไม่ทราบชื่อ",
        lineUserId: b.student.account.account_line_id ?? "-",
        problemDescription: b.booking_detail_text ?? null,

        // ของเดิม (คงไว้)
        problemType: b.problemCategory.problem_category_name_th,
        problemCategoryCode: b.problemCategory.problem_category_code,
        detailText: b.booking_detail_text,
        createdAt: b.booking_created_at.toISOString(),

        date: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toISOString().split("T")[0]
          : null,
        startTime: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toTimeString().slice(0, 5)
          : null,
        endTime: slot?.time_slot_end_datetime
          ? slot.time_slot_end_datetime.toTimeString().slice(0, 5)
          : null,

        student: {
          id: b.student.student_id,
          username: b.student.account.account_username,
          name: studentProfile
            ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
            : null,
          faculty: b.student.academic?.faculty?.faculty_name_th ?? null,
          department: b.student.academic?.department?.department_name_th ?? null,
        },

        consultant: consultantProfile
          ? {
              id: b.consultant_id,
              name: `${consultantProfile.consultant_first_name} ${consultantProfile.consultant_last_name}`,
            }
          : null,

        outcome: b.outcome ?? null,
        cancellation: b.cancellation ?? null,
      };
    });

    return NextResponse.json({ success: true, bookings: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

/* =========================
   POST /api/v1/bookings
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const account = await getAccountFromRequest(request);

    if (!account || account.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!account.studentId) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
    }

    const body = await request.json();

    const timeSlotId = Number(body.timeSlotId);
    const problemCategoryId = Number(body.problemCategoryId);
    const detailText = body.detailText?.toString() || null;

    if (!timeSlotId || Number.isNaN(timeSlotId)) {
      return NextResponse.json({ error: "timeSlotId ไม่ถูกต้อง" }, { status: 400 });
    }

    if (!problemCategoryId || Number.isNaN(problemCategoryId)) {
      return NextResponse.json({ error: "problemCategoryId ไม่ถูกต้อง" }, { status: 400 });
    }

    const studentId = account.studentId;

    // ✅ status ที่ “นับคิว”
    const ACTIVE_STATUSES: BookingStatus[] = [
      "PENDING_ASSIGNMENT",
      "ASSIGNED",
      "IN_PROGRESS",
    ];

    // 🔍 กัน 1 คนมีได้ 1 booking active
    const existing = await prisma.booking.findFirst({
      where: { student_id: studentId, booking_status: { in: ACTIVE_STATUSES } },
      select: { booking_id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // 1) อ่าน slot เพื่อดู capacity + status
      const timeSlot = await tx.timeSlot.findUnique({
        where: { time_slot_id: timeSlotId },
        select: {
          time_slot_id: true,
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (!timeSlot) throw new Error("ไม่พบช่วงเวลานี้ในระบบ");

      const maxCapacity = Number(timeSlot.time_slot_max_capacity ?? 0);
      if (!maxCapacity || maxCapacity <= 0) throw new Error("ช่วงเวลานี้ไม่ได้เปิดรับจอง");

      // ถ้า admin ล็อก/ยกเลิก slot เอาไว้
      const slotStatus = String(timeSlot.time_slot_status || "").toUpperCase();
      if (slotStatus === "LOCKED" || slotStatus === "CANCELLED") {
        throw new Error("ช่วงเวลานี้ไม่สามารถจองได้");
      }

      // 2) นับจำนวน booking active ใน slot นี้ (schema ใหม่: Booking.time_slot_id)
      const bookedCount = await tx.booking.count({
        where: {
          time_slot_id: timeSlotId,
          booking_status: { in: ACTIVE_STATUSES },
        },
      });

      if (bookedCount >= maxCapacity) {
        await tx.timeSlot.update({
          where: { time_slot_id: timeSlotId },
          data: { time_slot_status: "BOOKED" },
        });
        throw new Error("ช่วงเวลานี้เต็มแล้ว");
      }

      // 3) กัน unique (student_id, time_slot_id) ที่คุณตั้งไว้ใน DB
      const dup = await tx.booking.findFirst({
        where: { student_id: studentId, time_slot_id: timeSlotId },
        select: { booking_id: true },
      });
      if (dup) throw new Error("คุณได้จองช่วงเวลานี้ไปแล้ว");

      // 4) create booking (ผูก time_slot_id ตรง ๆ)
      const b = await tx.booking.create({
        data: {
          student_id: studentId,
          time_slot_id: timeSlotId, // ✅ สำคัญมาก
          problem_category_id: problemCategoryId,
          booking_detail_text: detailText,
          booking_status: "PENDING_ASSIGNMENT",
        },
      });

      // 5) อัปเดตสถานะ time slot หลังจอง
      const newBookedCount = bookedCount + 1;
      await tx.timeSlot.update({
        where: { time_slot_id: timeSlotId },
        data: {
          time_slot_status: newBookedCount >= maxCapacity ? "BOOKED" : "AVAILABLE",
        },
      });

      return b;
    });

    return NextResponse.json({ success: true, bookingId: booking.booking_id });
  } catch (err: any) {
    console.error(err);

    const message =
      err?.message && typeof err.message === "string"
        ? err.message
        : "Failed to create booking";

    // ถ้าเป็น error จาก logic (throw new Error) ให้ส่ง 400 จะเหมาะกว่า
    const statusCode =
      message.includes("เต็มแล้ว") ||
      message.includes("จอง") ||
      message.includes("ไม่สามารถจอง") ||
      message.includes("ไม่ได้เปิดรับจอง")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
