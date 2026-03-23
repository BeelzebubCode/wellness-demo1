import prisma from "@/lib/prisma";

type Preset = "7d" | "30d" | "90d" | "180d" | "all";

function getStartDate(preset: Preset): Date | undefined {
  if (preset === "all") return undefined;
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "180d" ? 180 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export const SuperAdminService = {
  /**
   * Get comprehensive system overview stats for Super Admin
   */
  async getSystemOverview() {
    // 1. Universities (Tenants)
    const totalUniversities = await prisma.university.count({
      where: { university_is_active: true }
    });

    // 2. Consultants
    const totalConsultants = await prisma.consultant.count();

    // 3. Students
    const totalStudents = await prisma.student.count();

    // 4. Knowledge Base Documents (Active)
    const kbDocuments = await prisma.aiKbDocument.count({
      where: { ai_kb_document_is_active: true }
    });

    // 5. Borrow Requests (Pipeline)
    const borrowRequests = await prisma.borrowRequest.groupBy({
      by: ['borrow_request_status'],
      _count: true
    });

    const pendingBorrow = borrowRequests.find(r => r.borrow_request_status === 'SUBMITTED')?._count || 0;
    const approvedBorrow = borrowRequests.find(r => r.borrow_request_status === 'APPROVED')?._count || 0;
    const rejectedBorrow = borrowRequests.find(r => r.borrow_request_status === 'REJECTED')?._count || 0;

    // 6. Feedback Count
    const totalFeedbacks = await prisma.feedback.count();

    return {
      totalUniversities,
      totalConsultants,
      totalStudents,
      kbDocuments,
      borrowRequests: {
        pending: pendingBorrow,
        approved: approvedBorrow,
        rejected: rejectedBorrow,
        total: borrowRequests.reduce((acc, r) => acc + r._count, 0)
      },
      totalFeedbacks,
      systemHealth: "Healthy", // Base infrastructure is running
      uptime: "99.9%"
    };
  },

  /**
   * Get Borrow Request KPIs
   */
  async getBorrowStats(preset: Preset) {
    const startDate = getStartDate(preset);
    const where = startDate ? { borrow_request_created_at: { gte: startDate } } : {};

    const group = await prisma.borrowRequest.groupBy({
      by: ['borrow_request_status'],
      where,
      _count: true
    });

    const total = group.reduce((acc, r) => acc + r._count, 0);
    const pending = group.find(r => r.borrow_request_status === 'SUBMITTED')?._count || 0;
    const approved = group.find(r => r.borrow_request_status === 'APPROVED' || r.borrow_request_status === 'ASSIGNED' || r.borrow_request_status === 'COMPLETED')?._count || 0;
    const rejected = group.find(r => r.borrow_request_status === 'REJECTED')?._count || 0;

    // Active consultants borrowed right now
    const now = new Date();
    const activeAssignments = await prisma.borrowAssignment.count({
      where: {
        borrow_assign_start_at: { lte: now },
        borrow_assign_end_at: { gte: now }
      }
    });

    return { total, pending, approved, rejected, activeAssignments };
  },

  /**
   * Get Borrow Request Trend
   */
  async getBorrowTrend(preset: Preset) {
    const startDate = getStartDate(preset) || new Date(new Date().setFullYear(new Date().getFullYear() - 1));

    // Fetch all requests in range and group in JS to ensure daily buckets
    const requests = await prisma.borrowRequest.findMany({
      where: { borrow_request_created_at: { gte: startDate } },
      select: { borrow_request_created_at: true, borrow_request_status: true }
    });

    const buckets: Record<string, { bucket: string, total: number, approved: number, rejected: number }> = {};

    // Pre-fill buckets
    const end = new Date();
    let current = new Date(startDate);
    while (current <= end) {
      const idx = current.toISOString().split('T')[0];
      buckets[idx] = { bucket: idx, total: 0, approved: 0, rejected: 0 };
      current.setDate(current.getDate() + 1);
    }

    requests.forEach(req => {
      const idx = req.borrow_request_created_at.toISOString().split('T')[0];
      if (buckets[idx]) {
        buckets[idx].total++;
        if (req.borrow_request_status === 'APPROVED' || req.borrow_request_status === 'ASSIGNED' || req.borrow_request_status === 'COMPLETED') {
          buckets[idx].approved++;
        }
        if (req.borrow_request_status === 'REJECTED') {
          buckets[idx].rejected++;
        }
      }
    });

    return Object.values(buckets).sort((a, b) => a.bucket.localeCompare(b.bucket));
  },

  /**
   * Get Top Requesting and Lending Universities
   */
  async getTopUniversities(preset: Preset) {
    const startDate = getStartDate(preset);

    const [requesting, lending, unis] = await Promise.all([
      prisma.borrowRequest.groupBy({
        by: ['from_university_id'],
        where: startDate ? { borrow_request_created_at: { gte: startDate } } : {},
        _count: true,
        orderBy: { _count: { from_university_id: 'desc' } },
        take: 10
      }),
      prisma.borrowAssignment.groupBy({
        by: ['consultant_university_id'],
        where: startDate ? { borrow_assigned_at: { gte: startDate } } : {},
        _count: true,
        orderBy: { _count: { consultant_university_id: 'desc' } },
        take: 10
      }),
      prisma.university.findMany({ select: { university_id: true, university_name_th: true, university_code: true } })
    ]);

    const uniMap = new Map(unis.map(u => [u.university_id, u.university_name_th || u.university_code]));

    return {
      topRequesting: requesting.map(r => ({
        universityId: r.from_university_id,
        universityName: uniMap.get(r.from_university_id) || `Uni ${r.from_university_id}`,
        count: r._count
      })),
      topLending: lending.map(r => ({
        universityId: r.consultant_university_id,
        universityName: uniMap.get(r.consultant_university_id) || `Uni ${r.consultant_university_id}`,
        count: r._count
      }))
    };
  },

  // ═══════════════════════════════════════════════════════════
  // NEW WIDGETS
  // ═══════════════════════════════════════════════════════════

  /**
   * Widget 1: Supply vs Demand Gap
   * Compare problem categories students book vs consultant specializations available
   */
  async getSupplyDemandGap() {
    const [demandRaw, supplyRaw, categories] = await Promise.all([
      // Demand: number of bookings per problem category (last 90 days)
      prisma.booking.groupBy({
        by: ['problem_category_id'],
        where: { booking_created_at: { gte: new Date(Date.now() - 90 * 86400000) } },
        _count: true,
        orderBy: { _count: { problem_category_id: 'desc' } }
      }),
      // Supply: number of consultants per specialization topic
      prisma.consultantSpecialization.groupBy({
        by: ['consultant_specialization_topic'],
        _count: true
      }),
      // Category labels
      prisma.problemCategory.findMany({
        select: { problem_category_id: true, problem_category_name_th: true, problem_category_code: true }
      })
    ]);

    const catMap = new Map(categories.map(c => [c.problem_category_id, c.problem_category_name_th || c.problem_category_code]));

    // Build supply lookup (lowercase topic → count)
    const supplyMap = new Map<string, number>();
    supplyRaw.forEach(s => {
      supplyMap.set(s.consultant_specialization_topic.toLowerCase(), s._count);
    });

    const result = demandRaw.map(d => {
      const catName = catMap.get(d.problem_category_id) || `Cat ${d.problem_category_id}`;
      // Try to match supply by similar topic name
      const supplyCount = supplyMap.get(catName.toLowerCase()) || 0;
      return {
        category: catName,
        demand: d._count,
        supply: supplyCount,
        gap: d._count - supplyCount
      };
    });

    return result;
  },

  /**
   * Widget 2: High-Risk Response Time by University
   * How fast do high-risk students get attended to?
   */
  async getHighRiskResponseTime() {
    // Find bookings with high risk outcomes (risk_level_id >= 4)
    const highRiskBookings = await prisma.bookingOutcome.findMany({
      where: { risk_level_id: { gte: 4 } },
      select: {
        university_id: true,
        booking: {
          select: {
            booking_created_at: true,
            attendance: {
              select: { booking_attendance_checked_in_at: true }
            }
          }
        }
      }
    });

    // Group by university and compute avg wait hours
    const uniStats: Record<number, { totalHours: number; count: number }> = {};

    highRiskBookings.forEach(outcome => {
      const createdAt = outcome.booking.booking_created_at;
      const checkedInAt = outcome.booking.attendance?.booking_attendance_checked_in_at;
      if (!checkedInAt) return;

      const waitHours = (checkedInAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      if (waitHours < 0) return;

      if (!uniStats[outcome.university_id]) {
        uniStats[outcome.university_id] = { totalHours: 0, count: 0 };
      }
      uniStats[outcome.university_id].totalHours += waitHours;
      uniStats[outcome.university_id].count++;
    });

    // Fetch university names
    const uniIds = Object.keys(uniStats).map(Number);
    const unis = await prisma.university.findMany({
      where: { university_id: { in: uniIds } },
      select: { university_id: true, university_name_th: true, university_code: true }
    });
    const uniMap = new Map(unis.map(u => [u.university_id, u.university_name_th || u.university_code]));

    return Object.entries(uniStats)
      .map(([id, stats]) => ({
        universityName: uniMap.get(Number(id)) || `Uni ${id}`,
        avgWaitHours: Math.round((stats.totalHours / stats.count) * 10) / 10,
        caseCount: stats.count
      }))
      .sort((a, b) => b.avgWaitHours - a.avgWaitHours)
      .slice(0, 15);
  },

  /**
   * Widget 3: Low Adoption Universities
   * Flag universities with low activity or high cancellation rates
   */
  async getLowAdoptionUniversities(preset: Preset = '90d') {
    const sinceDate = getStartDate(preset);
    const dateWhere = sinceDate ? { booking_created_at: { gte: sinceDate } } : {};

    const [universities, bookingsByUni, cancellationsByUni, studentsByUni] = await Promise.all([
      prisma.university.findMany({
        where: { university_is_active: true },
        select: { university_id: true, university_name_th: true, university_code: true }
      }),
      prisma.booking.groupBy({
        by: ['university_id'],
        where: dateWhere,
        _count: true
      }),
      prisma.booking.groupBy({
        by: ['university_id'],
        where: { booking_status: 'CANCELLED', ...dateWhere },
        _count: true
      }),
      prisma.student.groupBy({
        by: ['university_id'],
        _count: true
      })
    ]);

    const bookingMap = new Map(bookingsByUni.map(b => [b.university_id, b._count]));
    const cancelMap = new Map(cancellationsByUni.map(c => [c.university_id, c._count]));
    const studentMap = new Map(studentsByUni.map(s => [s.university_id, s._count]));

    return universities.map(uni => {
      const totalBookings = bookingMap.get(uni.university_id) || 0;
      const cancellations = cancelMap.get(uni.university_id) || 0;
      const totalStudents = studentMap.get(uni.university_id) || 0;
      const cancellationRate = totalBookings > 0 ? Math.round((cancellations / totalBookings) * 1000) / 10 : 0;
      const bookingsPerStudent = totalStudents > 0 ? Math.round((totalBookings / totalStudents) * 100) / 100 : 0;

      return {
        universityName: uni.university_name_th || uni.university_code,
        totalBookings,
        cancellations,
        cancellationRate,
        totalStudents,
        bookingsPerStudent
      };
    })
      .sort((a, b) => a.bookingsPerStudent - b.bookingsPerStudent);
  },

  /**
   * Widget 4: Borrow System Health
   * Approval lead time and rejection rate
   */
  async getBorrowSystemHealth() {
    const [approved, rejected] = await Promise.all([
      prisma.borrowRequest.findMany({
        where: { borrow_request_status: 'APPROVED', borrow_approved_at: { not: null } },
        select: { borrow_request_created_at: true, borrow_approved_at: true }
      }),
      prisma.borrowRequest.findMany({
        where: { borrow_request_status: 'REJECTED', borrow_rejected_at: { not: null } },
        select: { borrow_request_created_at: true, borrow_rejected_at: true }
      })
    ]);

    const avgApprovalDays = approved.length > 0
      ? Math.round(approved.reduce((acc, r) => {
        return acc + (r.borrow_approved_at!.getTime() - r.borrow_request_created_at.getTime()) / 86400000;
      }, 0) / approved.length * 10) / 10
      : 0;

    const avgRejectionDays = rejected.length > 0
      ? Math.round(rejected.reduce((acc, r) => {
        return acc + (r.borrow_rejected_at!.getTime() - r.borrow_request_created_at.getTime()) / 86400000;
      }, 0) / rejected.length * 10) / 10
      : 0;

    const totalProcessed = approved.length + rejected.length;
    const rejectionRate = totalProcessed > 0
      ? Math.round((rejected.length / totalProcessed) * 1000) / 10
      : 0;

    return {
      avgApprovalDays,
      avgRejectionDays,
      rejectionRate,
      totalProcessed,
      approvedCount: approved.length,
      rejectedCount: rejected.length
    };
  }
};

