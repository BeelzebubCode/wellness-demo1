import prisma from "@/lib/prisma";

export const RectorService = {
    /**
     * Get aggregated university-wide statistics for Rector's dashboard
     * Includes all faculties in the university
     */
    async getUniversityStats(universityId: number, startDate?: Date, endDate?: Date) {
        // Legacy wrapper for backward compatibility if needed, 
        // but primarily we use the new specific functions below.
        return await this.getLegacyStats(universityId, startDate, endDate);
    },

    // Independent function to get the "University Health Pulse"
    async getUniversityWellbeing(universityId: number, startDate?: Date, endDate?: Date) {
        if (!universityId) return null;

        // Build date filter
        const dateFilter = startDate && endDate ? {
            booking: {
                timeSlot: {
                    time_slot_start_datetime: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        } : {};

        // 1. Risk Score (Inverse of High Risk %)
        const riskQuery = await prisma.bookingOutcome.groupBy({
            by: ['booking_outcome_risk_level'],
            where: {
                university_id: universityId,
                ...(startDate && endDate ? {
                    booking: {
                        timeSlot: {
                            time_slot_start_datetime: {
                                gte: startDate,
                                lte: endDate
                            }
                        }
                    }
                } : {})
            },
            _count: true
        });

        let totalCases = 0;
        let highRiskCases = 0;

        riskQuery.forEach(r => {
            const count = r._count as unknown as number; // Force cast safely if type is ambiguous
            if (typeof count === 'number') {
                totalCases += count;
                if (r.booking_outcome_risk_level && r.booking_outcome_risk_level >= 4) {
                    highRiskCases += count;
                }
            }
        });

        const highRiskRate = totalCases > 0 ? (highRiskCases / totalCases) : 0;
        // Score: 100 - (High Risk Rate * 100). If 20% high risk, score is 80.
        const riskScore = Math.max(0, 100 - (highRiskRate * 100));

        // 2. Satisfaction Score (0-5 -> 0-100)
        const ratings = await prisma.feedbackRating.aggregate({
            where: startDate && endDate ? {
                feedback: {
                    university_id: universityId,
                    booking: {
                        timeSlot: {
                            time_slot_start_datetime: {
                                gte: startDate,
                                lte: endDate
                            }
                        }
                    }
                }
            } : {
                feedback: { university_id: universityId }
            },
            _avg: { feedback_rating_score: true }
        });
        const satisfaction = ratings._avg.feedback_rating_score || 0;
        const satisfactionScore = (satisfaction / 5) * 100;

        // 3. Engagement Score (Active Students / Total Students)
        // Active = Has at least 1 booking
        const totalStudents = await prisma.student.count({ where: { university_id: universityId } });

        const bookingDateFilter = startDate && endDate ? {
            university_id: universityId,
            timeSlot: {
                time_slot_start_datetime: {
                    gte: startDate,
                    lte: endDate
                }
            }
        } : { university_id: universityId };

        const activeStudents = await prisma.booking.groupBy({
            by: ['student_id'],
            where: bookingDateFilter,
        }); // Returns array of unique student_ids

        const engagementRate = totalStudents > 0 ? (activeStudents.length / totalStudents) : 0;
        // Engage score: direct percentage. If 50% students active, score 50.
        const engagementScore = Math.min(100, engagementRate * 100 * 2); // Multiplier 2x: 50% active = 100 score

        // Weighted Average
        // Risk: 40% | Satisfaction: 40% | Engagement: 20%
        const overallScore = Math.round(
            (riskScore * 0.4) + (satisfactionScore * 0.4) + (engagementScore * 0.2)
        );

        return {
            overallScore,
            riskScore,
            satisfactionScore,
            engagementScore,
            totalStudents,
            activeStudents: activeStudents.length,
            highRiskRate,
            satisfactionRaw: satisfaction
        };
    },

    async getFacultyHealthMap(universityId: number, startDate?: Date, endDate?: Date) {
        // Get list of faculties
        const faculties = await prisma.faculty.findMany({
            where: { university_id: universityId },
            include: {
                _count: { select: { studentAcademics: true } }
            }
        });

        const healthMap = await Promise.all(faculties.map(async (faculty) => {
            // Build booking date filter for this faculty
            const facultyBookingFilter = startDate && endDate ? {
                university_id: universityId,
                timeSlot: {
                    time_slot_start_datetime: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                student: { academic: { faculty_id: faculty.faculty_id } }
            } : {
                university_id: universityId,
                student: { academic: { faculty_id: faculty.faculty_id } }
            };

            // 1. Engagement
            const activeStudents = await prisma.booking.groupBy({
                by: ['student_id'],
                where: facultyBookingFilter
            });
            const studentCount = faculty._count.studentAcademics || 1; // Avoid div by 0
            const engagementRate = (activeStudents.length / studentCount) * 100;

            // 2. Risk Index (Average Risk Level)
            const riskStats = await prisma.bookingOutcome.aggregate({
                where: startDate && endDate ? {
                    university_id: universityId,
                    booking: {
                        timeSlot: {
                            time_slot_start_datetime: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        student: { academic: { faculty_id: faculty.faculty_id } }
                    }
                } : {
                    university_id: universityId,
                    booking: { student: { academic: { faculty_id: faculty.faculty_id } } }
                },
                _avg: { booking_outcome_risk_level: true }
            });
            const riskIndex = riskStats._avg.booking_outcome_risk_level || 0;

            // 3. High Risk Volume (Bubble Size or Color)
            const highRiskCount = await prisma.bookingOutcome.count({
                where: startDate && endDate ? {
                    university_id: universityId,
                    booking_outcome_risk_level: { gte: 4 },
                    booking: {
                        timeSlot: {
                            time_slot_start_datetime: {
                                gte: startDate,
                                lte: endDate
                            }
                        },
                        student: { academic: { faculty_id: faculty.faculty_id } }
                    }
                } : {
                    university_id: universityId,
                    booking_outcome_risk_level: { gte: 4 },
                    booking: { student: { academic: { faculty_id: faculty.faculty_id } } }
                }
            });

            return {
                id: faculty.faculty_id,
                name: faculty.faculty_name_th,
                engagementRate: Number(engagementRate.toFixed(1)), // X-Axis
                riskIndex: Number(riskIndex.toFixed(2)), // Y-Axis
                studentCount, // Bubble Size
                activeCount: activeStudents.length,
                highRiskCount
            };
        }));

        return healthMap;
    },

    // Legacy function wrapper to support existing calls if any
    async getLegacyStats(universityId: number, startDate?: Date, endDate?: Date) {
        // Set defaults if not provided (last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date(new Date(end).setDate(end.getDate() - 30));

        // 1. Total Students (SQL) - This is university population, usually not date-filtered
        const totalStudentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
             SELECT COUNT(*)::int as count 
             FROM "student_academic" 
             WHERE "university_id" = ${universityId}
         `;
        const totalStudents = Number(totalStudentsQuery[0]?.count || 0);

        // 2. Total Bookings (SQL) - DATE FILTERED
        const totalBookingsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
             SELECT COUNT(*)::int as count 
             FROM "booking" 
             WHERE "university_id" = ${universityId}
             AND "booking_created_at" >= ${start}
             AND "booking_created_at" <= ${end}
         `;
        const totalBookings = Number(totalBookingsQuery[0]?.count || 0);

        if (totalBookings === 0 && totalStudents === 0) {
            return {
                totalStudents: 0,
                totalBookings: 0,
                universityId,
                universityName: "",
                riskDistribution: { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 },
                problemStats: {},
                genderProblemStats: {},
                visitsByMonth: {},
                repeatStats: { single: 0, repeat: 0 },
                facultyBreakdown: [],
                riskTrends: [],
            };
        }

        // 3. University Name
        const university = await prisma.university.findUnique({
            where: { university_id: universityId },
            select: { university_name_th: true },
        });

        // 4. Risk Distribution (SQL Group By) - DATE FILTERED
        const riskStats = await prisma.$queryRaw<{ risk: number, count: bigint }[]>`
             SELECT 
                 bo.booking_outcome_risk_level as risk,
                 COUNT(*)::int as count
             FROM "booking" b
             JOIN "booking_outcome" bo ON b.booking_id = bo.booking_id
             WHERE b.university_id = ${universityId}
             AND b.booking_created_at >= ${start}
             AND b.booking_created_at <= ${end}
             GROUP BY bo.booking_outcome_risk_level
         `;

        const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
        riskStats.forEach(r => {
            if (r.risk >= 4) riskDistribution.HIGH += Number(r.count);
            else if (r.risk === 3) riskDistribution.MEDIUM += Number(r.count);
            else if (r.risk === 2) riskDistribution.LOW += Number(r.count);
            else riskDistribution.NORMAL += Number(r.count);
        });

        // 5. Problem Stats & Gender (SQL Group By) - DATE FILTERED
        const problemGenderStats = await prisma.$queryRaw<{ name: string, gender: string, count: bigint }[]>`
             SELECT 
                 COALESCE(pc.problem_category_name_th, 'อื่นๆ') as name,
                 sp.student_gender as gender,
                 COUNT(*)::int as count
             FROM "booking" b
             LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
             LEFT JOIN "student_profile" sp ON b.student_id = sp.student_id
             WHERE b.university_id = ${universityId}
             AND b.booking_created_at >= ${start}
             AND b.booking_created_at <= ${end}
             GROUP BY pc.problem_category_name_th, sp.student_gender
         `;

        const problemStats: Record<string, number> = {};
        const genderProblemStats: Record<string, Record<string, number>> = { Male: {}, Female: {}, Other: {} };

        problemGenderStats.forEach(row => {
            const count = Number(row.count);
            problemStats[row.name] = (problemStats[row.name] || 0) + count;

            if (row.gender === 'MALE') {
                genderProblemStats.Male[row.name] = (genderProblemStats.Male[row.name] || 0) + count;
            } else if (row.gender === 'FEMALE') {
                genderProblemStats.Female[row.name] = (genderProblemStats.Female[row.name] || 0) + count;
            } else {
                genderProblemStats.Other[row.name] = (genderProblemStats.Other[row.name] || 0) + count;
            }
        });

        // 5.1. Year Level Distribution (University Wide) - DATE FILTERED
        const currentYear = new Date().getFullYear();
        const currentBuddhistYear = currentYear + 543;

        const yearLevelQuery = await prisma.$queryRaw<{ year_level: number, count: bigint }[]>`
            SELECT 
                CASE 
                    WHEN sa.student_admit_academic_year IS NULL THEN 0
                    WHEN (${currentBuddhistYear} - sa.student_admit_academic_year + 1) > 4 THEN 5
                    ELSE (${currentBuddhistYear} - sa.student_admit_academic_year + 1)
                END as year_level,
                COUNT(DISTINCT b.student_id)::int as count
            FROM "booking" b
            JOIN "student_academic" sa ON b.student_id = sa.student_id AND b.university_id = sa.university_id
            WHERE b.university_id = ${universityId}
            AND b.booking_created_at >= ${start}
            AND b.booking_created_at <= ${end}
            GROUP BY year_level
        `;

        const yearLevelDistribution = { YEAR_1: 0, YEAR_2: 0, YEAR_3: 0, YEAR_4: 0, YEAR_5_PLUS: 0, UNKNOWN: 0 };
        yearLevelQuery.forEach(r => {
            const count = Number(r.count);
            if (r.year_level === 1) yearLevelDistribution.YEAR_1 += count;
            else if (r.year_level === 2) yearLevelDistribution.YEAR_2 += count;
            else if (r.year_level === 3) yearLevelDistribution.YEAR_3 += count;
            else if (r.year_level === 4) yearLevelDistribution.YEAR_4 += count;
            else if (r.year_level === 5) yearLevelDistribution.YEAR_5_PLUS += count;
            else yearLevelDistribution.UNKNOWN += count;
        });

        // 6. Visits by Month (SQL Truncate Date) - FILTERED BY RANGE
        const visitsQuery = await prisma.$queryRaw<{ month: string, count: bigint }[]>`
             SELECT 
                 TO_CHAR(booking_created_at, 'YYYY-MM') as month,
                 COUNT(*)::int as count
             FROM "booking"
             WHERE university_id = ${universityId}
             AND booking_created_at >= ${start}
             AND booking_created_at <= ${end}
             GROUP BY TO_CHAR(booking_created_at, 'YYYY-MM')
         `;

        const visitsByMonth: Record<string, number> = {};
        visitsQuery.forEach(v => {
            if (v.month) visitsByMonth[v.month] = Number(v.count);
        });

        // 7. Repeat Visits (SQL Count Group By Student) - DATE FILTERED
        const repeatQuery = await prisma.$queryRaw<{ visit_count: number, student_count: bigint }[]>`
             SELECT 
                 visit_count,
                 COUNT(*)::int as student_count
             FROM (
                 SELECT student_id, COUNT(*) as visit_count
                 FROM "booking"
                 WHERE university_id = ${universityId}
                 AND booking_created_at >= ${start}
                 AND booking_created_at <= ${end}
                 GROUP BY student_id
             ) as sub
             GROUP BY visit_count
         `;

        let singleVisits = 0;
        let repeatVisits = 0;
        repeatQuery.forEach(r => {
            if (r.visit_count === 1) singleVisits += Number(r.student_count);
            else repeatVisits += Number(r.student_count);
        });

        // 8. Faculty Breakdown (Combined SQL) - DATE FILTERED
        const facultyStats = await prisma.$queryRaw<{
            faculty_id: number,
            faculty_name: string,
            student_count: bigint,
            booking_count: bigint,
            high_risk: bigint,
            medium_risk: bigint,
            low_risk: bigint
        }[]>`
             SELECT 
                 f.faculty_id,
                 f.faculty_name_th as faculty_name,
                 (
                     SELECT COUNT(*) 
                     FROM "student_academic" sa 
                     WHERE sa.faculty_id = f.faculty_id AND sa.university_id = ${universityId}
                 )::int as student_count,
                 COUNT(DISTINCT b.booking_id)::int as booking_count,
                 COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 ELSE 0 END), 0)::int as high_risk,
                 COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level = 3 THEN 1 ELSE 0 END), 0)::int as medium_risk,
                 COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level = 2 THEN 1 ELSE 0 END), 0)::int as low_risk
             FROM "faculty" f
             LEFT JOIN "student_academic" sa ON f.faculty_id = sa.faculty_id
             LEFT JOIN "booking" b ON sa.student_id = b.student_id AND b.university_id = ${universityId} 
                AND b.booking_created_at >= ${start} AND b.booking_created_at <= ${end}
             LEFT JOIN "booking_outcome" bo ON b.booking_id = bo.booking_id
             WHERE f.university_id = ${universityId}
             GROUP BY f.faculty_id, f.faculty_name_th
             ORDER BY student_count DESC
         `;

        const facultyBreakdown = facultyStats.map(f => ({
            facultyName: f.faculty_name,
            studentCount: Number(f.student_count),
            bookingCount: Number(f.booking_count),
            highRiskCount: Number(f.high_risk),
            mediumRiskCount: Number(f.medium_risk),
            lowRiskCount: Number(f.low_risk)
        }));

        // 9. Active Cases (University Wide) - DATE FILTERED
        const activeCasesQuery = await prisma.$queryRaw<{ count: bigint }[]>`
             SELECT COUNT(DISTINCT booking_id)::int as count
             FROM "booking"
             WHERE university_id = ${universityId}
             AND booking_created_at >= ${start}
             AND booking_created_at <= ${end}
             AND booking_status IN ('PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS')
         `;
        const activeCases = Number(activeCasesQuery[0]?.count || 0);

        // 10. Visit Trends (Selected Period vs Previous Equivalent Period)
        const durationMs = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - durationMs);
        const prevEnd = new Date(end.getTime() - durationMs);

        const currentPeriodVisits = totalBookings;
        const prevPeriodQuery = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::int as count 
            FROM "booking" 
            WHERE "university_id" = ${universityId}
            AND "booking_created_at" >= ${prevStart}
            AND "booking_created_at" <= ${prevEnd}
        `;
        const prevPeriodVisits = Number(prevPeriodQuery[0]?.count || 0);

        let visitTrendValue = 0;
        if (prevPeriodVisits > 0) {
            visitTrendValue = ((currentPeriodVisits - prevPeriodVisits) / prevPeriodVisits) * 100;
        } else if (currentPeriodVisits > 0) {
            visitTrendValue = 100;
        }

        return {
            totalStudents,
            totalBookings,
            universityId,
            universityName: university?.university_name_th || "",
            riskDistribution,
            yearLevelDistribution,
            problemStats,
            genderProblemStats,
            visitsByMonth,
            repeatStats: {
                single: singleVisits,
                repeat: repeatVisits,
            },
            facultyBreakdown,
            riskTrends: [],
            activeCases,
            visitTrend: visitTrendValue.toFixed(1),
        };
    },

    /**
     * Get KPI for a specific university
     */
    async getRectorKPI(universityId: number, filters?: { startDate?: string; endDate?: string }) {
        if (!universityId) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateFilter: any = {};
        if (filters?.startDate && filters?.endDate) {
            dateFilter.booking_created_at = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate + "T23:59:59"),
            };
        }

        const totalUsers = await prisma.student.count({
            where: { university_id: universityId },
        });

        const closedCases = await prisma.booking.count({
            where: {
                university_id: universityId,
                booking_status: "COMPLETED",
                ...dateFilter,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const highRiskDateFilter: any = {};
        if (filters?.startDate && filters?.endDate) {
            highRiskDateFilter.booking_outcome_recorded_at = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate + "T23:59:59"),
            };
        }
        const highRisk = await prisma.bookingOutcome.count({
            where: {
                university_id: universityId,
                booking_outcome_risk_level: { gte: 4 },
                ...highRiskDateFilter,
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const feedbackDateFilter: any = {};
        if (filters?.startDate && filters?.endDate) {
            feedbackDateFilter.feedback_created_at = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate + "T23:59:59"),
            };
        }

        const ratings = await prisma.feedbackRating.aggregate({
            where: {
                feedback: {
                    university_id: universityId,
                    ...feedbackDateFilter,
                },
            },
            _avg: {
                feedback_rating_score: true,
            },
        });

        const satisfaction = ratings._avg.feedback_rating_score
            ? Number(ratings._avg.feedback_rating_score.toFixed(1))
            : 0;

        return {
            totalUsers,
            closedCases,
            highRisk,
            satisfaction,
        };
    },

    /**
     * Get Mental Health Trends (Cases over time)
     */
    async getMentalHealthTrends(universityId: number) {
        if (!universityId) return { labels: [], datasets: [] };

        return {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
                {
                    label: "เคสสะสม",
                    data: [10, 25, 40, 45, 60, 80],
                    borderColor: "rgb(75, 192, 192)",
                    backgroundColor: "rgba(75, 192, 192, 0.5)",
                    tension: 0.4,
                },
                {
                    label: "เคสปิดแล้ว",
                    data: [5, 15, 30, 40, 50, 70],
                    borderColor: "rgb(53, 162, 235)",
                    backgroundColor: "rgba(53, 162, 235, 0.5)",
                    tension: 0.4,
                },
            ],
        };
    },

    /**
     * Get Risk Distribution (Pie Chart)
     */
    async getRiskDistribution(universityId: number, filters?: { startDate?: string; endDate?: string }) {
        if (!universityId) return { labels: [], datasets: [] };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = { university_id: universityId };
        if (filters?.startDate && filters?.endDate) {
            where.booking_outcome_recorded_at = {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate + "T23:59:59"),
            };
        }

        const risks = await prisma.bookingOutcome.groupBy({
            by: ["booking_outcome_risk_level"],
            where,
            _count: true,
        });

        const labels = ["ปกติ", "เสี่ยงต่ำ", "เสี่ยงปานกลาง", "เสี่ยงสูง", "รุนแรง"];
        const counts = [0, 0, 0, 0, 0];

        risks.forEach((r) => {
            if (r.booking_outcome_risk_level && r.booking_outcome_risk_level >= 1 && r.booking_outcome_risk_level <= 5) {
                counts[r.booking_outcome_risk_level - 1] = r._count;
            }
        });

        return {
            labels,
            datasets: [
                {
                    data: counts,
                    backgroundColor: [
                        "rgba(75, 192, 192, 0.8)",
                        "rgba(255, 206, 86, 0.8)",
                        "rgba(255, 159, 64, 0.8)",
                        "rgba(255, 99, 132, 0.8)",
                        "rgba(153, 102, 255, 0.8)",
                    ],
                    borderWidth: 1,
                },
            ],
        };
    },

    /**
     * Get Faculty Stats
     */
    async getFacultyStats(universityId: number) {
        if (!universityId) return { labels: [], datasets: [] };

        return {
            labels: ["วิศวกรรมศาสตร์", "วิทยาศาสตร์", "ศึกษาศาสตร์", "มนุษยศาสตร์", "แพทย์"],
            datasets: [
                {
                    label: "จำนวนนิสิตที่เข้าใช้บริการ (คน)",
                    data: [120, 90, 80, 60, 40],
                    backgroundColor: "rgba(153, 102, 255, 0.6)",
                },
            ],
        };
    },

    /**
     * Get all faculties in a university with basic stats
     */
    async getAllFaculties(universityId: number, search?: string) {
        if (!universityId) return [];

        const faculties = await prisma.faculty.findMany({
            where: {
                university_id: universityId,
                ...(search
                    ? {
                        OR: [
                            { faculty_name_th: { contains: search } },
                            { faculty_name_en: { contains: search } },
                            { faculty_code: { contains: search } },
                        ],
                    }
                    : {}),
            },
            include: {
                university: true,
                educationFieldGroup: true,
                _count: {
                    select: {
                        departments: true,
                        studentAcademics: true,
                    },
                },
            },
            orderBy: {
                faculty_name_th: "asc",
            },
        });

        return faculties.map((faculty) => ({
            facultyId: faculty.faculty_id,
            facultyCode: faculty.faculty_code,
            facultyName: faculty.faculty_name_th,
            facultyNameEn: faculty.faculty_name_en,
            universityId: faculty.university_id,
            universityCode: faculty.university.university_code,
            universityName: faculty.university.university_name_th,
            universityNameEn: faculty.university.university_name_en,
            educationFieldGroup: faculty.educationFieldGroup?.field_group_name_en || null,
            educationFieldGroupTH: faculty.educationFieldGroup?.field_group_name_th || null,
            departmentCount: faculty._count.departments,
            studentCount: faculty._count.studentAcademics,
        }));
    },
};
