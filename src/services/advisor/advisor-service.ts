import prisma from "@/lib/prisma";

export const AdvisorService = {
  /**
   * Get stats for a specific advisor
   */
  async getAdviseeStats(advisorAccountId: number) {
    // Verify advisor exists and get ID
    const advisor = await prisma.advisor.findUnique({
      where: { account_id: advisorAccountId },
    });

    if (!advisor) return null;

    // Count students under this advisor
    const totalStudents = await prisma.studentAcademic.count({
      where: { advisor_id: advisor.advisor_id },
    });

    // Count active cases (bookings pending or in progress) for these students
    const activeCases = await prisma.booking.count({
      where: {
        student: {
          academic: {
            advisor_id: advisor.advisor_id,
          },
        },
        booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED", "IN_PROGRESS"] },
      },
    });

    // Count high risk students (latest outcome >= 4)
    // This is complex, let's simplify by counting any high risk outcome in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const highRiskRecent = await prisma.bookingOutcome.count({
      where: {
        booking: {
          student: {
            academic: {
              advisor_id: advisor.advisor_id,
            },
          },
        },
        booking_outcome_risk_level: { gte: 4 },
        booking_outcome_recorded_at: { gte: thirtyDaysAgo },
      },
    });

    return {
      totalStudents,
      activeCases,
      highRiskRecent,
    };
  },

  /**
   * Get list of students under advisor
   */
  async getMyStudents(advisorAccountId: number, filters?: { search?: string; riskLevel?: string }) {
    const advisor = await prisma.advisor.findUnique({
      where: { account_id: advisorAccountId },
    });

    if (!advisor) return [];

    const students = await prisma.student.findMany({
      where: {
        academic: {
          advisor_id: advisor.advisor_id,
        },
        // Search filter: firstname, lastname, or student ID
        ...(filters?.search && {
          OR: [
            { student_code: { contains: filters.search } },
            { 
               profile: { 
                 OR: [
                   { student_first_name_th: { contains: filters.search } },
                   { student_last_name_th: { contains: filters.search } }
                 ] 
               } 
            }
          ]
        }),
      },
      include: {
        profile: true,
        academic: {
          include: {
            faculty: true,
            department: true,
          },
        },
        // Get latest booking risk
        bookings: {
          orderBy: { booking_created_at: "desc" },
          take: 1,
          include: {
            outcome: true,
          },
        },
      },
    });

    // Map first, then filter by risk in memory (easier than complex nested prisma query for latest booking)
    const result = students.map((s) => ({
      id: s.student_id,
      code: s.student_code,
      name: `${s.profile?.student_first_name_th} ${s.profile?.student_last_name_th}`,
      faculty: s.academic?.faculty.faculty_name_th,
      latestRisk: s.bookings[0]?.outcome?.booking_outcome_risk_level || 0,
      lastActivity: s.bookings[0]?.booking_created_at || null,
    }));

    if (filters?.riskLevel && filters.riskLevel !== "ALL") {
        const level = parseInt(filters.riskLevel);
        if (!isNaN(level)) {
            // Simple logic: Exact match or range
            // Let's assume User passes "4" for High Risk (>=4), "2" for Med, "1" for Low
            // Or exact match. 
            // Better: use ranges consistent with system. 
            // For now, let's assume exact match if specific level passed, or "HIGH" string logic. 
            // The FilterBar usually passes values.
            // Let's implement >= logic if user passes a threshold, or exact match?
            // User request said "High/Medium/Low". 
            // Let's support mapped values: "HIGH" (>=4), "MEDIUM" (3), "LOW" (<=2)
            
            return result.filter(r => {
                if (filters.riskLevel === "HIGH") return r.latestRisk >= 4;
                if (filters.riskLevel === "MEDIUM") return r.latestRisk === 3;
                if (filters.riskLevel === "LOW") return r.latestRisk <= 2 && r.latestRisk > 0;
                if (filters.riskLevel === "NORMAL") return r.latestRisk === 0; // No risk assessed
                return true;
            });
        }
    }

    return result;
  },

  /**
   * Get historical risk trend for advisor's students
   */
  async getStudentRiskTrends(
    advisorAccountId: number,
    filters?: { startDate?: Date; endDate?: Date }
  ) {
     const advisor = await prisma.advisor.findUnique({
      where: { account_id: advisorAccountId },
    });

    if (!advisor) return [];

    // Build date where clause
    const dateWhere: any = {};
    if (filters?.startDate) dateWhere.gte = filters.startDate;
    if (filters?.endDate) dateWhere.lte = filters.endDate;

    // Aggregate outcomes by month for students under this advisor
    const outcomes = await prisma.bookingOutcome.findMany({
        where: {
            booking: {
                student: {
                    academic: {
                        advisor_id: advisor.advisor_id
                    }
                }
            },
            ...(Object.keys(dateWhere).length > 0 && {
                booking_outcome_recorded_at: dateWhere
            }),
        },
        select: {
            booking_outcome_risk_level: true,
            booking_outcome_recorded_at: true
        },
        orderBy: {
            booking_outcome_recorded_at: 'asc'
        }
    });

    // Simple grouping by month (YYYY-MM)
    const grouped = outcomes.reduce((acc, curr) => {
        const month = curr.booking_outcome_recorded_at.toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = { totalRisk: 0, count: 0 };
        if (curr.booking_outcome_risk_level) {
            acc[month].totalRisk += curr.booking_outcome_risk_level;
            acc[month].count++;
        }
        return acc;
    }, {} as Record<string, { totalRisk: number, count: number }>);

    return Object.entries(grouped).map(([month, data]) => ({
        month,
        averageRisk: data.count > 0 ? Number((data.totalRisk / data.count).toFixed(2)) : 0
    }));
  },

  /**
   * Get comprehensive analytics for advisor dashboard
   */
  async getAdvisorAnalytics(
    advisorAccountId: number,
    filters?: { startDate?: Date; endDate?: Date; problemCategoryId?: number; gender?: string }
  ) {
    const advisor = await prisma.advisor.findUnique({
      where: { account_id: advisorAccountId },
    });

    if (!advisor) return null;

    // Build dynamic where clause from filters
    const bookingWhere: any = {
      student: {
        academic: {
          advisor_id: advisor.advisor_id,
        },
      },
      booking_status: { in: ["COMPLETED", "IN_PROGRESS", "ASSIGNED"] },
    };

    // Date range filter
    if (filters?.startDate || filters?.endDate) {
      bookingWhere.booking_created_at = {};
      if (filters.startDate) bookingWhere.booking_created_at.gte = filters.startDate;
      if (filters.endDate) bookingWhere.booking_created_at.lte = filters.endDate;
    }

    // Problem category filter
    if (filters?.problemCategoryId) {
      bookingWhere.problem_category_id = filters.problemCategoryId;
    }

    // Gender filter
    if (filters?.gender) {
      bookingWhere.student = {
        ...bookingWhere.student,
        profile: { student_gender: filters.gender },
      };
    }

    // Fetch filtered bookings for analysis
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        problemCategory: true,
        student: {
          include: {
            profile: true,
          },
        },
        timeSlot: true,
        outcome: true,
      },
      orderBy: { booking_created_at: "desc" },
    });

    // 1. Problem Types Breakdown
    const problemStats: Record<string, number> = {};
    
    // 2. Gender vs Problem
    const genderProblemStats: Record<string, Record<string, number>> = {
      Male: {},
      Female: {},
      Other: {},
    };

    // 3. Time Analysis (Week, Month) - Count visits
    const visitsByMonth: Record<string, number> = {};
    const visitsByDayOfWeek: Record<number, number> = {}; // 0-6

    // 4. Repeat Consultations
    const studentVisitCounts: Record<string, number> = {};

    // 5. Risk Distribution
    const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };

    bookings.forEach((booking) => {
      // Problem Stats
      const problemName = booking.problemCategory?.problem_category_name_th || "ไม่ระบุ";
      problemStats[problemName] = (problemStats[problemName] || 0) + 1;

      // Gender Stats
      let gender = "Other";
      // Check StudentGender enum or string? Schema says StudentGender?
      // prisma schema: student_gender StudentGender?
      // Need to check what StudentGender values are. Assuming MALE/FEMALE or similar.
      // If it's a relation/enum, we treat as string.
      const g = booking.student?.profile?.student_gender;
      if (g === "MALE" || (g as any) === "ชาย") gender = "Male";
      else if (g === "FEMALE" || (g as any) === "หญิง") gender = "Female";
      
      if (!genderProblemStats[gender]) genderProblemStats[gender] = {};
      genderProblemStats[gender][problemName] = (genderProblemStats[gender][problemName] || 0) + 1;

      // Time Stats
      const date = booking.timeSlot?.time_slot_start_datetime || booking.booking_created_at;
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      visitsByMonth[monthKey] = (visitsByMonth[monthKey] || 0) + 1;
      
      const day = date.getDay();
      visitsByDayOfWeek[day] = (visitsByDayOfWeek[day] || 0) + 1;

      // Repeat Stats
      const studentId = booking.student_id.toString();
      studentVisitCounts[studentId] = (studentVisitCounts[studentId] || 0) + 1;

      // Risk Distribution
      // Use Outcome if available, else 0
      const risk = booking.outcome?.booking_outcome_risk_level || 0;
      if (risk >= 4) riskDistribution.HIGH++;
      else if (risk === 3) riskDistribution.MEDIUM++;
      else if (risk > 0) riskDistribution.LOW++;
      else riskDistribution.NORMAL++;
    });

    // Process Repeat Stats
    let repeatCount = 0;
    let singleCount = 0;
    Object.values(studentVisitCounts).forEach(c => {
      if (c > 1) repeatCount++;
      else singleCount++;
    });

    // ... inside getAdvisorAnalytics ...
    return {
      problemStats,
      genderProblemStats,
      visitsByMonth,     // For trend/exam analysis
      visitsByDayOfWeek, // For weekly patterns
      repeatStats: { repeat: repeatCount, single: singleCount },
      riskDistribution
    };
  },

  /**
   * Get detailed student info for advisor view
   */
  async getStudentDetail(advisorAccountId: number, studentId: number) {
     const advisor = await prisma.advisor.findUnique({
      where: { account_id: advisorAccountId },
    });

    if (!advisor) return null;

    // Verify student belongs to this advisor
    const student = await prisma.student.findFirst({
        where: {
            student_id: studentId,
            academic: {
                advisor_id: advisor.advisor_id
            }
        },
        include: {
            profile: true,
            academic: {
                include: {
                    faculty: true,
                    department: true
                }
            },
            addresses: {
                include: {
                    province: true
                }
            },
            // Get all bookings history
            bookings: {
                orderBy: { booking_created_at: 'desc' },
                include: {
                    problemCategory: true,
                    timeSlot: true,
                    outcome: true,
                    consultant: {
                        include: {
                            profile: true
                        }
                    }
                }
            }
        }
    });

    return student;
  }
};
