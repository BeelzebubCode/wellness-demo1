// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type RoleForMyBookings = "STUDENT" | "CONSULTANT" | "HEAD_CONSULTANT";



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
        BookingSession: true, // ✅ ตรงตาม Prisma schema
      },
      orderBy: { booking_created_at: "desc" },
    });

    return bookings.map((b) => {
      const slot = b.timeSlot;
      const sess = b.BookingSession;

      // ✅ สร้าง session object จาก BookingSession relation
      const session = sess ? {
        mode: sess.booking_session_mode ?? b.booking_service_mode,
        onlineChannel: sess.booking_session_online_channel ?? b.booking_online_channel ?? null,
        joinUrl: sess.booking_session_join_url ?? null,
        extraDetail: sess.booking_session_extra_detail ?? null,
        providedAt: sess.provided_at?.toISOString() ?? null,
        providedByName: null,
      } : null;

      return {
        // ✅ ตรงตาม MyBookingDto type definition
        bookingId: b.booking_id,
        universityId: b.university_id,
        status: b.booking_status,

        serviceMode: b.booking_service_mode ?? "IN_PERSON",
        onlineChannel: sess?.booking_session_online_channel ?? b.booking_online_channel ?? null,

        // ⏰ ส่งเป็น ISO string timestamp
        startAt: slot?.time_slot_start_datetime?.toISOString() ?? "",
        endAt: slot?.time_slot_end_datetime?.toISOString() ?? "",

        problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,

        consultantId: b.consultant_id ?? null,
        consultantName: null, // student ไม่ต้องเห็นชื่อ consultant
        consultantOrg: null,

        session,
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
      BookingSession: true, // ✅ ตรงตาม Prisma schema
    },
    orderBy: { booking_updated_at: "desc" },
  });

  return bookings.map((b) => {
    const slot = b.timeSlot;
    const sp = b.student?.profile;
    const sess = b.BookingSession;

    const studentName = sp
      ? `${sp.student_first_name_th ?? ""} ${sp.student_last_name_th ?? ""}`.trim() || null
      : null;

    // ✅ สร้าง session object จาก BookingSession relation
    const session = sess ? {
      mode: sess.booking_session_mode ?? b.booking_service_mode,
      onlineChannel: sess.booking_session_online_channel ?? b.booking_online_channel ?? null,
      joinUrl: sess.booking_session_join_url ?? null,
      extraDetail: sess.booking_session_extra_detail ?? null,
      providedAt: sess.provided_at?.toISOString() ?? null,
      providedByName: null,
    } : null;

    return {
      // ✅ ตรงตาม MyBookingDto type definition
      bookingId: b.booking_id,
      universityId: b.university_id,
      status: b.booking_status,

      serviceMode: b.booking_service_mode ?? "IN_PERSON",
      onlineChannel: sess?.booking_session_online_channel ?? b.booking_online_channel ?? null,

      // ⏰ ส่งเป็น ISO string timestamp
      startAt: slot?.time_slot_start_datetime?.toISOString() ?? "",
      endAt: slot?.time_slot_end_datetime?.toISOString() ?? "",

      problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,

      consultantId: b.consultant_id ?? null,
      consultantName: null, // consultant เห็นของตัวเอง ไม่ต้องการชื่อตัวเอง
      consultantOrg: null,

      session,
    };
  });
}
