import prisma from "@/lib/prisma";

export const HeadConsultantService = {
  // ──────────────────────────────────────────
  // 1️⃣  Booking Stats — นับ booking แยก status
  // ──────────────────────────────────────────
  async getBookingStats(universityId: number, options?: { startDate?: Date; endDate?: Date }) {


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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        _count: { select: { feedbacks: feedbackFilter.feedback_created_at ? { where: feedbackFilter } : true } },
      },
    });

    // Batch avg rating via raw SQL
    const cIds = consultants.map(c => c.consultant_id);
    const avgMap = cIds.length > 0
      ? await (async () => {
          // Build date filter for raw SQL
          let dateClause = '';
          const params: any[] = [cIds];
          if (options?.startDate) {
            dateClause += ` AND f.feedback_created_at >= $2`;
            params.push(options.startDate);
          }
          if (options?.endDate) {
            const idx = params.length + 1;
            dateClause += ` AND f.feedback_created_at <= $${idx}`;
            params.push(options.endDate);
          }
          const results = await prisma.$queryRawUnsafe<Array<{ consultant_id: number; avg_rating: number; cnt: number }>>(
            `SELECT f.consultant_id, AVG(fr.feedback_rating_score)::float AS avg_rating, COUNT(DISTINCT f.feedback_id)::int AS cnt
             FROM feedback_rating fr
             JOIN feedback f ON f.feedback_id = fr.feedback_id
             WHERE f.consultant_id = ANY($1) ${dateClause}
             GROUP BY f.consultant_id`,
            ...params
          );
          return new Map(results.map(r => [r.consultant_id, { avg: Math.round(r.avg_rating * 100) / 100, count: r.cnt }]));
        })()
      : new Map<number, { avg: number; count: number }>();

    return consultants.map((c) => {
      const info = avgMap.get(c.consultant_id);
      return {
        consultantId: c.consultant_id,
        firstName: c.profile?.consultant_first_name ?? "-",
        lastName: c.profile?.consultant_last_name ?? "-",
        prefix: c.profile?.consultant_prefix ?? "",
        feedbackCount: info?.count ?? 0,
        avgRating: info?.avg ?? 0,
      };
    });
  },

  // ──────────────────────────────────────────
  // 5️⃣  Team Overview — consultants + active bookings + real ratings
  // ──────────────────────────────────────────
  async getTeamOverview(universityId: number, options?: { startDate?: Date; endDate?: Date }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingFilter: any = {
      booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        _count: { select: { feedbacks: feedbackFilter.feedback_created_at ? { where: feedbackFilter } : true } },
      },
    });

    // Batch avg rating via raw SQL
    const cIds = consultants.map(c => c.consultant_id);
    const avgMap = cIds.length > 0
      ? await (async () => {
          const results = await prisma.$queryRaw<Array<{ consultant_id: number; avg_rating: number }>>`
            SELECT f.consultant_id, AVG(fr.feedback_rating_score)::float AS avg_rating
            FROM feedback_rating fr
            JOIN feedback f ON f.feedback_id = fr.feedback_id
            WHERE f.consultant_id = ANY(${cIds})
            GROUP BY f.consultant_id
          `;
          return new Map(results.map(r => [r.consultant_id, Math.round(r.avg_rating * 10) / 10]));
        })()
      : new Map<number, number>();

    return consultants.map((c) => {
      const avgRating = avgMap.get(c.consultant_id) ?? 0;

      return {
        consultantId: c.consultant_id,
        prefix: c.profile?.consultant_prefix ?? "",
        firstName: c.profile?.consultant_first_name ?? "-",
        lastName: c.profile?.consultant_last_name ?? "-",
        activeBookings: (c.bookings ?? []).length,
        avgRating,
        feedbackCount: c._count.feedbacks,
        specializations: (c.specializations ?? []).map(
          (s) => s.consultant_specialization_topic
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
