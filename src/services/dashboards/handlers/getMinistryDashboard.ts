import prisma from "@/lib/prisma";

export const MinistryService = {
  /**
   * Get overall national statistics
   */
  async getNationalStats() {
    const [totalUniversities, totalStudents, totalBookings, highRiskCases] = await Promise.all([
      prisma.university.count({ where: { university_is_active: true } }),
      prisma.student.count(),
      prisma.booking.count(),
      prisma.bookingOutcome.count({
        where: {
          booking_outcome_risk_level: { gte: 4 }, // Assuming 4-5 is high risk
        },
      }),
    ]);

    return {
      totalUniversities,
      totalStudents,
      totalBookings,
      highRiskCases,
    };
  },

  /**
   * Get risk distribution across all universities
   */
  async getRiskDistribution() {
    // Group by risk level
    const riskGroups = await prisma.bookingOutcome.groupBy({
      by: ["booking_outcome_risk_level"],
      _count: {
        booking_id: true,
      },
    });

    // Valid risk levels are 1-5 (usually)
    // Map to a cleaner object
    const distribution = Array.from({ length: 5 }, (_, i) => {
      const level = i + 1;
      const found = riskGroups.find((g) => g.booking_outcome_risk_level === level);
      return {
        level,
        count: found?._count.booking_id || 0,
        label: getRiskLabel(level),
      };
    });

    return distribution;
  },

  /**
   * Get top universities with most high-risk cases
   */
  async getUniversityRankings(limit = 5) {
    // Prisma group by doesn't support easy joining for names yet in all versions, 
    // but we can do a raw query or 2-step.
    // Let's use groupBy first.
    
    // Find universities with most bookings having risk >= 4
    const riskyUnis = await prisma.bookingOutcome.groupBy({
      by: ["university_id"],
      where: {
        booking_outcome_risk_level: { gte: 4 },
      },
      _count: {
        booking_id: true,
      },
      orderBy: {
        _count: {
          booking_id: "desc",
        },
      },
      take: limit,
    });

    // Enrich with University names
    const enriched = await Promise.all(
      riskyUnis.map(async (item) => {
        const uni = await prisma.university.findUnique({
          where: { university_id: item.university_id },
          select: { university_name_th: true, university_code: true },
        });
        return {
          id: item.university_id,
          name: uni?.university_name_th || "Unknown",
          code: uni?.university_code || "N/A",
          highRiskCount: item._count.booking_id,
        };
      })
    );

    return enriched;
  },
};

function getRiskLabel(level: number) {
  switch (level) {
    case 1: return "ปกติ (Normal)";
    case 2: return "เล็กน้อย (Mild)";
    case 3: return "ปานกลาง (Moderate)";
    case 4: return "สูง (High)";
    case 5: return "รุนแรง (Severe)";
    default: return `ระดับ ${level}`;
  }
}
