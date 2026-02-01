// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export type MyBookingDTO = {
  id: number;
  status: string;
  problemType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  bookingDetailText: string | null;
  studentName?: string | null;
  hasFeedback: boolean;
};

type RoleForMyBookings = "STUDENT" | "CONSULTANT" | "HEAD_CONSULTANT";

export async function getMyBookings(params: {
  accountId: number;
  activeUniversityId: number;
  role: RoleForMyBookings;
}): Promise<MyBookingDTO[]> {
  const { accountId, activeUniversityId, role } = params;

  const whereBase = { university_id: activeUniversityId };
  let where: any = whereBase;

  if (role === "STUDENT") {
    // ✅ lookup student_id แบบชัวร์
    const student = await prisma.student.findFirst({
      where: {
        account_id: accountId,
        university_id: activeUniversityId,
      },
      select: { student_id: true },
    });

    if (!student) return [];

    where = {
      ...whereBase,
      student_id: student.student_id,
    };
  } else {
    const consultant = await prisma.consultant.findFirst({
      where: {
        account_id: accountId,
        university_id: activeUniversityId,
      },
      select: { consultant_id: true },
    });

    if (!consultant) return [];

    where = {
      ...whereBase,
      consultant_id: consultant.consultant_id,
      booking_status: {
        in: [
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
        ],
      },
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      problemCategory: true,
      timeSlot: true,
      feedback: { select: { feedback_id: true } },

      student: {
        select: {
          profile: {
            select: {
              student_first_name_th: true,
              student_last_name_th: true,
            },
          },
        },
      },
    },
    orderBy: { booking_created_at: "desc" },
  });

  return bookings.map((b) => {
    const slot = b.timeSlot;

    const fullName = b.student?.profile
      ? `${b.student.profile.student_first_name_th} ${b.student.profile.student_last_name_th}`
      : null;

    return {
      id: b.booking_id,
      status: b.booking_status,
      problemType: b.problemCategory?.problem_category_name_th ?? null,
      createdAt: b.booking_created_at ? b.booking_created_at.toISOString() : null,
      updatedAt: b.booking_updated_at ? b.booking_updated_at.toISOString() : null,

      date: slot?.time_slot_start_datetime
        ? slot.time_slot_start_datetime.toISOString().slice(0, 10)
        : null,
      startTime: slot?.time_slot_start_datetime
        ? slot.time_slot_start_datetime.toTimeString().slice(0, 5)
        : null,
      endTime: slot?.time_slot_end_datetime
        ? slot.time_slot_end_datetime.toTimeString().slice(0, 5)
        : null,

      bookingDetailText: b.booking_detail_text ?? null,

      // ✅ student ไม่ต้องเห็นชื่อนิสิต
      studentName: role === "STUDENT" ? undefined : fullName,

      hasFeedback: Boolean(b.feedback?.feedback_id),
    };
  });
}
