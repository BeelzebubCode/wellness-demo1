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
  async getProblemCategoryDistribution(universityId: number, options?: { startDate?: Date; endDate?: Date; riskLevels?: number[] }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { university_id: universityId };

    if (options?.startDate || options?.endDate) {
      where.booking_created_at = {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      };
    }
    if (options?.riskLevels && options.riskLevels.length > 0) {
      where.outcome = {
        risk_level_id: { in: options.riskLevels }
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
          roleCategory: { code: { not: "HEAD_CONSULTANT" } }
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
          roleCategory: { code: { not: "HEAD_CONSULTANT" } }
        }
      },
      include: {
        profile: true,
        account: { select: { roleCategory: { select: { code: true } } } },
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

  // ──────────────────────────────────────────
  // 7️⃣  Risk Level Distribution
  // ──────────────────────────────────────────
  async getRiskDistribution(universityId: number, options?: { startDate?: Date; endDate?: Date; serviceModes?: number[] }) {
    let dateClause = "";
    const params: any[] = [universityId];
    if (options?.startDate) {
      params.push(options.startDate);
      dateClause += ` AND b.booking_created_at >= $${params.length}`;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      dateClause += ` AND b.booking_created_at <= $${params.length}`;
    }
    if (options?.serviceModes && options.serviceModes.length > 0) {
      params.push(options.serviceModes);
      dateClause += ` AND b.service_mode_id = ANY($${params.length}::int[])`;
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ risk_level_id: number | null; label: string; color: string; count: bigint }>
    >(
      `SELECT
         bo.risk_level_id,
         COALESCE(rl.name_th, 'ไม่ระบุ') AS label,
         COALESCE(rl.color, '#94a3b8') AS color,
         COUNT(*)::int AS count
       FROM booking_outcome bo
       JOIN booking b ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
       LEFT JOIN risk_level_category rl ON rl.risk_level_id = bo.risk_level_id
       WHERE b.university_id = $1 ${dateClause}
       GROUP BY bo.risk_level_id, rl.name_th, rl.color, rl.sort_order
       ORDER BY COALESCE(rl.sort_order, 99)`,
      ...params
    );

    const distribution = rows.map((r) => ({
      riskLevelId: r.risk_level_id,
      label: r.label,
      color: r.color,
      count: Number(r.count),
    }));

    const highRiskCount = distribution
      .filter((d) => d.riskLevelId !== null && d.riskLevelId >= 4)
      .reduce((s, d) => s + d.count, 0);

    return { distribution, highRiskCount };
  },

  // ──────────────────────────────────────────
  // 8️⃣  Booking Trend (Weekly)
  // ──────────────────────────────────────────
  async getBookingTrend(universityId: number, options?: { startDate?: Date; endDate?: Date; serviceModes?: number[] }) {
    let dateClause = "";
    const params: any[] = [universityId];
    if (options?.startDate) {
      params.push(options.startDate);
      dateClause += ` AND b.booking_created_at >= $${params.length}`;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      dateClause += ` AND b.booking_created_at <= $${params.length}`;
    }
    if (options?.serviceModes && options.serviceModes.length > 0) {
      params.push(options.serviceModes);
      dateClause += ` AND b.service_mode_id = ANY($${params.length}::int[])`;
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ week: string; total: bigint; completed: bigint; cancelled: bigint }>
    >(
      `SELECT
         TO_CHAR(DATE_TRUNC('week', b.booking_created_at), 'YYYY-MM-DD') AS week,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE b.booking_status = 'COMPLETED')::int AS completed,
         COUNT(*) FILTER (WHERE b.booking_status = 'CANCELLED')::int AS cancelled
       FROM booking b
       WHERE b.university_id = $1 ${dateClause}
       GROUP BY DATE_TRUNC('week', b.booking_created_at)
       ORDER BY week`,
      ...params
    );

    return rows.map((r) => ({
      week: r.week,
      total: Number(r.total),
      completed: Number(r.completed),
      cancelled: Number(r.cancelled),
    }));
  },

  // ──────────────────────────────────────────
  // 9️⃣  Workload Balance
  // ──────────────────────────────────────────
  async getWorkloadBalance(universityId: number) {
    const consultants = await prisma.consultant.findMany({
      where: {
        university_id: universityId,
        account: { roleCategory: { code: { not: "HEAD_CONSULTANT" } } },
      },
      include: {
        profile: true,
        _count: {
          select: {
            bookings: {
              where: { booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] } },
            },
          },
        },
      },
    });

    return consultants
      .map((c) => ({
        consultantId: c.consultant_id,
        name: c.profile
          ? `${c.profile.consultant_prefix ?? ""} ${c.profile.consultant_first_name} ${c.profile.consultant_last_name}`.trim()
          : `Consultant #${c.consultant_id}`,
        activeCases: c._count.bookings,
      }))
      .sort((a, b) => b.activeCases - a.activeCases);
  },

  // ──────────────────────────────────────────
  // 🔟  Response Time Metrics
  // ──────────────────────────────────────────
  async getResponseTimeMetrics(universityId: number, options?: { startDate?: Date; endDate?: Date; riskLevels?: number[] }) {
    let filterClause = "";
    let completeFilterClause = "";
    const params: any[] = [universityId];
    if (options?.startDate) {
      params.push(options.startDate);
      filterClause += ` AND b.booking_created_at >= $${params.length}`;
      completeFilterClause += ` AND b.booking_created_at >= $${params.length}`;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      filterClause += ` AND b.booking_created_at <= $${params.length}`;
      completeFilterClause += ` AND b.booking_created_at <= $${params.length}`;
    }
    if (options?.riskLevels && options.riskLevels.length > 0) {
      params.push(options.riskLevels);
      filterClause += ` AND bo.risk_level_id = ANY($${params.length}::int[])`;
      completeFilterClause += ` AND bo.risk_level_id = ANY($${params.length}::int[])`;
    }

    // avg hours from creation to first assignment
    const assignTime = await prisma.$queryRawUnsafe<Array<{ avg_hours: number }>>(
      `SELECT COALESCE(AVG(ABS(EXTRACT(EPOCH FROM (ba.assigned_at - b.booking_created_at)))) / 3600, 0)::float AS avg_hours
       FROM booking_assignment ba
       JOIN booking b ON b.university_id = ba.university_id AND b.booking_id = ba.booking_id
       LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
       WHERE b.university_id = $1 AND ba.is_active = true ${filterClause}`,
      ...params
    );

    // avg hours from assignment to completion (handling duration)
    const completeTime = await prisma.$queryRawUnsafe<Array<{ avg_hours: number }>>(
      `SELECT COALESCE(AVG(ABS(EXTRACT(EPOCH FROM (bo.booking_outcome_recorded_at - ba.assigned_at)))) / 3600, 0)::float AS avg_hours
       FROM booking_outcome bo
       JOIN booking_assignment ba ON bo.university_id = ba.university_id AND bo.booking_id = ba.booking_id
       JOIN booking b ON b.university_id = bo.university_id AND b.booking_id = bo.booking_id
       WHERE b.university_id = $1 AND ba.is_active = true ${completeFilterClause}`,
      ...params
    );

    // count of pending bookings older than 48 hours
    const overdueResult = await prisma.booking.count({
      where: {
        university_id: universityId,
        booking_status: "PENDING_ASSIGNMENT",
        booking_created_at: { lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        // Risk levels filter applies if specified. Since pending bookings don't have outcome yet,
        // it's practically impossible to filter pending bookings by outcome risk.
        // We will just return all pending overdues, or ideally we skip filtering by risk for pending.
      },
    });

    return {
      avgAssignmentHours: Math.round((assignTime[0]?.avg_hours ?? 0) * 10) / 10,
      avgConsultationHours: Math.round((completeTime[0]?.avg_hours ?? 0) * 10) / 10,
      overdueCount: overdueResult,
    };
  },

  // ──────────────────────────────────────────
  // 1️⃣0️⃣.5️⃣  Peak Hours (Day of Week)
  // ──────────────────────────────────────────
  async getPeakHoursMetrics(universityId: number, options?: { startDate?: Date; endDate?: Date; serviceModes?: number[] }) {
    let dateClause = "";
    const params: any[] = [universityId];
    if (options?.startDate) {
      params.push(options.startDate);
      dateClause += ` AND b.booking_created_at >= $${params.length}`;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      dateClause += ` AND b.booking_created_at <= $${params.length}`;
    }
    if (options?.serviceModes && options.serviceModes.length > 0) {
      params.push(options.serviceModes);
      dateClause += ` AND b.service_mode_id = ANY($${params.length}::int[])`;
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ dow: number; count: bigint }>
    >(
      `SELECT
         EXTRACT(ISODOW FROM ts.time_slot_start_datetime)::int AS dow,
         COUNT(*)::int AS count
       FROM booking b
       JOIN time_slot ts ON b.university_id = ts.university_id AND b.time_slot_id = ts.time_slot_id
       WHERE b.university_id = $1 ${dateClause}
       GROUP BY dow
       ORDER BY dow`,
      ...params
    );

    // Initialize all 7 days (1=Monday, 7=Sunday)
    const result = [
      { day: "จันทร์", dow: 1, count: 0 },
      { day: "อังคาร", dow: 2, count: 0 },
      { day: "พุธ", dow: 3, count: 0 },
      { day: "พฤหัสฯ", dow: 4, count: 0 },
      { day: "ศุกร์", dow: 5, count: 0 },
      { day: "เสาร์", dow: 6, count: 0 },
      { day: "อาทิตย์", dow: 7, count: 0 },
    ];

    rows.forEach((r) => {
      const target = result.find(x => x.dow === r.dow);
      if (target) target.count = Number(r.count);
    });

    return result;
  },

  // ──────────────────────────────────────────
  // 1️⃣1️⃣  Attendance Insights
  // ──────────────────────────────────────────
  async getAttendanceInsights(universityId: number, options?: { startDate?: Date; endDate?: Date; serviceModes?: number[] }) {
    let dateClause = "";
    const params: any[] = [universityId];
    if (options?.startDate) {
      params.push(options.startDate);
      dateClause += ` AND b.booking_created_at >= $${params.length}`;
    }
    if (options?.endDate) {
      params.push(options.endDate);
      dateClause += ` AND b.booking_created_at <= $${params.length}`;
    }
    if (options?.serviceModes && options.serviceModes.length > 0) {
      params.push(options.serviceModes);
      dateClause += ` AND b.service_mode_id = ANY($${params.length}::int[])`;
    }

    const rows = await prisma.$queryRawUnsafe<
      Array<{ status: string; count: bigint }>
    >(
      `SELECT
         ba.booking_attendance_status AS status,
         COUNT(*)::int AS count
       FROM booking_attendance ba
       JOIN booking b ON b.university_id = ba.university_id AND b.booking_id = ba.booking_id
       WHERE b.university_id = $1 ${dateClause}
       GROUP BY ba.booking_attendance_status`,
      ...params
    );

    const statusMap: Record<string, number> = {};
    rows.forEach((r) => { statusMap[r.status] = Number(r.count); });

    // Pending exception requests needing review
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exceptionWhere: any = {
      booking: { university_id: universityId },
      booking_exception_status: "PENDING_REVIEW",
    };
    if (options?.serviceModes && options.serviceModes.length > 0) {
      exceptionWhere.booking.service_mode_id = { in: options.serviceModes };
    }
    const pendingExceptions = await prisma.bookingExceptionRequest.count({
      where: exceptionWhere,
    });

    return {
      checkedIn: statusMap["CHECKED_IN"] ?? 0,
      late: statusMap["LATE"] ?? 0,
      noShow: statusMap["NO_SHOW"] ?? 0,
      pending: statusMap["PENDING"] ?? 0,
      cancelledByConsultant: statusMap["CANCELLED_BY_CONSULTANT"] ?? 0,
      pendingExceptions,
    };
  },
};
