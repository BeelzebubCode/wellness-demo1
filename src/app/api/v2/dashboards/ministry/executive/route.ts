// src/app/api/v2/dashboards/ministry/executive/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Executive Decision-Support API — Insights, Alerts, KPIs, Recommendations
// Powered by existing Materialized Views (no schema changes)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface KPI {
    label: string;
    value: number;
    suffix: string;
    trend: number; // % change vs previous period
    trendDirection: "up" | "down" | "flat";
    trendIsGood: boolean; // is the direction good or bad?
    icon: string;
}

interface Insight {
    id: string;
    icon: string;
    title: string;
    description: string;
    severity: "info" | "success" | "warning" | "critical";
    metric?: { value: number; suffix: string };
}

interface Alert {
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    universityName?: string;
    universityId?: number;
    metric?: { value: number; label: string };
    action?: string;
}

interface AreaFocus {
    rank: number;
    name: string;
    type: "region" | "university";
    id: number;
    reason: string;
    score: number;
    metrics: { label: string; value: string }[];
}

interface Recommendation {
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    icon: string;
    data: { label: string; value: string }[];
}

interface TrendPoint {
    period: string;
    bookings: number;
    checkedIn: number;
    noShow: number;
    students: number;
}

// ─── Helper: Period comparison ──────────────────────────────────────────────

function calcTrend(current: number, previous: number): { trend: number; direction: "up" | "down" | "flat" } {
    if (previous === 0) return { trend: current > 0 ? 100 : 0, direction: current > 0 ? "up" : "flat" };
    const pct = ((current - previous) / previous) * 100;
    return {
        trend: Math.round(Math.abs(pct) * 10) / 10,
        direction: pct > 1 ? "up" : pct < -1 ? "down" : "flat",
    };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            select: { roleCategory: { select: { code: true } } },
        });

        if (!account || !["MINISTRY", "SUPER_ADMIN"].includes(account.roleCategory.code)) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const startTime = Date.now();

        // ═══════════════════════════════════════════════════════════════════
        // 1. Fetch all base data in parallel from MVs
        // ═══════════════════════════════════════════════════════════════════

        const [
            // Current period totals
            studentStats,
            bookingStats,
            riskStats,
            // Monthly trend (all time)
            monthlyTrend,
            // Regional breakdown
            regionalBookings,
            // Per-university risk metrics (top risky)
            riskyUniversities,
            // No-show anomalies
            noShowByUni,
            // University count
            uniCount,
            // Data range
            dataRange,
        ] = await Promise.all([
            // Students
            prisma.$queryRawUnsafe<{ total: number; consulted: number }[]>(`
                SELECT SUM(total_students)::int AS total,
                       SUM(consulted_students)::int AS consulted
                FROM mv_student_summary
            `),
            // Bookings
            prisma.$queryRawUnsafe<{
                total_bookings: number; checked_in: number;
                no_show: number; completed: number;
            }[]>(`
                SELECT
                    SUM(total_bookings)::int AS total_bookings,
                    SUM(CASE WHEN attendance_status IN ('CHECKED_IN','LATE') THEN total_bookings ELSE 0 END)::int AS checked_in,
                    SUM(CASE WHEN attendance_status = 'NO_SHOW' THEN total_bookings ELSE 0 END)::int AS no_show,
                    SUM(CASE WHEN booking_status = 'COMPLETED' THEN total_bookings ELSE 0 END)::int AS completed
                FROM mv_booking_summary
            `),
            // Risk
            prisma.$queryRawUnsafe<{
                avg_score: number; total_students: number;
                critical_count: number; high_count: number;
            }[]>(`
                SELECT
                    ROUND(AVG(risk_score)::numeric, 2) AS avg_score,
                    COUNT(*)::int AS total_students,
                    COUNT(CASE WHEN risk_band = 'CRITICAL' THEN 1 END)::int AS critical_count,
                    COUNT(CASE WHEN risk_band = 'HIGH' THEN 1 END)::int AS high_count
                FROM mv_student_risk_score
            `),
            // Monthly trend
            prisma.$queryRawUnsafe<{
                month: string; bookings: number; checked_in: number; no_show: number;
            }[]>(`
                SELECT month,
                       SUM(total_bookings)::int AS bookings,
                       SUM(CASE WHEN attendance_status IN ('CHECKED_IN','LATE') THEN total_bookings ELSE 0 END)::int AS checked_in,
                       SUM(CASE WHEN attendance_status = 'NO_SHOW' THEN total_bookings ELSE 0 END)::int AS no_show
                FROM mv_booking_summary
                GROUP BY month ORDER BY month
            `),
            // Regional bookings
            prisma.$queryRawUnsafe<{
                region_name_th: string; region_id: number; total: number;
                no_show: number; high_risk: number;
            }[]>(`
                SELECT r.region_name_th, r.region_id,
                       COALESCE(SUM(bs.total_bookings), 0)::int AS total,
                       COALESCE(SUM(CASE WHEN bs.attendance_status = 'NO_SHOW' THEN bs.total_bookings ELSE 0 END), 0)::int AS no_show,
                       0 AS high_risk
                FROM region r
                JOIN province p ON p.region_id = r.region_id
                JOIN university u ON u.province_id = p.province_id AND u.university_is_active = true
                LEFT JOIN mv_booking_summary bs ON bs.university_id = u.university_id
                GROUP BY r.region_id, r.region_name_th
                ORDER BY total DESC
            `),
            // Risky universities (high risk % from risk score MV)
            prisma.$queryRawUnsafe<{
                university_id: number; university_name_th: string;
                total: number; critical: number; high: number; risk_pct: number;
            }[]>(`
                SELECT rs.university_id,
                       u.university_name_th,
                       COUNT(*)::int AS total,
                       COUNT(CASE WHEN rs.risk_band = 'CRITICAL' THEN 1 END)::int AS critical,
                       COUNT(CASE WHEN rs.risk_band = 'HIGH' THEN 1 END)::int AS high,
                       ROUND(
                           (COUNT(CASE WHEN rs.risk_band IN ('CRITICAL','HIGH') THEN 1 END)::numeric /
                            NULLIF(COUNT(*), 0)) * 100, 1
                       ) AS risk_pct
                FROM mv_student_risk_score rs
                JOIN university u ON u.university_id = rs.university_id
                GROUP BY rs.university_id, u.university_name_th
                HAVING COUNT(CASE WHEN rs.risk_band IN ('CRITICAL','HIGH') THEN 1 END) > 0
                ORDER BY risk_pct DESC
                LIMIT 10
            `),
            // No-show by university
            prisma.$queryRawUnsafe<{
                university_id: number; university_name_th: string;
                total: number; no_show: number; no_show_pct: number;
            }[]>(`
                SELECT bs.university_id,
                       u.university_name_th,
                       SUM(bs.total_bookings)::int AS total,
                       SUM(CASE WHEN bs.attendance_status = 'NO_SHOW' THEN bs.total_bookings ELSE 0 END)::int AS no_show,
                       ROUND(
                           (SUM(CASE WHEN bs.attendance_status = 'NO_SHOW' THEN bs.total_bookings ELSE 0 END)::numeric /
                            NULLIF(SUM(bs.total_bookings), 0)) * 100, 1
                       ) AS no_show_pct
                FROM mv_booking_summary bs
                JOIN university u ON u.university_id = bs.university_id
                GROUP BY bs.university_id, u.university_name_th
                HAVING SUM(bs.total_bookings) > 10
                ORDER BY no_show_pct DESC
                LIMIT 10
            `),
            // University count
            prisma.university.count({ where: { university_is_active: true } }),
            // Data range
            prisma.$queryRawUnsafe<{ min_month: string; max_month: string }[]>(`
                SELECT MIN(month) AS min_month, MAX(month) AS max_month FROM mv_booking_summary
            `),
        ]);

        // ═══════════════════════════════════════════════════════════════════
        // 2. Compute KPIs
        // ═══════════════════════════════════════════════════════════════════

        const totalStudents = studentStats[0]?.total ?? 0;
        const consultedStudents = studentStats[0]?.consulted ?? 0;
        const totalBookings = bookingStats[0]?.total_bookings ?? 0;
        const checkedIn = bookingStats[0]?.checked_in ?? 0;
        const noShowTotal = bookingStats[0]?.no_show ?? 0;
        const completedTotal = bookingStats[0]?.completed ?? 0;
        const highRiskTotal = Number(riskStats[0]?.critical_count ?? 0) + Number(riskStats[0]?.high_count ?? 0);
        const avgRiskScore = Number(riskStats[0]?.avg_score ?? 0);

        const accessRate = totalStudents > 0 ? Math.round((consultedStudents / totalStudents) * 1000) / 10 : 0;
        const successRate = totalBookings > 0 ? Math.round((completedTotal / totalBookings) * 1000) / 10 : 0;
        const noShowRate = totalBookings > 0 ? Math.round((noShowTotal / totalBookings) * 1000) / 10 : 0;

        // YoY comparison from monthly trend
        const sortedMonths = [...monthlyTrend].sort((a, b) => a.month.localeCompare(b.month));
        const currentYearMonths = sortedMonths.slice(-12);
        const previousYearMonths = sortedMonths.slice(-24, -12);

        const currentYearBookings = currentYearMonths.reduce((s, m) => s + m.bookings, 0);
        const previousYearBookings = previousYearMonths.reduce((s, m) => s + m.bookings, 0);
        const bookingTrend = calcTrend(currentYearBookings, previousYearBookings);

        const currentYearNoShow = currentYearMonths.reduce((s, m) => s + m.no_show, 0);
        const previousYearNoShow = previousYearMonths.reduce((s, m) => s + m.no_show, 0);
        const noShowTrend = calcTrend(currentYearNoShow, previousYearNoShow);

        // Find fastest growing region YoY
        const topRegion = regionalBookings[0];
        const leastRegion = [...regionalBookings].sort((a, b) => a.total - b.total)[0];

        const kpis: KPI[] = [
            {
                label: "% เข้าถึงบริการ",
                value: accessRate,
                suffix: "%",
                trend: bookingTrend.trend,
                trendDirection: bookingTrend.direction,
                trendIsGood: bookingTrend.direction === "up",
                icon: "users",
            },
            {
                label: "อัตราสำเร็จ",
                value: successRate,
                suffix: "%",
                trend: 0,
                trendDirection: "flat",
                trendIsGood: true,
                icon: "check-circle",
            },
            {
                label: "อัตราไม่มาตามนัด",
                value: noShowRate,
                suffix: "%",
                trend: noShowTrend.trend,
                trendDirection: noShowTrend.direction,
                trendIsGood: noShowTrend.direction === "down",
                icon: "user-x",
            },
            {
                label: "เคสเสี่ยงสูง",
                value: highRiskTotal,
                suffix: "ราย",
                trend: 0,
                trendDirection: "flat",
                trendIsGood: false,
                icon: "alert-triangle",
            },
        ];

        // ═══════════════════════════════════════════════════════════════════
        // 3. Generate Insights
        // ═══════════════════════════════════════════════════════════════════

        const insights: Insight[] = [];

        // Insight 1: Total users with YoY comparison
        insights.push({
            id: "users-total",
            icon: "bar-chart-3",
            title: `มีผู้ใช้ระบบ ${totalStudents.toLocaleString()} คน`,
            description: consultedStudents > 0
                ? `เข้าถึงบริการแล้ว ${consultedStudents.toLocaleString()} คน (${accessRate}%) — ยังไม่เคยเข้าใช้อีก ${(totalStudents - consultedStudents).toLocaleString()} คน`
                : "ยังไม่มีนิสิตเข้าใช้บริการ",
            severity: accessRate > 50 ? "success" : accessRate > 20 ? "info" : "warning",
            metric: { value: accessRate, suffix: "%" },
        });

        // Insight 2: Booking trend YoY
        if (previousYearBookings > 0) {
            insights.push({
                id: "booking-yoy",
                icon: bookingTrend.direction === "up" ? "trending-up" : "trending-down",
                title: `การใช้บริการ ${bookingTrend.direction === "up" ? "เพิ่มขึ้น" : "ลดลง"} ${bookingTrend.trend}% จากปีที่แล้ว`,
                description: `ปีนี้ ${currentYearBookings.toLocaleString()} ครั้ง vs ปีที่แล้ว ${previousYearBookings.toLocaleString()} ครั้ง`,
                severity: bookingTrend.direction === "up" ? "success" : "warning",
                metric: { value: bookingTrend.trend, suffix: "%" },
            });
        }

        // Insight 3: Top region
        if (topRegion) {
            insights.push({
                id: "top-region",
                icon: "trophy",
                title: `${topRegion.region_name_th} มีการใช้บริการสูงสุด`,
                description: `${topRegion.total.toLocaleString()} ครั้ง — คิดเป็น ${totalBookings > 0 ? Math.round((topRegion.total / totalBookings) * 100) : 0}% ของทั้งหมด`,
                severity: "info",
                metric: { value: topRegion.total, suffix: "ครั้ง" },
            });
        }

        // Insight 4: No-show rate
        if (noShowRate > 5) {
            insights.push({
                id: "no-show-rate",
                icon: "alert-triangle",
                title: `อัตราไม่มาตามนัด ${noShowRate}%`,
                description: `จากทั้งหมด ${totalBookings.toLocaleString()} ครั้ง ไม่มา ${noShowTotal.toLocaleString()} ครั้ง — ${noShowTrend.direction === "up" ? "เพิ่มขึ้น" : noShowTrend.direction === "down" ? "ลดลง" : "คงที่"}จากปีก่อน`,
                severity: noShowRate > 20 ? "critical" : noShowRate > 10 ? "warning" : "info",
                metric: { value: noShowRate, suffix: "%" },
            });
        }

        // Insight 5: Risk overview
        if (highRiskTotal > 0) {
            insights.push({
                id: "risk-overview",
                icon: "shield-alert",
                title: `นิสิตกลุ่มเสี่ยงสูง ${highRiskTotal.toLocaleString()} ราย`,
                description: `ค่าเฉลี่ยความเสี่ยงระดับชาติ ${avgRiskScore} — กระจายใน ${riskyUniversities.length} มหาวิทยาลัย`,
                severity: highRiskTotal > 1000 ? "critical" : highRiskTotal > 100 ? "warning" : "info",
                metric: { value: highRiskTotal, suffix: "ราย" },
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // 4. Generate Alerts
        // ═══════════════════════════════════════════════════════════════════

        const alerts: Alert[] = [];

        // Universities with extreme no-show
        for (const u of noShowByUni.slice(0, 5)) {
            const pct = Number(u.no_show_pct);
            if (pct > 25) {
                alerts.push({
                    id: `noshow-${u.university_id}`,
                    severity: pct > 40 ? "critical" : "warning",
                    title: `No-Show สูงผิดปกติ`,
                    description: `${u.university_name_th} — อัตราไม่มาตามนัด ${pct}% (${u.no_show}/${u.total} ครั้ง)`,
                    universityName: u.university_name_th,
                    universityId: u.university_id,
                    metric: { value: pct, label: "% no-show" },
                    action: "ตรวจสอบระบบนัดหมายและส่งทีมลงพื้นที่",
                });
            }
        }

        // Universities with high risk concentration
        for (const u of riskyUniversities.slice(0, 5)) {
            const pct = Number(u.risk_pct);
            if (pct > 15) {
                alerts.push({
                    id: `risk-${u.university_id}`,
                    severity: pct > 30 ? "critical" : "warning",
                    title: `ความเสี่ยงสูงกระจุกตัว`,
                    description: `${u.university_name_th} — ${pct}% ของนิสิตอยู่ในกลุ่มเสี่ยงสูง/วิกฤต (${u.critical + u.high} ราย)`,
                    universityName: u.university_name_th,
                    universityId: u.university_id,
                    metric: { value: pct, label: "% high risk" },
                    action: "เพิ่มบุคลากรให้คำปรึกษาเร่งด่วน",
                });
            }
        }

        // Sort alerts by severity
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        // ═══════════════════════════════════════════════════════════════════
        // 5. Area Focus (priority ranking)
        // ═══════════════════════════════════════════════════════════════════

        const areaFocus: AreaFocus[] = [];

        // Top regions by no-show rate
        for (const r of regionalBookings) {
            const nsRate = r.total > 0 ? Math.round((r.no_show / r.total) * 1000) / 10 : 0;
            if (r.total > 0) {
                areaFocus.push({
                    rank: 0,
                    name: r.region_name_th,
                    type: "region",
                    id: r.region_id,
                    reason: nsRate > 15 ? "No-Show สูง" : r.total > (totalBookings / regionalBookings.length) * 1.5 ? "ปริมาณงานสูง" : "ปกติ",
                    score: r.total + (nsRate * 100),
                    metrics: [
                        { label: "การนัดหมาย", value: r.total.toLocaleString() },
                        { label: "No-Show", value: `${nsRate}%` },
                    ],
                });
            }
        }

        // Add top risky universities
        for (const u of riskyUniversities.slice(0, 5)) {
            areaFocus.push({
                rank: 0,
                name: u.university_name_th,
                type: "university",
                id: u.university_id,
                reason: `เสี่ยงสูง ${u.risk_pct}%`,
                score: Number(u.risk_pct) * 100 + (u.critical + u.high),
                metrics: [
                    { label: "นิสิตทั้งหมด", value: u.total.toLocaleString() },
                    { label: "เสี่ยงสูง", value: `${u.critical + u.high} ราย` },
                ],
            });
        }

        // Sort by score desc, assign ranks
        areaFocus.sort((a, b) => b.score - a.score);
        areaFocus.forEach((a, i) => { a.rank = i + 1; });

        // ═══════════════════════════════════════════════════════════════════
        // 6. Recommendations (fully data-driven)
        // ═══════════════════════════════════════════════════════════════════

        const recommendations: Recommendation[] = [];

        // --- No-Show recommendation with top 3 worst universities ---
        if (noShowRate > 5) {
            const top3NoShow = noShowByUni.slice(0, 3).filter(u => Number(u.no_show_pct) > 5);
            recommendations.push({
                id: "rec-noshow",
                priority: noShowRate > 15 ? "high" : "medium",
                title: `แก้ปัญหา No-Show ${noShowRate}%`,
                description: noShowRate > 15
                    ? `ไม่มาตามนัด ${noShowTotal.toLocaleString()} จาก ${totalBookings.toLocaleString()} ครั้ง — ต้องเพิ่มระบบแจ้งเตือนก่อนนัด`
                    : `อัตราไม่มาตามนัด ${noShowRate}% — ติดตามมหาวิทยาลัยที่สูงผิดปกติ`,
                icon: "smartphone",
                data: top3NoShow.map(u => ({
                    label: u.university_name_th,
                    value: `${u.no_show_pct}% (${u.no_show}/${u.total})`,
                })),
            });
        }

        // --- Risk recommendation with top 3 risky universities ---
        if (highRiskTotal > 0) {
            const top3Risk = riskyUniversities.slice(0, 3);
            recommendations.push({
                id: "rec-risk",
                priority: highRiskTotal > 100 ? "high" : "medium",
                title: `ดูแลนิสิตเสี่ยงสูง ${highRiskTotal.toLocaleString()} ราย`,
                description: `กระจายใน ${riskyUniversities.length} มหาวิทยาลัย — ค่าเฉลี่ยความเสี่ยงระดับชาติ ${avgRiskScore}`,
                icon: "user-plus",
                data: top3Risk.map(u => ({
                    label: u.university_name_th,
                    value: `${u.critical + u.high} ราย (${u.risk_pct}%)`,
                })),
            });
        }

        // --- Access rate recommendation with never-consulted count ---
        if (accessRate < 50) {
            const neverConsulted = totalStudents - consultedStudents;
            recommendations.push({
                id: "rec-access",
                priority: accessRate < 20 ? "high" : "medium",
                title: `เพิ่มการเข้าถึงบริการ (ปัจจุบัน ${accessRate}%)`,
                description: `นิสิต ${neverConsulted.toLocaleString()} คน ยังไม่เคยเข้าใช้บริการเลย`,
                icon: "megaphone",
                data: [
                    { label: "นิสิตทั้งหมด", value: `${totalStudents.toLocaleString()} คน` },
                    { label: "เข้าถึงแล้ว", value: `${consultedStudents.toLocaleString()} คน (${accessRate}%)` },
                    { label: "ยังไม่เข้าถึง", value: `${neverConsulted.toLocaleString()} คน` },
                ],
            });
        }

        // --- Region gap recommendation ---
        if (leastRegion && totalBookings > 0) {
            const lrPct = Math.round((leastRegion.total / totalBookings) * 100);
            const topPct = topRegion ? Math.round((topRegion.total / totalBookings) * 100) : 0;
            if (lrPct < 10 && topRegion) {
                recommendations.push({
                    id: "rec-region",
                    priority: "medium",
                    title: `ปิดช่องว่างระหว่างภาค`,
                    description: `${leastRegion.region_name_th} ใช้บริการน้อยกว่า${topRegion.region_name_th} ${topPct - lrPct} เท่า`,
                    icon: "map",
                    data: [
                        { label: topRegion.region_name_th, value: `${topRegion.total.toLocaleString()} ครั้ง (${topPct}%)` },
                        { label: leastRegion.region_name_th, value: `${leastRegion.total.toLocaleString()} ครั้ง (${lrPct}%)` },
                    ],
                });
            }
        }

        // --- Success rate recommendation ---
        if (successRate < 80 && totalBookings > 50) {
            const incompleteCount = totalBookings - completedTotal;
            recommendations.push({
                id: "rec-success",
                priority: successRate < 50 ? "high" : "medium",
                title: `เพิ่มอัตราสำเร็จ (ปัจจุบัน ${successRate}%)`,
                description: `มี ${incompleteCount.toLocaleString()} ครั้งที่ไม่สำเร็จ จาก ${totalBookings.toLocaleString()} ครั้ง`,
                icon: "clipboard-list",
                data: [
                    { label: "สำเร็จ", value: `${completedTotal.toLocaleString()} ครั้ง` },
                    { label: "ไม่สำเร็จ", value: `${incompleteCount.toLocaleString()} ครั้ง` },
                    { label: "อัตราสำเร็จ", value: `${successRate}%` },
                ],
            });
        }

        // --- YoY trend recommendation ---
        if (previousYearBookings > 0) {
            recommendations.push({
                id: "rec-trend",
                priority: "low",
                title: bookingTrend.direction === "up"
                    ? `การใช้บริการเพิ่ม ${bookingTrend.trend}% — รักษาโมเมนตัม`
                    : `การใช้บริการลด ${bookingTrend.trend}% — ต้องกระตุ้น`,
                description: bookingTrend.direction === "up"
                    ? `เพิ่มจาก ${previousYearBookings.toLocaleString()} เป็น ${currentYearBookings.toLocaleString()} ครั้ง`
                    : `ลดจาก ${previousYearBookings.toLocaleString()} เหลือ ${currentYearBookings.toLocaleString()} ครั้ง`,
                icon: "calendar",
                data: [
                    { label: "ปีที่แล้ว", value: `${previousYearBookings.toLocaleString()} ครั้ง` },
                    { label: "ปีนี้", value: `${currentYearBookings.toLocaleString()} ครั้ง` },
                    { label: "เปลี่ยนแปลง", value: `${bookingTrend.direction === "up" ? "+" : "-"}${bookingTrend.trend}%` },
                ],
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // 7. Trend data (yearly aggregated)
        // ═══════════════════════════════════════════════════════════════════

        const yearMap = new Map<string, { bookings: number; checkedIn: number; noShow: number }>();
        for (const m of sortedMonths) {
            const year = m.month.split("-")[0];
            const existing = yearMap.get(year) ?? { bookings: 0, checkedIn: 0, noShow: 0 };
            existing.bookings += m.bookings;
            existing.checkedIn += m.checked_in;
            existing.noShow += m.no_show;
            yearMap.set(year, existing);
        }

        const trendData = Array.from(yearMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([year, d]) => ({
                period: `พ.ศ. ${Number(year) + 543}`,
                year: Number(year),
                bookings: d.bookings,
                checkedIn: d.checkedIn,
                noShow: d.noShow,
            }));

        // Simple linear projection for next year
        if (trendData.length >= 2) {
            const last = trendData[trendData.length - 1];
            const secondLast = trendData[trendData.length - 2];
            const growth = last.bookings - secondLast.bookings;
            trendData.push({
                period: `พ.ศ. ${last.year + 544} (คาดการณ์)`,
                year: last.year + 1,
                bookings: Math.max(0, last.bookings + growth),
                checkedIn: Math.max(0, last.checkedIn + Math.round(growth * (last.checkedIn / Math.max(last.bookings, 1)))),
                noShow: Math.max(0, last.noShow + Math.round(growth * (last.noShow / Math.max(last.bookings, 1)))),
            });
        }

        const elapsed = Date.now() - startTime;
        console.log(`[MINISTRY_EXECUTIVE] Completed in ${elapsed}ms`);

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalUniversities: uniCount,
                    totalStudents,
                    consultedStudents,
                    totalBookings,
                    completedBookings: completedTotal,
                    noShowCount: noShowTotal,
                    highRiskCases: highRiskTotal,
                    avgRiskScore,
                    accessRate,
                    successRate,
                    noShowRate,
                },
                kpis,
                insights,
                alerts,
                areaFocus: areaFocus.slice(0, 10),
                recommendations,
                trend: trendData,
                dataRange: {
                    minDate: dataRange[0]?.min_month ?? null,
                    maxDate: dataRange[0]?.max_month ?? null,
                },
                generatedAt: new Date().toISOString(),
                queryTimeMs: elapsed,
            },
        });

    } catch (error) {
        console.error("[MINISTRY_EXECUTIVE_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
