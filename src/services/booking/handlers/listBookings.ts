// src/services/booking/handlers/listBookings.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { AccountContext } from "@/lib/auth/context";
import { AccountRole, type BookingStatus } from "@prisma/client";
import { requireUniversity } from "@/lib/auth/guard";

function isStaff(role: AccountRole) {
  return role === "HEAD_CONSULTANT" || role === "SUPER_ADMIN" || role === "RECTOR";
}

// yyyy-mm-dd -> [start, nextDay)
function buildDayRange(date: string) {
  // กัน input แปลกๆ
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const start = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function handleListBookings(
  ctx: AccountContext & { activeUniversityId?: number; studentId?: number; consultantId?: number },
  input: {
    status?: BookingStatus | null;
    studentUsername?: string | null;
    consultantId?: number | null;
    date?: string | null; // yyyy-mm-dd
  },
) {
  const role = ctx.role as AccountRole;
  const activeUniversityId = (ctx as any).activeUniversityId as number | undefined;

  if (typeof activeUniversityId !== "number") {
    return NextResponse.json({ error: "activeUniversityId missing" }, { status: 400 });
  }

  // ✅ tenant guard ด้วย active uni
  const denied = requireUniversity(ctx as any, activeUniversityId);
  if (denied) return denied;

  // ✅ scope by role (ต้องมี id)
  if (role === "STUDENT" && !(ctx as any).studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 400 });
  }
  if (role === "CONSULTANT" && !(ctx as any).consultantId) {
    return NextResponse.json({ error: "Consultant profile not found" }, { status: 400 });
  }

  // ✅ ล็อก filter ที่ไม่ควรให้ role อื่นใช้
  const staff = isStaff(role);
  const safeInput = {
    status: input.status ?? null,
    date: input.date ?? null,
    consultantId: staff ? input.consultantId ?? null : null,
    studentUsername: staff ? (input.studentUsername?.trim() || null) : null,
  };

  const where: any = { university_id: activeUniversityId };

  if (safeInput.status) where.booking_status = safeInput.status;

  if (safeInput.date) {
    const range = buildDayRange(safeInput.date);
    if (!range) {
      return NextResponse.json({ error: "Invalid date (expected yyyy-mm-dd)" }, { status: 400 });
    }

    where.timeSlot = {
      time_slot_start_datetime: {
        gte: range.start,
        lt: range.end,
      },
    };
  }

  // ✅ role restriction
  if (role === "STUDENT") where.student_id = (ctx as any).studentId;
  if (role === "CONSULTANT") where.consultant_id = (ctx as any).consultantId;

  // ✅ staff filters
  if (staff) {
    if (typeof safeInput.consultantId === "number" && Number.isFinite(safeInput.consultantId)) {
      where.consultant_id = safeInput.consultantId;
    }

    if (safeInput.studentUsername) {
      const student = await prisma.student.findFirst({
        where: {
          university_id: activeUniversityId,
          account: { account_username: safeInput.studentUsername },
        },
        select: { student_id: true },
      });

      if (!student) return NextResponse.json({ success: true, bookings: [] });
      where.student_id = student.student_id;
    }
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
    const sp = b.student.profile;
    const cp = b.consultant?.profile;

    return {
      id: b.booking_id,
      status: b.booking_status,
      universityId: b.university_id,

      // ✅ สำคัญสำหรับปิดปุ่มแจกงาน
      consultantId: b.consultant_id,

      userName: sp ? `${sp.student_first_name} ${sp.student_last_name}` : "ไม่ทราบชื่อ",
      lineUserId: b.student.account.account_line_id ?? "-",
      problemDescription: b.booking_detail_text ?? null,
      problemType: b.problemCategory.problem_category_name_th,

      date: slot?.time_slot_start_datetime
        ? slot.time_slot_start_datetime.toISOString().split("T")[0]
        : null,
      startTime: slot?.time_slot_start_datetime
        ? slot.time_slot_start_datetime.toTimeString().slice(0, 5)
        : null,
      endTime: slot?.time_slot_end_datetime
        ? slot.time_slot_end_datetime.toTimeString().slice(0, 5)
        : null,

      consultant: cp
        ? { id: b.consultant_id!, name: `${cp.consultant_first_name} ${cp.consultant_last_name}` }
        : null,

      outcome: b.outcome ?? null,
      cancellation: b.cancellation ?? null,
    };
  });

  return NextResponse.json({ success: true, bookings: formatted });
}
