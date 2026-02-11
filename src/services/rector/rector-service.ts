import prisma from "@/lib/prisma";

export const RectorService = {
    /**
     * Get aggregated university-wide statistics for Rector's dashboard
     * Includes all faculties in the university
     */
    async getUniversityStats(universityId: number) {
        // 1. Total Students (SQL)
        const totalStudentsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::int as count 
            FROM "student_academic" 
            WHERE "university_id" = ${universityId}
        `;
        const totalStudents = Number(totalStudentsQuery[0]?.count || 0);

        // 2. Total Bookings (SQL)
        const totalBookingsQuery = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::int as count 
            FROM "booking" 
            WHERE "university_id" = ${universityId}
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

        // 4. Risk Distribution (SQL Group By)
        const riskStats = await prisma.$queryRaw<{ risk: number, count: bigint }[]>`
            SELECT 
                bo.booking_outcome_risk_level as risk,
                COUNT(*)::int as count
            FROM "booking" b
            JOIN "booking_outcome" bo ON b.booking_id = bo.booking_id
            WHERE b.university_id = ${universityId}
            GROUP BY bo.booking_outcome_risk_level
        `;

        const riskDistribution = { HIGH: 0, MEDIUM: 0, LOW: 0, NORMAL: 0 };
        riskStats.forEach(r => {
            if (r.risk >= 4) riskDistribution.HIGH += Number(r.count);
            else if (r.risk === 3) riskDistribution.MEDIUM += Number(r.count);
            else if (r.risk === 2) riskDistribution.LOW += Number(r.count);
            else riskDistribution.NORMAL += Number(r.count);
        });

        // 5. Problem Stats & Gender (SQL Group By)
        const problemGenderStats = await prisma.$queryRaw<{ name: string, gender: string, count: bigint }[]>`
            SELECT 
                COALESCE(pc.problem_category_name_th, 'อื่นๆ') as name,
                sp.student_gender as gender,
                COUNT(*)::int as count
            FROM "booking" b
            LEFT JOIN "problem_category" pc ON b.problem_category_id = pc.problem_category_id
            LEFT JOIN "student_profile" sp ON b.student_id = sp.student_id
            WHERE b.university_id = ${universityId}
            GROUP BY pc.problem_category_name_th, sp.student_gender
        `;

        const problemStats: Record<string, number> = {};
        const genderProblemStats: Record<string, Record<string, number>> = { Male: {}, Female: {} };

        problemGenderStats.forEach(row => {
            const count = Number(row.count);
            problemStats[row.name] = (problemStats[row.name] || 0) + count;

            if (row.gender === 'MALE') {
                genderProblemStats.Male[row.name] = (genderProblemStats.Male[row.name] || 0) + count;
            } else if (row.gender === 'FEMALE') {
                genderProblemStats.Female[row.name] = (genderProblemStats.Female[row.name] || 0) + count;
            }
        });

        // 6. Visits by Month (SQL Truncate Date)
        const visitsQuery = await prisma.$queryRaw<{ month: string, count: bigint }[]>`
            SELECT 
                TO_CHAR(booking_created_at, 'YYYY-MM') as month,
                COUNT(*)::int as count
            FROM "booking"
            WHERE university_id = ${universityId}
            GROUP BY TO_CHAR(booking_created_at, 'YYYY-MM')
        `;
        
        const visitsByMonth: Record<string, number> = {};
        visitsQuery.forEach(v => {
            if(v.month) visitsByMonth[v.month] = Number(v.count);
        });

        // 7. Repeat Visits (SQL Count Group By Student)
        // Subquery approach: Get counts per student, then group by count
        const repeatQuery = await prisma.$queryRaw<{ visit_count: number, student_count: bigint }[]>`
            SELECT 
                visit_count,
                COUNT(*)::int as student_count
            FROM (
                SELECT student_id, COUNT(*) as visit_count
                FROM "booking"
                WHERE university_id = ${universityId}
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

        // 8. Faculty Breakdown (Combined SQL)
        // Ensure to count risks from bookings associated with students in that faculty
        const facultyStats = await prisma.$queryRaw<{ 
            faculty_id: number, 
            faculty_name: string,
            student_count: bigint,
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
                COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 ELSE 0 END), 0)::int as high_risk,
                COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level = 3 THEN 1 ELSE 0 END), 0)::int as medium_risk,
                COALESCE(SUM(CASE WHEN bo.booking_outcome_risk_level = 2 THEN 1 ELSE 0 END), 0)::int as low_risk
            FROM "faculty" f
            LEFT JOIN "student_academic" sa ON f.faculty_id = sa.faculty_id
            LEFT JOIN "booking" b ON sa.student_id = b.student_id AND b.university_id = ${universityId}
            LEFT JOIN "booking_outcome" bo ON b.booking_id = bo.booking_id
            WHERE f.university_id = ${universityId}
            GROUP BY f.faculty_id, f.faculty_name_th
            ORDER BY student_count DESC
        `;

        const facultyBreakdown = facultyStats.map(f => ({
            facultyName: f.faculty_name,
            studentCount: Number(f.student_count),
            highRiskCount: Number(f.high_risk),
            mediumRiskCount: Number(f.medium_risk),
            lowRiskCount: Number(f.low_risk)
        }));

        return {
            totalStudents,
            totalBookings,
            universityId,
            universityName: university?.university_name_th || "",
            riskDistribution,
            problemStats,
            genderProblemStats,
            visitsByMonth,
            repeatStats: {
                single: singleVisits,
                repeat: repeatVisits,
            },
            facultyBreakdown,
            riskTrends: [], // Keeping empty for now as discussed
        };
    },

    /**
     * Get KPIs for a specific university
     */
    async getRectorKPI(universityId: number, filters?: { startDate?: string; endDate?: string }) {
        if (!universityId) return null;

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
    async getMentalHealthTrends(universityId: number, filters?: { startDate?: string; endDate?: string }) {
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
    async getFacultyStats(universityId: number, filters?: { startDate?: string; endDate?: string }) {
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
