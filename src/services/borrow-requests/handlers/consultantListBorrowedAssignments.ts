import prisma from "@/lib/prisma";

export async function consultantListBorrowedAssignments(input: {
  accountId: number;
}) {
  const consultant = await prisma.consultant.findUnique({
    where: { account_id: input.accountId },
    select: {
      consultant_id: true,
      university_id: true,
    },
  });

  if (!consultant) {
    throw new Error("CONSULTANT_NOT_FOUND");
  }

  const assignments = await prisma.borrowAssignment.findMany({
    where: {
      consultant_id: consultant.consultant_id,
    },
    include: {
      borrowRequest: {
        include: {
          fromUniversity: {
            select: {
              university_id: true,
              university_code: true,
              university_name_th: true,
              university_name_en: true,
            },
          },
        },
      },
      BookingAssignment: {
        select: {
          university_id: true,
          booking_id: true,
          assigned_at: true,
        },
        orderBy: { assigned_at: "desc" },
      },
    },
    orderBy: { borrow_assigned_at: "desc" },
  });

  const bookingKeys = assignments.flatMap((a) =>
    a.BookingAssignment.map((ba) => ({
      university_id: ba.university_id,
      booking_id: ba.booking_id,
    }))
  );

  const uniqueBookingKeyMap = new Map<string, { university_id: number; booking_id: number }>();
  for (const key of bookingKeys) {
    uniqueBookingKeyMap.set(`${key.university_id}:${key.booking_id}`, key);
  }
  const uniqueBookingKeys = [...uniqueBookingKeyMap.values()];

  const bookings = uniqueBookingKeys.length
    ? await prisma.booking.findMany({
        where: {
          OR: uniqueBookingKeys.map((k) => ({
            university_id: k.university_id,
            booking_id: k.booking_id,
          })),
        },
        select: {
          university_id: true,
          booking_id: true,
          booking_status: true,
          student_id: true,
          problemCategory: {
            select: {
              problem_category_name_th: true,
            },
          },
        },
      })
    : [];

  const bookingMap = new Map<string, (typeof bookings)[number]>();
  for (const booking of bookings) {
    bookingMap.set(`${booking.university_id}:${booking.booking_id}`, booking);
  }

  const studentIds = [...new Set(bookings.map((b) => b.student_id))];
  const [profiles, students] = await Promise.all([
    studentIds.length
      ? prisma.studentProfile.findMany({
          where: { student_id: { in: studentIds } },
          select: {
            student_id: true,
            student_first_name_th: true,
            student_last_name_th: true,
            student_nickname_th: true,
          },
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.student.findMany({
          where: { student_id: { in: studentIds } },
          select: {
            student_id: true,
            student_code: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const profileMap = new Map<number, (typeof profiles)[number]>();
  for (const p of profiles) profileMap.set(p.student_id, p);

  const studentCodeMap = new Map<number, string | null>();
  for (const s of students) studentCodeMap.set(s.student_id, s.student_code);

  return assignments.map((a) => ({
    assignmentId: a.borrow_assignment_id,
    borrowRequestId: a.borrow_request_id,
    title: a.borrowRequest.borrow_request_title,
    reason: a.borrowRequest.borrow_request_reason,
    fromUniversityId: a.borrowRequest.from_university_id,
    fromUniversityCode: a.borrowRequest.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: a.borrowRequest.fromUniversity?.university_name_th ?? "-",
    fromUniversityNameEn: a.borrowRequest.fromUniversity?.university_name_en ?? null,
    startAt: a.borrow_assign_start_at.toISOString(),
    endAt: a.borrow_assign_end_at.toISOString(),
    status: a.borrowRequest.borrow_request_status,
    assignedAt: a.borrow_assigned_at.toISOString(),
    submittedAt: a.borrowRequest.borrow_submitted_at?.toISOString() ?? null,
    createdAt: a.borrowRequest.borrow_request_created_at.toISOString(),
    note: null,
    assignedBookings: a.BookingAssignment.map((ba) => {
      const booking = bookingMap.get(`${ba.university_id}:${ba.booking_id}`);
      if (!booking) {
        return {
          bookingId: ba.booking_id,
          status: "UNKNOWN",
          assignedAt: ba.assigned_at.toISOString(),
          problemCategory: "ไม่ระบุ",
          studentName: "นิสิต",
        };
      }

      const profile = profileMap.get(booking.student_id);
      const studentCode = studentCodeMap.get(booking.student_id) ?? null;
      const studentName = profile
        ? `${profile.student_first_name_th} ${profile.student_last_name_th} (${profile.student_nickname_th || "-"})`
        : studentCode || "นิสิต";

      return {
        bookingId: ba.booking_id,
        status: booking.booking_status,
        assignedAt: ba.assigned_at.toISOString(),
        problemCategory: booking.problemCategory?.problem_category_name_th ?? "ไม่ระบุ",
        studentName,
      };
    }),
  }));
}
