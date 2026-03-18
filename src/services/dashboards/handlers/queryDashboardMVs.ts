// src/services/dashboards/handlers/queryDashboardMVs.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared MV query functions for all dashboard actors
// Each actor just passes its scope WHERE clause
// OPTIMIZED: parallel queries + in-memory TTL cache
// ─────────────────────────────────────────────────────────────────────────────

import prisma from "@/lib/prisma";

export type StoryType =
    | "students" | "bookings" | "problems" | "risk" | "departments" | "all";

export interface MVScope {
    studentWhere: string;
    bookingWhere: string;
    riskWhere: string;
}

// ─── In-memory TTL cache (60s) ──────────────────────────────────────────────
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { data: any; ts: number }>();

function getCached<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL_MS) return entry.data as T;
    return null;
}
function setCache(key: string, data: any) {
    cache.set(key, { data, ts: Date.now() });
    // Prevent memory leak — cap at 200 entries
    if (cache.size > 200) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
}

// ─── Student Story ──────────────────────────────────────────────────────────
export async function queryStudentStory(scope: MVScope) {
    const cacheKey = `students:${scope.studentWhere}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const w = scope.studentWhere;

    const [stats, bloodDist] = await Promise.all([
        prisma.$queryRawUnsafe<{ total: number; consulted: number }[]>(`
            SELECT
                SUM(total_students)::int AS total,
                SUM(consulted_students)::int AS consulted
            FROM mv_student_summary ${w}
        `),
        prisma.$queryRawUnsafe<{ code: string; cnt: number }[]>(`
            SELECT blood_group_code AS code, SUM(profile_count)::int AS cnt
            FROM mv_student_summary ${w}
            GROUP BY blood_group_code ORDER BY cnt DESC
        `),
    ]);

    const total = stats[0]?.total ?? 0;
    const consulted = stats[0]?.consulted ?? 0;

    const result = {
        totalStudents: total,
        consultedCount: consulted,
        neverConsultedCount: total - consulted,
        bloodDist: bloodDist.map(r => ({ label: r.code, count: r.cnt })),
    };
    setCache(cacheKey, result);
    return result;
}

// ─── Booking Story ──────────────────────────────────────────────────────────
export async function queryBookingStory(scope: MVScope) {
    const cacheKey = `bookings:${scope.bookingWhere}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const w = scope.bookingWhere;
    const andOrWhere = w ? "AND" : "WHERE";

    const [stats, trend] = await Promise.all([
        prisma.$queryRawUnsafe<{
            total_bookings: number; checked_in: number;
            no_show: number; completed: number;
        }[]>(`
            SELECT
                SUM(total_bookings)::int AS total_bookings,
                SUM(checked_in)::int AS checked_in,
                SUM(no_show)::int AS no_show,
                SUM(completed)::int AS completed
            FROM mv_booking_summary ${w}
        `),
        prisma.$queryRawUnsafe<{
            month: string; bookings: number; checked_in: number;
        }[]>(`
            SELECT month, SUM(total_bookings)::int AS bookings,
                   SUM(checked_in)::int AS checked_in
            FROM mv_booking_summary ${w}
            ${andOrWhere} month >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM')
            GROUP BY month ORDER BY month
        `),
    ]);

    const bs = stats[0] ?? { total_bookings: 0, checked_in: 0, no_show: 0, completed: 0 };

    const result = {
        totalBookings: bs.total_bookings,
        checkedInCount: bs.checked_in,
        noShowCount: bs.no_show,
        completedCount: bs.completed,
        monthlyTrend: trend.map(r => ({
            month: r.month, bookings: r.bookings, checkedIn: r.checked_in,
        })),
    };
    setCache(cacheKey, result);
    return result;
}

// ─── Problem Story ──────────────────────────────────────────────────────────
export async function queryProblemStory(scope: MVScope) {
    const cacheKey = `problems:${scope.bookingWhere}:${scope.studentWhere}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const bw = scope.bookingWhere;
    const sw = scope.studentWhere;
    const bAndOrWhere = bw ? "AND" : "WHERE";

    const [categories, incomeDist, parentalDist] = await Promise.all([
        prisma.$queryRawUnsafe<{ name: string; cnt: number }[]>(`
            SELECT problem_category_name_th AS name, SUM(total_bookings)::int AS cnt
            FROM mv_booking_summary ${bw}
            ${bAndOrWhere} problem_category_id != 0
            GROUP BY problem_category_name_th ORDER BY cnt DESC
        `),
        prisma.$queryRawUnsafe<{ code: string; cnt: number }[]>(`
            SELECT income_bracket_code AS code, SUM(profile_count)::int AS cnt
            FROM mv_student_summary ${sw}
            GROUP BY income_bracket_code ORDER BY cnt DESC
        `),
        prisma.$queryRawUnsafe<{ code: string; cnt: number }[]>(`
            SELECT parental_status_code AS code, SUM(profile_count)::int AS cnt
            FROM mv_student_summary ${sw}
            ${sw ? 'AND' : 'WHERE'} parental_status_code != 'UNKNOWN'
            GROUP BY parental_status_code ORDER BY cnt DESC
        `),
    ]);

    const result = {
        categories: categories.map(r => ({ label: r.name, count: r.cnt })),
        incomeDist: incomeDist.map(r => ({ label: r.code, count: r.cnt })),
        parentalDist: parentalDist.map(r => ({ label: r.code, count: r.cnt })),
    };
    setCache(cacheKey, result);
    return result;
}

// ─── Risk Story (EWMA-based) ────────────────────────────────────────────────
export async function queryRiskStory(scope: MVScope) {
    const cacheKey = `risk_ewma:${scope.riskWhere}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    // Build WHERE using the same scope columns but against the new MV
    // scope.riskWhere uses university_id, faculty_id, department_id, advisor_id
    const riskWhere = scope.riskWhere
        .replace(/mv_risk_summary/g, "mv_student_risk_score");

    const [bandDist, summary] = await Promise.all([
        // Distribution by risk band (CRITICAL, HIGH, MEDIUM, NORMAL)
        prisma.$queryRawUnsafe<
            { risk_band: string; count: number }[]
        >(`
            SELECT risk_band, COUNT(*)::int AS count
            FROM mv_student_risk_score ${scope.riskWhere}
            GROUP BY risk_band ORDER BY count DESC
        `),
        // Summary stats
        prisma.$queryRawUnsafe<
            { avg_score: number; total_students: number; critical_count: number; high_count: number }[]
        >(`
            SELECT
                ROUND(AVG(risk_score)::numeric, 2) AS avg_score,
                COUNT(*)::int AS total_students,
                COUNT(CASE WHEN risk_band = 'CRITICAL' THEN 1 END)::int AS critical_count,
                COUNT(CASE WHEN risk_band = 'HIGH' THEN 1 END)::int AS high_count
            FROM mv_student_risk_score ${scope.riskWhere}
        `),
    ]);

    const s = summary[0] || { avg_score: 0, total_students: 0, critical_count: 0, high_count: 0 };

    const result = {
        riskDistribution: {
            high: Number(s.critical_count) + Number(s.high_count),
            medium: bandDist.find(b => b.risk_band === "MEDIUM")?.count ?? 0,
            low: bandDist.find(b => b.risk_band === "NORMAL")?.count ?? 0,
        },
        distribution: bandDist.map(r => ({ label: r.risk_band, count: r.count })),
        highRiskCount: Number(s.critical_count) + Number(s.high_count),
        avgRiskScore: Number(s.avg_score),
        totalAssessed: Number(s.total_students),
        method: "EWMA+PeakMemory",
    };
    setCache(cacheKey, result);
    return result;
}

/**
 * Run all requested stories using MVs — IN PARALLEL
 */
export async function queryAllStories(
    scope: MVScope,
    story: StoryType,
): Promise<Record<string, any>> {
    // Single story — direct call
    if (story !== "all") {
        switch (story) {
            case "students": return { students: await queryStudentStory(scope) };
            case "bookings": return { bookings: await queryBookingStory(scope) };
            case "problems": return { problems: await queryProblemStory(scope) };
            case "risk": return { risk: await queryRiskStory(scope) };
        }
    }

    // All stories — run in PARALLEL
    const [students, bookings, problems, risk] = await Promise.all([
        queryStudentStory(scope),
        queryBookingStory(scope),
        queryProblemStory(scope),
        queryRiskStory(scope),
    ]);

    return { students, bookings, problems, risk };
}
