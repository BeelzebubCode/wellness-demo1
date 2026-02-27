// src/services/booking/handlers/getMyBookings.ts
import prisma from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

type RoleForMyBookings = "STUDENT" | "CONSULTANT" | "HEAD_CONSULTANT";

interface GetMyBookingsParams {
  accountId: number;
  activeUniversityId: number;
  role: RoleForMyBookings;
  page?: number;     // 1-based index
  limit?: number;    // default 10 or 50
  statusGroup?: "ALL" | "ACTIVE" | "HISTORY";
}

export async function getMyBookings(params: GetMyBookingsParams) {
  const { accountId, activeUniversityId, role, page = 1, limit = 50, statusGroup = "ALL" } = params;

  // Pagination logic
  const p = Math.max(1, page);
  const l = Math.max(1, Math.min(limit, 100)); // cap at 100
  const skip = (p - 1) * l;

  // Determine filtering status
  let statusFilter: any = undefined;
  if (statusGroup === "ACTIVE") {
    statusFilter = {
      in: [BookingStatus.PENDING_ASSIGNMENT, BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS],
    };
  } else if (statusGroup === "HISTORY") {
    statusFilter = {
      in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    };
  }

  // ---------------- STUDENT ----------------
  if (role === "STUDENT") {
    const student = await prisma.student.findFirst({
      where: { account_id: accountId, university_id: activeUniversityId },
      select: { student_id: true },
    });
    if (!student) return { items: [], total: 0 };

    const where: any = {
      university_id: activeUniversityId,
      student_id: student.student_id,
    };
    if (statusFilter) {
      where.booking_status = statusFilter;
    }

    const [total, bookings, trustStatus, pendingGlobalException] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          problemCategory: true,
          timeSlot: true,
          BookingSession: { include: { onlineChannel: true } },
          onlineChannel: true,
          feedback: { select: { feedback_id: true } },
          exceptionRequest: { select: { booking_exception_request_id: true, booking_exception_status: true, booking_exception_decision_note: true } },
          attendance: true,
        },
        orderBy: { booking_created_at: "desc" },
        skip,
        take: l,
      }),
      prisma.studentBehaviorStatus.findUnique({
        where: {
          university_id_student_id: {
            university_id: activeUniversityId,
            student_id: student.student_id,
          }
        }
      }),
      prisma.bookingExceptionRequest.findFirst({
        where: {
          university_id: activeUniversityId,
          student_id: student.student_id,
          booking_exception_status: "PENDING_REVIEW",
        },
        select: { booking_exception_request_id: true },
      })
    ]);

    const items = bookings.map((b) => {
      const slot = b.timeSlot;
      const sess = b.BookingSession;

      const session = sess ? {
        mode: sess.booking_session_mode ?? b.booking_service_mode,
        onlineChannel: (() => {
          const ch = sess.onlineChannel ?? b.onlineChannel;
          return ch ? { id: ch.online_channel_category_id, code: ch.online_channel_code, nameTh: ch.online_channel_name_th, nameEn: ch.online_channel_name_en } : null;
        })(),
        joinUrl: sess.booking_session_join_url ?? null,
        phoneNumber: sess.booking_session_phone_number ?? null,
        extraDetail: sess.booking_session_extra_detail ?? null,
        providedAt: sess.provided_at?.toISOString() ?? null,
        providedByName: null,
      } : null;

      return {
        bookingId: b.booking_id,
        universityId: b.university_id,
        status: b.booking_status,
        serviceMode: b.booking_service_mode ?? "IN_PERSON",
        onlineChannel: (() => {
          const ch = sess?.onlineChannel ?? b.onlineChannel;
          return ch ? { id: ch.online_channel_category_id, code: ch.online_channel_code, nameTh: ch.online_channel_name_th, nameEn: ch.online_channel_name_en } : null;
        })(),
        startAt: slot?.time_slot_start_datetime?.toISOString() ?? "",
        endAt: slot?.time_slot_end_datetime?.toISOString() ?? "",
        problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,
        consultantId: b.consultant_id ?? null,
        consultantName: null,
        consultantOrg: null,
        session,
        hasFeedback: !!(b as any).feedback,
        hasExceptionRequest: !!(b as any).exceptionRequest,
        exceptionRequestStatus: (b as any).exceptionRequest?.booking_exception_status ?? null,
        exceptionRequestNote: (b as any).exceptionRequest?.booking_exception_decision_note ?? null,
        attendanceStatus: (b as any).attendance?.booking_attendance_status ?? null,
        attendanceNote: (b as any).attendance?.booking_attendance_note ?? null,
        attendanceLateMinutes: (b as any).attendance?.booking_attendance_late_minutes ?? null,
      };
    });

    return { items, total, trustStatus, hasPendingGlobalException: !!pendingGlobalException };
  }

  // ---------------- CONSULTANT / HEAD_CONSULTANT ----------------
  const consultant = await prisma.consultant.findFirst({
    where: { account_id: accountId },
    select: { consultant_id: true, university_id: true },
  });
  if (!consultant) return { items: [], total: 0 };

  const where: any = {
    university_id: activeUniversityId,
    // Base status constraints for consultants seeing their work
    booking_status: statusFilter || {
      // logic for consultant default view if ALL? usually they only see assigned/inprogress/completed
      // but here we adhere to statusGroup request if provided.
      // If no group provided, fallback to "My Work" logic: assigned+
      in: [BookingStatus.ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED],
    },
    OR: [
      { consultant_id: consultant.consultant_id },
      {
        assignments: {
          some: {
            consultant_id: consultant.consultant_id,
            consultant_university_id: consultant.university_id,
          },
        },
      },
    ],
  };

  // If statusGroup is explicitly ALL, maybe we want to see PENDING too?
  // But generally consultants only see what's assigned.
  // We'll trust the statusFilter if present, else default.

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        problemCategory: true,
        timeSlot: true,
        student: { include: { profile: true } },
        BookingSession: { include: { onlineChannel: true } },
        onlineChannel: true,
        university: { select: { university_name_th: true, university_code: true } },
        attendance: true,
      },
      orderBy: { booking_updated_at: "desc" },
      skip,
      take: l,
    }),
  ]);

  const items = bookings.map((b) => {
    const slot = b.timeSlot;
    const sp = b.student?.profile;
    const sess = b.BookingSession;

    const session = sess ? {
      mode: sess.booking_session_mode ?? b.booking_service_mode,
      onlineChannel: (() => {
        const ch = sess.onlineChannel ?? b.onlineChannel;
        return ch ? { id: ch.online_channel_category_id, code: ch.online_channel_code, nameTh: ch.online_channel_name_th, nameEn: ch.online_channel_name_en } : null;
      })(),
      joinUrl: sess.booking_session_join_url ?? null,
      phoneNumber: sess.booking_session_phone_number ?? null,
      extraDetail: sess.booking_session_extra_detail ?? null,
      providedAt: sess.provided_at?.toISOString() ?? null,
      providedByName: null,
    } : null;

    return {
      bookingId: b.booking_id,
      universityId: b.university_id,
      universityName: b.university?.university_name_th ?? null,
      universityCode: b.university?.university_code ?? null,
      status: b.booking_status,
      serviceMode: b.booking_service_mode ?? "IN_PERSON",
      onlineChannel: (() => {
        const ch = sess?.onlineChannel ?? b.onlineChannel;
        return ch ? { id: ch.online_channel_category_id, code: ch.online_channel_code, nameTh: ch.online_channel_name_th, nameEn: ch.online_channel_name_en } : null;
      })(),
      startAt: slot?.time_slot_start_datetime?.toISOString() ?? "",
      endAt: slot?.time_slot_end_datetime?.toISOString() ?? "",
      problemCategoryNameTh: b.problemCategory?.problem_category_name_th ?? null,
      consultantId: b.consultant_id ?? null,
      consultantName: null,
      studentName: sp ? `${sp.student_first_name_th} ${sp.student_last_name_th}` : "ไม่ทราบชื่อ",
      consultantOrg: null,
      session,
      attendanceStatus: (b as any).attendance?.booking_attendance_status ?? null,
      attendanceNote: (b as any).attendance?.booking_attendance_note ?? null,
      attendanceLateMinutes: (b as any).attendance?.booking_attendance_late_minutes ?? null,
    };
  });

  return { items, total };
}
