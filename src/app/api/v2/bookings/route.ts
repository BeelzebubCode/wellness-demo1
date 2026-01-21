// src/app/api/v2/bookings/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";
import { requireTenant, assertRole } from "@/lib/tenant";

/* =========================
   GET /api/v2/bookings
   - tenant-safe (filter university_id)
   - role-safe:
     - STUDENT: เห็นเฉพาะของตัวเอง
     - CONSULTANT: เห็นเฉพาะของตัวเอง
     - STAFF: เห็นทั้งมหาลัย (ตาม activeUniversityId)
   ========================= */
export async function GET(request: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(request);

    assertRole(account.role, [
      "STUDENT",
      "CONSULTANT",
      "HEAD_CONSULTANT",
      "ADMIN",
      "SUPER_ADMIN",
      "RECTOR",
    ]);

    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") as BookingStatus | null;
    const studentUsername = searchParams.get("student");
    const consultantId = searchParams.get("consultantId");
    const date = searchParams.get("date"); // yyyy-mm-dd

    // ✅ tenant filter ตั้งต้น
    const where: any = {
      university_id: activeUniversityId,
    };

    if (status) where.booking_status = status;

    // ✅ filter consultantId (เฉพาะ staff ใช้ได้ / student ไม่ควรใช้)
    if (consultantId && account.role !== "STUDENT") {
      where.consultant_id = Number(consultantId);
    }

    // ✅ filter ตามวันที่ (Booking -> timeSlot)
    if (date) {
      where.timeSlot = {
        time_slot_start_datetime: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59.999`),
        },
      };
    }

    // ✅ role scope กันข้อมูลหลุด
    if (account.role === "STUDENT") {
      if (!account.studentId) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
      }
      where.student_id = account.studentId;
    }

    if (account.role === "CONSULTANT") {
      if (!account.consultantId) {
        return NextResponse.json({ error: "Consultant profile not found" }, { status: 400 });
      }
      where.consultant_id = account.consultantId;
    }

    // ✅ staff-only: filter by student username (ต้องกรองมหาลัยด้วย)
    if (studentUsername && account.role !== "STUDENT") {
      const student = await prisma.student.findFirst({
        where: {
          university_id: activeUniversityId,
          account: { account_username: studentUsername },
        },
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
        timeSlot: true,
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
        universityId: b.university_id, // ✅ v2: ใส่ไว้ debug/ใช้ใน admin

        // alias สำหรับหน้า /admin/bookings
        userName: studentProfile
          ? `${studentProfile.student_first_name} ${studentProfile.student_last_name}`
          : "ไม่ทราบชื่อ",
        lineUserId: b.student.account.account_line_id ?? "-",
        problemDescription: b.booking_detail_text ?? null,

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
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch bookings" }, { status: err?.status ?? 500 });
  }
}

/* =========================
   POST /api/v2/bookings
   - tenant-safe: create ต้องใส่ university_id
   - validate: student + slot ต้องอยู่มหาลัยเดียวกัน
   ========================= */
export async function POST(request: NextRequest) {
  try {
    const { account, activeUniversityId } = await requireTenant(request);

    assertRole(account.role, ["STUDENT"]);

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

    // ✅ โหลด student เพื่อกัน token เพี้ยน + เช็ค tenant
    const student = await prisma.student.findUnique({
      where: { student_id: account.studentId },
      select: { student_id: true, university_id: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 400 });
    }

    if (student.university_id !== activeUniversityId) {
      return NextResponse.json({ error: "University mismatch" }, { status: 403 });
    }

    const ACTIVE_STATUSES: BookingStatus[] = ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"];

    // ✅ กัน 1 คนมีได้ 1 booking active (tenant-safe)
    const existing = await prisma.booking.findFirst({
      where: {
        university_id: activeUniversityId,
        student_id: student.student_id,
        booking_status: { in: ACTIVE_STATUSES },
      },
      select: { booking_id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "มีการจองที่ยังไม่เสร็จสิ้นอยู่แล้ว" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // 1) อ่าน slot เพื่อเช็ค tenant + status + capacity
      const timeSlot = await tx.timeSlot.findUnique({
        where: { time_slot_id: timeSlotId },
        select: {
          time_slot_id: true,
          university_id: true, // ✅ เช็ค tenant
          time_slot_max_capacity: true,
          time_slot_status: true,
        },
      });

      if (!timeSlot) throw new Error("ไม่พบช่วงเวลานี้ในระบบ");

      if (timeSlot.university_id !== activeUniversityId) {
        throw new Error("ช่วงเวลานี้เป็นของมหาลัยอื่น");
      }

      const maxCapacity = Number(timeSlot.time_slot_max_capacity ?? 0);
      if (!maxCapacity || maxCapacity <= 0) throw new Error("ช่วงเวลานี้ไม่ได้เปิดรับจอง");

      const slotStatus = String(timeSlot.time_slot_status || "").toUpperCase();
      if (slotStatus === "LOCKED" || slotStatus === "CANCELLED") {
        throw new Error("ช่วงเวลานี้ไม่สามารถจองได้");
      }

      // 2) นับจำนวน booking active ใน slot นี้ (tenant-safe)
      const bookedCount = await tx.booking.count({
        where: {
          university_id: activeUniversityId,
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

      // 3) กันจองซ้ำ
      const dup = await tx.booking.findFirst({
        where: {
          university_id: activeUniversityId,
          student_id: student.student_id,
          time_slot_id: timeSlotId,
        },
        select: { booking_id: true },
      });
      if (dup) throw new Error("คุณได้จองช่วงเวลานี้ไปแล้ว");

      // 4) create booking (✅ ใส่ university_id)
      const b = await tx.booking.create({
        data: {
          university_id: activeUniversityId,
          student_id: student.student_id,
          time_slot_id: timeSlotId,
          problem_category_id: problemCategoryId,
          booking_detail_text: detailText,
          booking_status: "PENDING_ASSIGNMENT",
          consultant_id: null,
        },
      });

      // 5) อัปเดตสถานะ slot
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

    const statusCode =
      message.includes("เต็มแล้ว") ||
      message.includes("จอง") ||
      message.includes("ไม่สามารถจอง") ||
      message.includes("ไม่ได้เปิดรับจอง") ||
      message.includes("มหาลัยอื่น")
        ? 400
        : err?.status ?? 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
