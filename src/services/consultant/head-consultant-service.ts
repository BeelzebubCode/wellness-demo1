import prisma from "@/lib/prisma";

export const HeadConsultantService = {
  // ──────────────────────────────────────────
  // 1️⃣  Booking Stats — นับ booking แยก status
  // ──────────────────────────────────────────
  async getBookingStats(universityId: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pending, assigned, inProgress, completed, cancelled, totalThisMonth] =
      await Promise.all([
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "PENDING_ASSIGNMENT" },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "ASSIGNED" },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "IN_PROGRESS" },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "COMPLETED" },
        }),
        prisma.booking.count({
          where: { university_id: universityId, booking_status: "CANCELLED" },
        }),
        prisma.booking.count({
          where: {
            university_id: universityId,
            booking_created_at: { gte: startOfMonth },
          },
        }),
      ]);

    return { pending, assigned, inProgress, completed, cancelled, totalThisMonth };
  },

  // ──────────────────────────────────────────
  // 2️⃣  Problem Category Distribution
  // ──────────────────────────────────────────
  async getProblemCategoryDistribution(universityId: number) {
    const groups = await prisma.booking.groupBy({
      by: ["problem_category_id"],
      where: { university_id: universityId },
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
  // 3️⃣  Top Students by Points
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
  async getConsultantRatings(universityId: number) {
    // Get all consultants with feedbacks for this university
    const consultants = await prisma.consultant.findMany({
      where: { university_id: universityId },
      include: {
        profile: true,
        feedbacks: {
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
  // 5️⃣  Team Overview — consultants + active bookings
  // ──────────────────────────────────────────
  async getTeamOverview(universityId: number) {
    const consultants = await prisma.consultant.findMany({
      where: { university_id: universityId },
      include: {
        profile: true,
        bookings: {
          where: {
            booking_status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          },
          select: { booking_id: true },
        },
        specializations: true,
      },
    });

    return consultants.map((c) => ({
      consultantId: c.consultant_id,
      prefix: c.profile?.consultant_prefix ?? "",
      firstName: c.profile?.consultant_first_name ?? "-",
      lastName: c.profile?.consultant_last_name ?? "-",
      activeBookings: c.bookings.length,
      specializations: c.specializations.map(
        (s) => s.consultant_specialization_topic
      ),
    }));
  },
};
