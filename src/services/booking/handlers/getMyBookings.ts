// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type RoleForMyBookings = "STUDENT" | "CONSULTANT" | "HEAD_CONSULTANT";

function toYMD(d?: Date | null) {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

function toHHMM(d?: Date | null) {
  if (!d) return null;
  return d.toTimeString().slice(0, 5);
}

export async function getMyBookings(params: {
  accountId: number;
  activeUniversityId: number;
  role: RoleForMyBookings;
}) {
  const { accountId, activeUniversityId, role } = params;

  // ---------------- STUDENT ----------------
  if (role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { account_id: accountId, university_id: activeUniversityId },
      select: { student_id: true },
    });
    if (!student) return [];

    const bookings = await prisma.booking.findMany({
      where: {
        university_id: activeUniversityId,
        student_id: student.student_id,
      },
      include: {
        problemCategory: true,
        timeSlot: true,
      },
      orderBy: { booking_created_at: "desc" },
    });

    return bookings.map((b) => {
      const slot = b.timeSlot;

      return {
        // ✅ FE expects
        id: b.booking_id,
        universityId: b.university_id,
        status: b.booking_status,

        date: toYMD(slot?.time_slot_start_datetime ?? null),
        startTime: toHHMM(slot?.time_slot_start_datetime ?? null),
        endTime: toHHMM(slot?.time_slot_end_datetime ?? null),

        // student มองของตัวเอง ไม่ต้องมี studentName ก็ได้ แต่ใส่ไว้กัน FE ใช้ร่วม
        studentName: null,

        problemType: b.problemCategory?.problem_category_name_th ?? null,
        bookingDetailText: b.booking_detail_text ?? null,

        createdAt: b.booking_created_at.toISOString(),
        updatedAt: b.booking_updated_at.toISOString(),

        serviceMode: b.booking_service_mode ?? null,

        // ✅ ปรับชื่อให้ FE ใช้ตรง ๆ
        onlineChannelUrl: (b as any).booking_online_channel_url ?? b.booking_online_channel ?? null,
        onlineChannelNote: (b as any).booking_online_channel_note ?? null,
      };
    });
  }

  // ---------------- CONSULTANT / HEAD_CONSULTANT ----------------
  // ✅ หา consultant ของ account นี้
  const consultant = await prisma.consultant.findFirst({
    where: { account_id: accountId },
    select: { consultant_id: true },
  });
  if (!consultant) return [];

  // ✅ ดึง “งานของฉัน” จาก booking ตรง ๆ (ชัวร์สุด)
  //   - ต้องเป็น tenant นี้
  //   - consultant_id ตรงกับตัวเอง
  //   - สถานะที่ consultant ต้องเห็น
  const bookings = await prisma.booking.findMany({
    where: {
      university_id: activeUniversityId,
      consultant_id: consultant.consultant_id,
      booking_status: {
        in: [
          BookingStatus.ASSIGNED,
          BookingStatus.IN_PROGRESS,
          BookingStatus.COMPLETED,
          // ถ้าอยากให้เห็น CANCELLED ด้วย ก็ใส่เพิ่มได้
          // BookingStatus.CANCELLED,
        ],
      },
    },
    include: {
      problemCategory: true,
      timeSlot: true,
      student: { include: { profile: true } },
    },
    orderBy: { booking_updated_at: "desc" },
  });

  return bookings.map((b) => {
    const slot = b.timeSlot;
    const sp = b.student?.profile;

    const studentName = sp
      ? `${sp.student_first_name_th ?? ""} ${sp.student_last_name_th ?? ""}`.trim() || null
      : null;

    return {
      // ✅ FE expects
      id: b.booking_id,
      universityId: b.university_id,
      status: b.booking_status,

      date: toYMD(slot?.time_slot_start_datetime ?? null),
      startTime: toHHMM(slot?.time_slot_start_datetime ?? null),
      endTime: toHHMM(slot?.time_slot_end_datetime ?? null),

      studentName,

      problemType: b.problemCategory?.problem_category_name_th ?? null,
      bookingDetailText: b.booking_detail_text ?? null,

      createdAt: b.booking_created_at.toISOString(),
      updatedAt: b.booking_updated_at.toISOString(),

      serviceMode: b.booking_service_mode ?? null,

      // ✅ ให้ตรงกับ FE
      onlineChannelUrl: (b as any).booking_online_channel_url ?? b.booking_online_channel ?? null,
      onlineChannelNote: (b as any).booking_online_channel_note ?? null,
    };
  });
}
