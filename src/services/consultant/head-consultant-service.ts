import prisma from "@/lib/prisma";

export const HeadConsultantService = {
  // ──────────────────────────────────────────
  // 1️⃣  Booking Stats — นับ booking แยก status
  // ──────────────────────────────────────────
  async getBookingStats(universityId: number, options?: { startDate?: Date; endDate?: Date }) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dateFilter = options?.startDate || options?.endDate ? {
      booking_created_at: {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      }
    } : {};

    const [pending, assigned, inProgress, completed, cancelled, totalInPeriod] =
      await Promise.all([
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "PENDING_ASSIGNMENT", ...dateFilter },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "ASSIGNED", ...dateFilter },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "IN_PROGRESS", ...dateFilter },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "COMPLETED", ...dateFilter },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "CANCELLED", ...dateFilter },
        }),
        prisma.booking.count({
          where: {
            university_id: universityId,
            ...dateFilter,
          },
        }),
      ]);

    return { 
      pending, 
      assigned, 
      inProgress, 
      completed, 
      cancelled, 
      totalThisMonth: totalInPeriod // Keep name for compatibility or update UI
    };
  },

  // ──────────────────────────────────────────
  // 2️⃣  Problem Category Distribution
  // ──────────────────────────────────────────
  async getProblemCategoryDistribution(universityId: number, options?: { startDate?: Date; endDate?: Date }) {
    const where: any = { university_id: universityId };
    
    if (options?.startDate || options?.endDate) {
      where.booking_created_at = {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      };
    }

    const groups = await prisma.booking.groupBy({
      by: ["problem_category_id"],
      where,
      _count: { booking_id: true },
      orderBy: { _count: { booking_id: "desc" } },
    });

    // Enrich with category names
    const categoryIds = groups.map((g) => g.problem_category_id);
    const categories = await prisma.problemCategory.findMany({
      where: { problem_category_id: { in: categoryIds } },
    });

    const catMap = new Map(
      categories.map((c) => [c.problem_category_id, c])
    );

    return groups.map((g) => ({
      categoryId: g.problem_category_id,
      code: catMap.get(g.problem_category_id)?.problem_category_code ?? "N/A",
      nameTh: catMap.get(g.problem_category_id)?.problem_category_name_th ?? "ไม่ระบุ",
      nameEn: catMap.get(g.problem_category_id)?.problem_category_name_en ?? null,
      count: g._count.booking_id,
    }));
  },

  // ──────────────────────────────────────────
  // 3️⃣  Top Students by Points (Points are cumulative, usually not date-filtered)
  // ──────────────────────────────────────────
  async getTopStudentsByPoints(universityId: number, limit = 10) {
    const wallets = await prisma.studentPointWallet.findMany({
      where: {
        university_id: universityId,
        student_point_balance: { gt: 0 },
      },
      orderBy: { student_point_balance: "desc" },
      take: limit,
      include: {
        student: {
          include: {
            profile: true,
            account: { select: { account_username: true } },
          },
        },
      },
    });

    return wallets.map((w, idx) => ({
      rank: idx + 1,
      studentId: w.student_id,
      studentCode: w.student.student_code,
      username: w.student.account.account_username,
      firstName: w.student.profile?.student_first_name_th ?? "-",
      lastName: w.student.profile?.student_last_name_th ?? "-",
      nickname: w.student.profile?.student_nickname_th ?? null,
      points: w.student_point_balance,
    }));
  },


  // ──────────────────────────────────────────
  // 4️⃣  Consultant Ratings
  // ──────────────────────────────────────────
  async getConsultantRatings(universityId: number, options?: { startDate?: Date; endDate?: Date }) {
    // Determine feedback date filter
    const feedbackFilter: any = {};
    if (options?.startDate || options?.endDate) {
      feedbackFilter.feedback_created_at = {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      };
    }

    // Get all consultants for this university (EXCLUDE HEAD)
    const consultants = await prisma.consultant.findMany({
      where: { 
        university_id: universityId,
        account: {
          account_role: { not: "HEAD_CONSULTANT" }
        }
      },
      include: {
        profile: true,
        feedbacks: {
          where: feedbackFilter,
          include: {
            ratings: true,
          },
        },
      },
    });

    return consultants.map((c) => {
      const allScores = c.feedbacks.flatMap((f) =>
        f.ratings.map((r) => r.feedback_rating_score)
      );
      const avgRating =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;

      return {
        consultantId: c.consultant_id,
        firstName: c.profile?.consultant_first_name ?? "-",
        lastName: c.profile?.consultant_last_name ?? "-",
        prefix: c.profile?.consultant_prefix ?? "",
        feedbackCount: c.feedbacks.length,
        avgRating: Math.round(avgRating * 100) / 100, // 2 decimal places
      };
    });
  },

  // ──────────────────────────────────────────
  // 5️⃣  Team Overview — consultants + active bookings + real ratings
  // ──────────────────────────────────────────
  async getTeamOverview(universityId: number, options?: { startDate?: Date; endDate?: Date }) {
    const bookingFilter: any = {
      booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    };

    const feedbackFilter: any = {};

    if (options?.startDate || options?.endDate) {
      const dateRange = {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      };
      bookingFilter.booking_created_at = dateRange;
      feedbackFilter.feedback_created_at = dateRange;
    }

    const consultants = await prisma.consultant.findMany({
      where: { 
        university_id: universityId,
        account: {
          account_role: { not: "HEAD_CONSULTANT" }
        }
      },
      include: {
        profile: true,
        account: { select: { account_role: true } },
        bookings: {
          where: bookingFilter,
          select: { booking_id: true, booking_created_at: true },
        },
        specializations: true,
        feedbacks: {
          where: feedbackFilter,
          include: { ratings: true }
        }
      },
    });

    return consultants.map((c: any) => {
      const allScores = c.feedbacks?.flatMap((f: any) =>
        f.ratings?.map((r: any) => r.feedback_rating_score)
      ) ?? [];
      
      const avgRating =
        allScores.length > 0
          ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length
          : 0;

      return {
        consultantId: c.consultant_id,
        prefix: c.profile?.consultant_prefix ?? "",
        firstName: c.profile?.consultant_first_name ?? "-",
        lastName: c.profile?.consultant_last_name ?? "-",
        activeBookings: (c.bookings ?? []).length,
        avgRating: Math.round(avgRating * 10) / 10,
        feedbackCount: (c.feedbacks ?? []).length,
        specializations: (c.specializations ?? []).map(
          (s: any) => s.consultant_specialization_topic
        ),
      };
    });
  },

  // ──────────────────────────────────────────
  // 6️⃣  Consultant Case History (with Pagination & Filter)
  // ──────────────────────────────────────────
  async getConsultantCaseHistory(
    universityId: number, 
    consultantId: number,
    options?: { startDate?: Date; endDate?: Date; skip?: number; take?: number }
  ) {
    const where: any = {
      consultant_university_id: universityId,
      consultant_id: consultantId,
    };

    if (options?.startDate || options?.endDate) {
      where.booking = {
        timeSlot: {
          time_slot_start_datetime: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        }
      };
    }

    const [assignments, total] = await Promise.all([
      prisma.bookingAssignment.findMany({
        where,
        include: {
          booking: {
            include: {
              student: {
                include: { profile: true },
              },
              problemCategory: true,
              outcome: true,
              timeSlot: true,
            },
          },
        },
        orderBy: { assigned_at: "desc" },
        skip: options?.skip ?? 0,
        take: options?.take ?? 10,
      }),
      prisma.bookingAssignment.count({ where })
    ]);

    const items = assignments.map((a) => {
      const b = a.booking;
      return {
        id: b.booking_id,
        status: b.booking_status,
        studentName: b.student.profile
          ? `${b.student.profile.student_first_name_th} ${b.student.profile.student_last_name_th}`.trim()
          : b.student.student_code ?? "Unknown Student",
        problemType: b.problemCategory?.problem_category_name_th ?? "N/A",
        date: b.timeSlot.time_slot_start_datetime.toISOString().split("T")[0],
        startTime: b.timeSlot.time_slot_start_datetime.toISOString().split("T")[1].substring(0, 5),
        endTime: b.timeSlot.time_slot_end_datetime.toISOString().split("T")[1].substring(0, 5),
        outcomeNote: b.outcome?.booking_outcome_consultant_note ?? null,
      };
    });

    return { items, total };
  },
};
