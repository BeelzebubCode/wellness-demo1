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
      where: { university_id: activeUniversityId, student_id: student.student_id },
      include: {
        problemCategory: true,
        timeSlot: true,

        // ✅ หลังแก้ schema Booking.consultant -> relation ด้วย consultant_id อย่างเดียว
        consultant: { include: { profile: true, organization: true } },

        BookingSession: {
          include: { providedBy: { select: { account_username: true } } },
        },
      },
      orderBy: { booking_created_at: "desc" },
    });

    return bookings.map((b) => {
      const slot = b.timeSlot;

      const cp = b.consultant?.profile;
      const consultantName = cp
        ? `${cp.consultant_first_name} ${cp.consultant_last_name}`.trim()
        : null;

      const session = b.BookingSession
        ? {
            mode: b.BookingSession.booking_session_mode,
            onlineChannel: b.BookingSession.booking_session_online_channel ?? null,
            joinUrl: b.BookingSession.booking_session_join_url ?? null,
            phoneNumber: b.BookingSession.booking_session_phone_number ?? null,
            locationText: b.BookingSession.booking_session_location_text ?? null,
            extraDetail: b.BookingSession.booking_session_extra_detail ?? null,
            providedAt: b.BookingSession.provided_at
              ? b.BookingSession.provided_at.toISOString()
              : null,
            providedByName: b.BookingSession.providedBy?.account_username ?? null,
          }
        : null;

      return {
        bookingId: b.booking_id,
        universityId: b.university_id,
        status: b.booking_status,
        serviceMode: b.booking_service_mode,
        onlineChannel: b.booking_online_channel ?? null,
        startAt: slot?.time_slot_start_datetime
          ? slot.time_slot_start_datetime.toISOString()
          : "",
        endAt: slot?.time_slot_end_datetime
          ? slot.time_slot_end_datetime.toISOString()
          : "",
        problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,

        consultantId: b.consultant_id ?? null,
        consultantName,
        consultantOrg: b.consultant?.organization?.organization_name ?? null,

        session,
      };
    });
  }

  // ---------------- CONSULTANT / HEAD_CONSULTANT ----------------
  // ✅ FIX: อย่าผูกกับ activeUniversityId (เวลา consultant ไปดู tenant อื่น จะหาไม่เจอ)
  const consultant = await prisma.consultant.findUnique({
    where: { account_id: accountId },
    select: { consultant_id: true },
  });
  if (!consultant) return [];

  const assigns = await prisma.bookingAssignment.findMany({
    where: {
      university_id: activeUniversityId,
      consultant_id: consultant.consultant_id,
      booking: {
        booking_status: {
          in: [
            BookingStatus.ASSIGNED,
            BookingStatus.IN_PROGRESS,
            BookingStatus.COMPLETED,
          ],
        },
      },
    },
    include: {
      booking: {
        include: {
          problemCategory: true,
          timeSlot: true,
          student: { include: { profile: true } },
          BookingSession: {
            include: { providedBy: { select: { account_username: true } } },
          },

          // ✅ เอาชื่อ consultant + org (ทำงานถูกหลังแก้ schema Booking.consultant)
          consultant: { include: { profile: true, organization: true } },
        },
      },
    },
    orderBy: { assigned_at: "desc" },
  });

  return assigns.map((a) => {
    const b = a.booking;
    const slot = b.timeSlot;

    const sp = b.student?.profile;
    const studentName = sp
      ? `${sp.student_first_name_th} ${sp.student_last_name_th}`.trim()
      : null;

    const cp = b.consultant?.profile;
    const consultantName = cp
      ? `${cp.consultant_first_name} ${cp.consultant_last_name}`.trim()
      : null;

    const session = b.BookingSession
      ? {
          mode: b.BookingSession.booking_session_mode,
          onlineChannel: b.BookingSession.booking_session_online_channel ?? null,
          joinUrl: b.BookingSession.booking_session_join_url ?? null,
          phoneNumber: b.BookingSession.booking_session_phone_number ?? null,
          locationText: b.BookingSession.booking_session_location_text ?? null,
          extraDetail: b.BookingSession.booking_session_extra_detail ?? null,
          providedAt: b.BookingSession.provided_at
            ? b.BookingSession.provided_at.toISOString()
            : null,
          providedByName: b.BookingSession.providedBy?.account_username ?? null,
        }
      : null;

    return {
      bookingId: b.booking_id,
      universityId: b.university_id,
      status: b.booking_status,
      serviceMode: b.booking_service_mode,
      onlineChannel: b.booking_online_channel ?? null,
      startAt: slot?.time_slot_start_datetime
        ? slot.time_slot_start_datetime.toISOString()
        : "",
      endAt: slot?.time_slot_end_datetime
        ? slot.time_slot_end_datetime.toISOString()
        : "",
      problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,

      consultantId: b.consultant_id ?? null, // ✅ ไม่ hardcode
      consultantName,
      consultantOrg: b.consultant?.organization?.organization_name ?? null,

      studentName,
      session,
    };
  });
}
