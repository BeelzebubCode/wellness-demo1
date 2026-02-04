// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type RoleForMyBookings = "STUDENT" | "CONSULTANT" | "HEAD_CONSULTANT";

export type MyBookingDto = {
  bookingId: number;
  universityId: number;

  status: BookingStatus;

  serviceMode: "ONSITE" | "ONLINE";
  onlineChannel?: string | null;

  startAt: string;
  endAt: string;

  problemCategoryNameTh?: string | null;

  consultantId?: number | null;
  consultantName?: string | null;
  consultantOrg?: string | null;

  session?: {
    mode: "ONSITE" | "ONLINE";
    onlineChannel?: string | null;

    joinUrl?: string | null;
    phoneNumber?: string | null;
    locationText?: string | null;
    extraDetail?: string | null;

    providedAt?: string | null;
    providedByName?: string | null;
  } | null;
};

export async function getMyBookings(params: {
  accountId: number;
  activeUniversityId: number;
  role: RoleForMyBookings;
}): Promise<MyBookingDto[]> {
  const { accountId, activeUniversityId, role } = params;

  const whereBase = { university_id: activeUniversityId };
  let where: any = whereBase;

  if (role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { account_id: accountId, university_id: activeUniversityId },
      select: { student_id: true },
    });
    if (!student) return [];

    where = { ...whereBase, student_id: student.student_id };
  } else {
    const consultant = await prisma.consultant.findFirst({
      where: { account_id: accountId, university_id: activeUniversityId },
      select: { consultant_id: true },
    });
    if (!consultant) return [];

    where = {
      ...whereBase,
      consultant_id: consultant.consultant_id,
      booking_status: {
        in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
      },
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      problemCategory: true,
      timeSlot: true,
      feedback: { select: { feedback_id: true } },

      consultant: {
        include: {
          profile: true,
          organization: true,
        },
      },

      // ✅ Online/Session info (consultant ส่งลิงก์/ช่องทาง)
      BookingSession: {
        include: {
          providedBy: { select: { account_username: true } },
        },
      },
    },
    orderBy: { booking_created_at: "desc" },
  });

  return bookings.map((b) => {
    const slot = b.timeSlot;

    const cp = b.consultant?.profile;
    const consultantName =
      cp ? `${cp.consultant_first_name} ${cp.consultant_last_name}` : null;

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
      endAt: slot?.time_slot_end_datetime ? slot.time_slot_end_datetime.toISOString() : "",

      problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,

      consultantId: b.consultant_id ?? null,
      consultantName,
      consultantOrg: b.consultant?.organization?.organization_name ?? null,

      session,
    };
  });
}
