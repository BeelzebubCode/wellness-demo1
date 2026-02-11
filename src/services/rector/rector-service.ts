import prisma from "@/lib/prisma";
import { StudentGender } from "@prisma/client";

export const RectorService = {
    /**
     * Get aggregated university-wide statistics for Rector's dashboard
     * Includes all faculties in the university
     */
    async getUniversityStats(universityId: number) {
        // Get all students in the university
        const students = await prisma.studentAcademic.findMany({
            where: { university_id: universityId },
            select: { student_id: true },
        });

        const studentIds = students.map((s) => s.student_id);

        if (studentIds.length === 0) {
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
            };
        }

        // Get university name
        const university = await prisma.university.findUnique({
            where: { university_id: universityId },
            select: { university_name_th: true },
        });

        // Get all bookings for students in this university
        const bookings = await prisma.booking.findMany({
            where: {
                university_id: universityId,
                student_id: { in: studentIds },
            },
            include: {
                outcome: true,
                problemCategory: {
                    select: {
                        problem_category_name_th: true,
                    },
                },
                student: {
                    select: {
                        profile: {
                            select: {
                                student_gender: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate risk distribution
        const riskDistribution = {
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
            NORMAL: 0,
        };

        bookings.forEach((b) => {
            const risk = b.outcome?.booking_outcome_risk_level || 0;
            if (risk >= 4) riskDistribution.HIGH++;
            else if (risk === 3) riskDistribution.MEDIUM++;
            else if (risk === 2) riskDistribution.LOW++;
            else riskDistribution.NORMAL++;
        });

        // Problem statistics
        const problemStats: Record<string, number> = {};
        bookings.forEach((b) => {
            const problemName = b.problemCategory?.problem_category_name_th || "อื่นๆ";
            problemStats[problemName] = (problemStats[problemName] || 0) + 1;
        });

        // Gender vs Problem statistics
        const genderProblemStats: Record<string, Record<string, number>> = {
            Male: {},
            Female: {},
        };

        bookings.forEach((b) => {
            const gender = b.student?.profile?.student_gender;
            const problemName = b.problemCategory?.problem_category_name_th || "อื่นๆ";

            if (gender === StudentGender.MALE) {
                genderProblemStats.Male[problemName] = (genderProblemStats.Male[problemName] || 0) + 1;
            } else if (gender === StudentGender.FEMALE) {
                genderProblemStats.Female[problemName] = (genderProblemStats.Female[problemName] || 0) + 1;
            }
        });

        // Visits by month
        const visitsByMonth: Record<string, number> = {};
        bookings.forEach((b) => {
            if (b.booking_created_at) {
                const month = b.booking_created_at.toISOString().substring(0, 7); // YYYY-MM
                visitsByMonth[month] = (visitsByMonth[month] || 0) + 1;
            }
        });

        // Repeat consultations
        const studentBookingCounts = new Map<number, number>();
        bookings.forEach((b) => {
            const count = studentBookingCounts.get(b.student_id) || 0;
            studentBookingCounts.set(b.student_id, count + 1);
        });

        let singleVisits = 0;
        let repeatVisits = 0;
        studentBookingCounts.forEach((count) => {
            if (count === 1) singleVisits++;
            else repeatVisits++;
        });

        // Faculty breakdown for student list
        const faculties = await prisma.faculty.findMany({
            where: { university_id: universityId },
            select: {
                faculty_id: true,
                faculty_name_th: true,
            },
        });

        const facultyBreakdown = await Promise.all(
            faculties.map(async (faculty) => {
                const facultyStudents = await prisma.studentAcademic.findMany({
                    where: {
                        faculty_id: faculty.faculty_id,
                        university_id: universityId,
                    },
                    select: { student_id: true },
                });

                const facultyStudentIds = facultyStudents.map((s) => s.student_id);

                // Get risk counts for this faculty
                const facultyBookings = await prisma.booking.findMany({
                    where: {
                        student_id: { in: facultyStudentIds },
                        university_id: universityId,
                    },
                    include: {
                        outcome: true,
                    },
                });

                let highRisk = 0;
                let mediumRisk = 0;
                let lowRisk = 0;

                facultyBookings.forEach((b) => {
                    const risk = b.outcome?.booking_outcome_risk_level || 0;
                    if (risk >= 4) highRisk++;
                    else if (risk === 3) mediumRisk++;
                    else if (risk === 2) lowRisk++;
                });

                return {
                    facultyName: faculty.faculty_name_th,
                    studentCount: facultyStudentIds.length,
                    highRiskCount: highRisk,
                    mediumRiskCount: mediumRisk,
                    lowRiskCount: lowRisk,
                };
            })
        );

        // Risk trends over last 6 months
        const now = new Date();
        const riskTrends = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = monthDate.toISOString().substring(0, 7);
            const monthName = monthDate.toLocaleDateString("th-TH", { month: "short", year: "numeric" });

            const monthBookings = bookings.filter((b) => {
                if (!b.booking_created_at) return false;
                return b.booking_created_at.toISOString().startsWith(monthStr);
            });

            const avgRisk =
                monthBookings.length > 0
                    ? monthBookings.reduce((sum, b) => sum + (b.outcome?.booking_outcome_risk_level || 0), 0) /
                    monthBookings.length
                    : 0;

            riskTrends.push({
                month: monthName,
                averageRisk: Number(avgRisk.toFixed(2)),
            });
        }

        return {
            totalStudents: studentIds.length,
            totalBookings: bookings.length,
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
            riskTrends,
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
