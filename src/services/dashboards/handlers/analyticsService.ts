// src/services/dashboards/handlers/analyticsService.ts
/**
 * Core Analytics Service — shared by Rector / Dean / Advisor.
 *
 * Architecture:
 *   buildScopeClause()  → role-aware WHERE fragment
 *   buildFilterClause() → user-filter WHERE fragment
 *   runAnalytics()      → single CTE mega-query → typed result
 */

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { LOAD_INDEX_WEIGHTS } from "@/features/dashboard/shared/analytics-types";
import type {
    AnalyticsParams,
    AnalyticsResult,
    SummaryStats,
    LoadIndexItem,
    ProblemCategoryItem,
    AttendanceGroupItem,
    CancellationGroupItem,
    RiskDistribution,
    TrendBucket,
} from "@/features/dashboard/shared/analytics-types";

// ─── Types ──────────────────────────────────────────────────────────────────
export type ScopeInfo = {
    scopeSQL: Prisma.Sql;
    universityId: number;
    resolvedFacultyIds?: number[];
    resolvedAdvisorId?: number;
};

// ─── Scope Builder ──────────────────────────────────────────────────────────
export async function buildScopeClause(
    role: string,
    accountId: number,
    universityId: number,
): Promise<ScopeInfo> {
    if (role === "MINISTRY" || role === "SUPER_ADMIN") {
        return {
            scopeSQL: Prisma.sql`AND 1=1`, // Open scope for national filters
            universityId,
        };
    }

    if (role === "RECTOR") {
        return {
            scopeSQL: Prisma.sql`AND b.university_id = ${universityId}`,
            universityId,
        };
    }

    if (role === "DEAN") {
        const faculties = await prisma.faculty.findMany({
            where: { dean_account_id: accountId, university_id: universityId },
            select: { faculty_id: true },
        });
        const ids = faculties.map((f) => f.faculty_id);
        if (ids.length === 0) {
            throw Object.assign(new Error("NO_FACULTY_ASSIGNED"), { status: 403 });
        }
        return {
            scopeSQL: Prisma.sql`AND b.university_id = ${universityId} AND sa.faculty_id = ANY(${ids}::int[])`,
            universityId,
            resolvedFacultyIds: ids,
        };
    }

    if (role === "ADVISOR") {
        const advisor = await prisma.advisor.findFirst({
            where: { account_id: accountId },
            select: { advisor_id: true, university_id: true },
        });
        if (!advisor) {
            throw Object.assign(new Error("ADVISOR_NOT_FOUND"), { status: 403 });
        }
        return {
            scopeSQL: Prisma.sql`AND b.university_id = ${advisor.university_id} AND sa.advisor_id = ${advisor.advisor_id}`,
            universityId: advisor.university_id,
            resolvedAdvisorId: advisor.advisor_id,
        };
    }

    // HEAD_CONSULTANT / CONSULTANT — same as rector scope
    return {
        scopeSQL: Prisma.sql`AND b.university_id = ${universityId}`,
        universityId,
    };
}

// ─── Filter Builder ─────────────────────────────────────────────────────────
export function buildFilterClause(params: AnalyticsParams): Prisma.Sql {
    const parts: Prisma.Sql[] = [];

    // Time filter
    if (!params.all_time && params.date_start && params.date_end) {
        parts.push(
            Prisma.sql`AND ts.time_slot_start_datetime >= ${params.date_start}::timestamptz 
                 AND ts.time_slot_start_datetime < (${params.date_end}::date + interval '1 day')::timestamptz`,
        );
    }

    // Faculty
    if (params.faculty_id) {
        parts.push(Prisma.sql`AND sa.faculty_id = ${params.faculty_id}`);
    }

    // Department
    if (params.department_id) {
        parts.push(Prisma.sql`AND sa.department_id = ${params.department_id}`);
    }

    // National Filters (Ministry/SuperAdmin)
    if (params.university_id) {
        parts.push(Prisma.sql`AND b.university_id = ${params.university_id}`);
    } else {
        const uniFilters: Prisma.Sql[] = [];
        if (params.province_id) {
            uniFilters.push(Prisma.sql`province_id = ${params.province_id}`);
        } else if (params.region_id) {
            uniFilters.push(Prisma.sql`province_id IN (SELECT province_id FROM province WHERE region_id = ${params.region_id})`);
        }
        if (params.university_type) {
            uniFilters.push(Prisma.sql`university_type = ${params.university_type}::"UniversityType"`);
        }

        if (uniFilters.length > 0) {
            parts.push(Prisma.sql`AND b.university_id IN (SELECT university_id FROM university WHERE ${Prisma.join(uniFilters, " AND ")})`);
        }
    }

    // Gender
    if (params.gender) {
        parts.push(Prisma.sql`AND sp.student_gender = ${params.gender}::text`);
    }

    // Problem category
    if (params.problem_category_id) {
        parts.push(Prisma.sql`AND b.problem_category_id = ${params.problem_category_id}`);
    }

    // Booking status (multi-value)
    if (params.booking_status && params.booking_status.length > 0) {
        parts.push(Prisma.sql`AND b.booking_status::text = ANY(${params.booking_status}::text[])`);
    }

    // Service mode
    if (params.online_channel_category_id) {
        // online_channel implies ONLINE
        parts.push(
            Prisma.sql`AND b.booking_service_mode = 'ONLINE' AND b.online_channel_category_id = ${params.online_channel_category_id}`,
        );
    } else if (params.service_mode) {
        parts.push(Prisma.sql`AND b.booking_service_mode = ${params.service_mode}::text`);
    }

    if (parts.length === 0) return Prisma.sql``;
    return Prisma.join(parts, " ");
}

// ─── Time Bucket Helper ─────────────────────────────────────────────────────
function getTimeBucketSQL(params: AnalyticsParams): { bucketExpr: string; bucketLabel: string } {
    if (params.all_time || !params.date_start || !params.date_end) {
        return { bucketExpr: "date_trunc('month', ts.time_slot_start_datetime)", bucketLabel: "month" };
    }
    const start = new Date(params.date_start);
    const end = new Date(params.date_end);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (days <= 31) return { bucketExpr: "date_trunc('day', ts.time_slot_start_datetime)", bucketLabel: "day" };
    if (days <= 120) return { bucketExpr: "date_trunc('week', ts.time_slot_start_datetime)", bucketLabel: "week" };
    return { bucketExpr: "date_trunc('month', ts.time_slot_start_datetime)", bucketLabel: "month" };
}

// ─── Group-by column helper ─────────────────────────────────────────────────
type GroupLevel = "faculty" | "department" | "university" | "region";

function getGroupColumns(level: GroupLevel): { idCol: string; codeCol: string; nameCol: string; joinTable: string } {
    if (level === "region") {
        return {
            idCol: "rg.region_id",
            codeCol: "rg.region_id::text",
            nameCol: "rg.region_name_th",
            joinTable: "JOIN university u ON u.university_id = b.university_id JOIN province p ON p.province_id = u.province_id JOIN region rg ON rg.region_id = p.region_id",
        };
    }
    if (level === "university") {
        return {
            idCol: "b.university_id",
            codeCol: "u.university_code",
            nameCol: "u.university_name_th",
            joinTable: "JOIN university u ON u.university_id = b.university_id",
        };
    }
    if (level === "department") {
        return {
            idCol: "sa.department_id",
            codeCol: "d.department_code",
            nameCol: "d.department_name_th",
            joinTable: "LEFT JOIN department d ON d.university_id = b.university_id AND d.department_id = sa.department_id",
        };
    }
    return {
        idCol: "sa.faculty_id",
        codeCol: "f.faculty_code",
        nameCol: "f.faculty_name_th",
        joinTable: "LEFT JOIN faculty f ON f.university_id = b.university_id AND f.faculty_id = sa.faculty_id",
    };
}

// ─── Main Query Runner ──────────────────────────────────────────────────────
export async function runAnalytics(
    scope: ScopeInfo,
    params: AnalyticsParams,
    groupLevel: GroupLevel = "faculty",
    includeStudentRank = false,
): Promise<AnalyticsResult> {
    // Resolve faculty_code → faculty_id if needed
    if (params.faculty_code && !params.faculty_id) {
        const fac = await prisma.faculty.findFirst({
            where: { faculty_code: params.faculty_code, university_id: scope.universityId },
            select: { faculty_id: true },
        });
        if (fac) {
            params = { ...params, faculty_id: fac.faculty_id };
        }
    }

    const filterSQL = buildFilterClause(params);
    const { bucketExpr } = getTimeBucketSQL(params);
    const grp = getGroupColumns(groupLevel);
    const w = LOAD_INDEX_WEIGHTS;

    // ── 1. SUMMARY (single row) ──
    const summaryRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT 
      COUNT(*)::int AS total_bookings,
      COUNT(bc.booking_id)::int AS cancelled_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'CHECKED_IN' THEN 1 END)::int AS checked_in_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'LATE' THEN 1 END)::int AS late_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show_count,
      ROUND(AVG(bo.booking_outcome_risk_level)::numeric, 2) AS avg_risk,
      COUNT(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 END)::int AS high_risk_count,
      COUNT(bo.booking_outcome_risk_level)::int AS total_with_risk
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    `,
    );

    const sr = summaryRows[0] || {};
    const total = Number(sr.total_bookings) || 0;
    const summary: SummaryStats = {
        totalBookings: total,
        cancelledCount: Number(sr.cancelled_count) || 0,
        checkedInCount: Number(sr.checked_in_count) || 0,
        lateCount: Number(sr.late_count) || 0,
        noShowCount: Number(sr.no_show_count) || 0,
        checkedInRate: total > 0 ? Number(sr.checked_in_count) / total : 0,
        lateRate: total > 0 ? Number(sr.late_count) / total : 0,
        noShowRate: total > 0 ? Number(sr.no_show_count) / total : 0,
        avgRisk: sr.avg_risk != null ? Number(sr.avg_risk) : null,
        highRiskRate: Number(sr.total_with_risk) > 0 ? Number(sr.high_risk_count) / Number(sr.total_with_risk) : 0,
    };

    // ── 2. LOAD INDEX by group ──
    const loadRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT 
      ${Prisma.raw(grp.idCol)} AS group_id,
      ${Prisma.raw(grp.codeCol)} AS group_code,
      ${Prisma.raw(grp.nameCol)} AS group_name,
      COUNT(*)::int AS total_bookings,
      COUNT(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 END)::int AS high_risk_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'LATE' THEN 1 END)::int AS late_count,
      COUNT(bc.booking_id)::int AS cancelled_count
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    ${Prisma.raw(grp.joinTable)}
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1, 2, 3
    ORDER BY 4 DESC
    `,
    );

    const loadIndex: LoadIndexItem[] = loadRows.map((r) => {
        const tb = Number(r.total_bookings);
        const hr = Number(r.high_risk_count);
        const ns = Number(r.no_show_count);
        const lt = Number(r.late_count);
        const cc = Number(r.cancelled_count);
        return {
            groupId: Number(r.group_id),
            groupCode: r.group_code || "",
            groupName: r.group_name || "",
            totalBookings: tb,
            highRiskCount: hr,
            noShowCount: ns,
            lateCount: lt,
            cancelledCount: cc,
            loadIndex: tb * w.booking + hr * w.highRisk + ns * w.noShow + lt * w.late + cc * w.cancelled,
        };
    });

    // ── 3. PROBLEM CATEGORIES (Top 10 + Others) ──
    const problemRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      pc.problem_category_id AS category_id,
      pc.problem_category_code AS category_code,
      pc.problem_category_name_th AS category_name_th,
      pc.problem_category_name_en AS category_name_en,
      COUNT(*)::int AS cnt,
      COUNT(CASE WHEN sp.student_gender = 'MALE' THEN 1 END)::int AS male,
      COUNT(CASE WHEN sp.student_gender = 'FEMALE' THEN 1 END)::int AS female,
      COUNT(CASE WHEN sp.student_gender NOT IN ('MALE','FEMALE') AND sp.student_gender IS NOT NULL THEN 1 END)::int AS lgbtq,
      COUNT(CASE WHEN sp.student_gender IS NULL THEN 1 END)::int AS unknown_g,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC)::int AS rn
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1, 2, 3, 4
    ORDER BY cnt DESC
    LIMIT 12
    `,
    );

    const problemCategories: ProblemCategoryItem[] = problemRows.map((r) => ({
        categoryId: Number(r.category_id),
        categoryCode: r.category_code,
        categoryNameTh: r.category_name_th,
        categoryNameEn: r.category_name_en,
        count: Number(r.cnt),
        genderBreakdown: {
            male: Number(r.male),
            female: Number(r.female),
            lgbtq: Number(r.lgbtq),
            unknown: Number(r.unknown_g),
        },
        rank: Number(r.rn),
    }));

    // ── 4. ATTENDANCE by group ──
    const attRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      ${Prisma.raw(grp.idCol)} AS group_id,
      ${Prisma.raw(grp.codeCol)} AS group_code,
      ${Prisma.raw(grp.nameCol)} AS group_name,
      COUNT(*)::int AS total,
      COUNT(CASE WHEN ba.booking_attendance_status = 'CHECKED_IN' THEN 1 END)::int AS checked_in,
      COUNT(CASE WHEN ba.booking_attendance_status = 'LATE' THEN 1 END)::int AS late,
      COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    ${Prisma.raw(grp.joinTable)}
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1, 2, 3
    ORDER BY total DESC
    `,
    );

    const attendanceByGroup: AttendanceGroupItem[] = attRows.map((r) => {
        const t = Number(r.total) || 1;
        return {
            groupId: Number(r.group_id),
            groupCode: r.group_code || "",
            groupName: r.group_name || "",
            checkedIn: Number(r.checked_in),
            late: Number(r.late),
            noShow: Number(r.no_show),
            total: Number(r.total),
            checkedInRate: Number(r.checked_in) / t,
            lateRate: Number(r.late) / t,
            noShowRate: Number(r.no_show) / t,
        };
    });

    // ── 5. CANCELLATION by group ──
    const cancelRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      ${Prisma.raw(grp.idCol)} AS group_id,
      ${Prisma.raw(grp.codeCol)} AS group_code,
      ${Prisma.raw(grp.nameCol)} AS group_name,
      COUNT(bc.booking_id)::int AS cancelled_count,
      COUNT(*)::int AS total_bookings
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    ${Prisma.raw(grp.joinTable)}
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1, 2, 3
    HAVING COUNT(bc.booking_id) > 0
    ORDER BY cancelled_count DESC
    `,
    );

    // Top reasons per group (separate query for simplicity)
    const reasonRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      ${Prisma.raw(grp.idCol)} AS group_id,
      cr.cancellation_reason_id AS reason_id,
      COALESCE(cr.cancellation_reason_name_en, cr.cancellation_reason_name_th) AS reason_name,
      COUNT(*)::int AS cnt
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    ${Prisma.raw(grp.joinTable)}
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    JOIN cancellation_reason cr ON cr.cancellation_reason_id = bc.cancellation_reason_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1, 2, 3
    ORDER BY group_id, cnt DESC
    `,
    );

    const reasonsByGroup = new Map<number, { reasonId: number; reasonName: string; count: number }[]>();
    for (const r of reasonRows) {
        const gid = Number(r.group_id);
        if (!reasonsByGroup.has(gid)) reasonsByGroup.set(gid, []);
        reasonsByGroup.get(gid)!.push({
            reasonId: Number(r.reason_id),
            reasonName: r.reason_name,
            count: Number(r.cnt),
        });
    }

    const cancellationByGroup: CancellationGroupItem[] = cancelRows.map((r) => {
        const tb = Number(r.total_bookings) || 1;
        const gid = Number(r.group_id);
        return {
            groupId: gid,
            groupCode: r.group_code || "",
            groupName: r.group_name || "",
            cancelledCount: Number(r.cancelled_count),
            cancelRate: Number(r.cancelled_count) / tb,
            topReasons: (reasonsByGroup.get(gid) || []).slice(0, 5),
        };
    });

    // ── 6. RISK DISTRIBUTION ──
    const riskRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      bo.booking_outcome_risk_level AS level,
      COUNT(*)::int AS cnt
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE bo.booking_outcome_risk_level IS NOT NULL
      ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1
    ORDER BY 1
    `,
    );

    const totalWithRisk = riskRows.reduce((s, r) => s + Number(r.cnt), 0);
    const highRiskCount = riskRows.filter((r) => Number(r.level) >= 4).reduce((s, r) => s + Number(r.cnt), 0);
    const weightedSum = riskRows.reduce((s, r) => s + Number(r.level) * Number(r.cnt), 0);

    const riskDistribution: RiskDistribution = {
        levels: riskRows.map((r) => ({
            level: Number(r.level),
            count: Number(r.cnt),
            rate: totalWithRisk > 0 ? Number(r.cnt) / totalWithRisk : 0,
        })),
        avgRisk: totalWithRisk > 0 ? Math.round((weightedSum / totalWithRisk) * 100) / 100 : null,
        highRiskRate: totalWithRisk > 0 ? highRiskCount / totalWithRisk : 0,
        highRiskCount,
        totalWithRisk,
    };

    // ── 7. TREND ──
    const trendRows = await prisma.$queryRaw<any[]>(
        Prisma.sql`
    SELECT
      ${Prisma.raw(bucketExpr)}::text AS bucket,
      COUNT(*)::int AS total_bookings,
      COUNT(bc.booking_id)::int AS cancelled_count,
      COUNT(CASE WHEN ba.booking_attendance_status = 'NO_SHOW' THEN 1 END)::int AS no_show_count,
      ROUND(AVG(bo.booking_outcome_risk_level)::numeric, 2) AS avg_risk,
      COUNT(CASE WHEN bo.booking_outcome_risk_level >= 4 THEN 1 END)::int AS high_risk_count
    FROM booking b
    JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
    JOIN student_academic sa ON sa.university_id = b.university_id AND sa.student_id = b.student_id
    LEFT JOIN student_profile sp ON sp.university_id = b.university_id AND sp.student_id = b.student_id
    LEFT JOIN booking_outcome bo ON bo.university_id = b.university_id AND bo.booking_id = b.booking_id
    LEFT JOIN booking_attendance ba ON ba.university_id = b.university_id AND ba.booking_id = b.booking_id
    LEFT JOIN booking_cancellation bc ON bc.university_id = b.university_id AND bc.booking_id = b.booking_id
    WHERE 1=1 ${scope.scopeSQL} ${filterSQL}
    GROUP BY 1
    ORDER BY 1
    `,
    );

    const trend: TrendBucket[] = trendRows.map((r) => ({
        bucket: r.bucket?.substring(0, 10) || "",
        totalBookings: Number(r.total_bookings),
        cancelledCount: Number(r.cancelled_count),
        noShowCount: Number(r.no_show_count),
        avgRisk: r.avg_risk != null ? Number(r.avg_risk) : null,
        highRiskCount: Number(r.high_risk_count),
    }));

    return {
        summary,
        loadIndex,
        problemCategories,
        attendanceByGroup,
        cancellationByGroup,
        riskDistribution,
        trend,
    };
}
