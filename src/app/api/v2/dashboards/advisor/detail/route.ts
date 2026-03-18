// src/app/api/v2/dashboards/advisor/detail/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Advisor Dashboard Detail API — each section can be fetched independently
// with per-section filters via ?section= parameter
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

type Section = "consultations" | "trend" | "cards" | "problems" | "comparison" | "highrisk" | "all";

interface Filters {
    gender?: string[];
    incomeBracket?: string[];
    parentalStatus?: string[];
    problemCategoryIds?: number[];
    academicYear?: number[];
    seasonIds?: number[];
    dateStart?: string;
    dateEnd?: string;
}

function parseFilters(sp: URLSearchParams): Filters {
    const csv = (k: string) => {
        const v = sp.get(k); return v ? v.split(",").filter(Boolean) : undefined;
    };
    const csvNum = (k: string) => {
        const v = sp.get(k); return v ? v.split(",").map(Number).filter(n => !isNaN(n)) : undefined;
    };
    return {
        gender: csv("gender"),
        incomeBracket: csv("income_bracket"),
        parentalStatus: csv("parental_status"),
        problemCategoryIds: csvNum("problem_category_ids"),
        academicYear: csvNum("academic_year"),
        seasonIds: csvNum("season_ids"),
        dateStart: sp.get("date_start") || undefined,
        dateEnd: sp.get("date_end") || undefined,
    };
}

// ─── Build student SQL WHERE ────────────────────────────────────────────────
function buildStudentWhere(advisorId: number, universityId: number, f: Filters): string {
    const c = [`sa.advisor_id = ${advisorId}`, `sa.university_id = ${universityId}`];
    if (f.gender?.length) c.push(`gc.code IN (${f.gender.map(g => `'${g}'`).join(",")})`);
    if (f.incomeBracket?.length) c.push(`ibc.code IN (${f.incomeBracket.map(v => `'${v}'`).join(",")})`);
    if (f.parentalStatus?.length) c.push(`psc.code IN (${f.parentalStatus.map(v => `'${v}'`).join(",")})`);
    if (f.academicYear?.length) c.push(`sa.student_admit_academic_year IN (${f.academicYear.join(",")})`);
    return c.join(" AND ");
}

// ─── Fetch students for this advisor ────────────────────────────────────────
async function fetchStudents(advisorId: number, universityId: number, f: Filters) {
    const w = buildStudentWhere(advisorId, universityId, f);
    return prisma.$queryRawUnsafe<{
        student_id: number; prefix: string | null;
        first_name: string; last_name: string; nickname: string | null;
        admit_year: number | null; blood_group: string | null;
        income_bracket: string | null; income_bracket_code: string | null;
        parental_status: string | null; parental_status_code: string | null;
        gender: string | null; gender_code: string | null;
        phone_number: string | null;
    }[]>(`
        SELECT sa.student_id, sp.student_prefix AS prefix,
               sp.student_first_name_th AS first_name, sp.student_last_name_th AS last_name,
               sp.student_nickname_th AS nickname, sa.student_admit_academic_year AS admit_year,
               sp.student_phone_number AS phone_number,
               bgc.name_th AS blood_group, ibc.name_th AS income_bracket, ibc.code AS income_bracket_code,
               psc.name_th AS parental_status, psc.code AS parental_status_code,
               gc.name_th AS gender, gc.code AS gender_code
        FROM student_academic sa
        JOIN student_profile sp ON sp.student_id = sa.student_id AND sp.university_id = sa.university_id
        LEFT JOIN blood_group_category bgc ON bgc.blood_group_id = sp.blood_group_id
        LEFT JOIN income_bracket_category ibc ON ibc.income_bracket_id = sp.income_bracket_id
        LEFT JOIN parental_status_category psc ON psc.parental_status_id = sp.parental_status_id
        LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
        WHERE ${w}
    `);
}

// ─── Fetch bookings for given student IDs ───────────────────────────────────
async function fetchBookings(universityId: number, studentIds: number[], f: Filters) {
    if (studentIds.length === 0) return [];
    const c = [
        `b.university_id = ${universityId}`,
        `b.student_id IN (${studentIds.join(",")})`,
        `b.booking_status IN ('COMPLETED','ASSIGNED','IN_PROGRESS')`,
    ];
    if (f.problemCategoryIds?.length) c.push(`b.problem_category_id IN (${f.problemCategoryIds.join(",")})`);
    if (f.seasonIds?.length) c.push(`b.season_id IN (${f.seasonIds.join(",")})`);
    if (f.dateStart) c.push(`ts.time_slot_start_datetime >= '${f.dateStart}'::timestamp`);
    if (f.dateEnd) c.push(`ts.time_slot_start_datetime <= '${f.dateEnd}'::timestamp + interval '1 day'`);

    return prisma.$queryRawUnsafe<{
        booking_id: number; student_id: number; month: string;
        problem_name: string | null; problem_category_id: number | null;
        risk_level: number | null; consultant_note: string | null; slot_date: string;
    }[]>(`
        SELECT b.booking_id, b.student_id,
               TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM') AS month,
               pc.problem_category_name_th AS problem_name, b.problem_category_id,
               bo.booking_outcome_risk_level AS risk_level,
               bo.booking_outcome_consultant_note AS consultant_note,
               TO_CHAR(ts.time_slot_start_datetime, 'YYYY-MM-DD') AS slot_date
        FROM booking b
        JOIN time_slot ts ON ts.time_slot_id = b.time_slot_id AND ts.university_id = b.university_id
        LEFT JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id
        LEFT JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id
        WHERE ${c.join(" AND ")}
        ORDER BY ts.time_slot_start_datetime DESC
    `);
}

// ─── Shape helpers ──────────────────────────────────────────────────────────
const CURRENT_BE_YEAR = 2569;
const INCOME_ORDER = ["UNDER_100K", "BETWEEN_100K_200K", "BETWEEN_200K_300K", "BETWEEN_300K_500K", "BETWEEN_500K_800K", "BETWEEN_800K_1M", "OVER_1M"];
const INCOME_LABEL: Record<string, string> = {
    UNDER_100K: "< 100K", BETWEEN_100K_200K: "100-200K", BETWEEN_200K_300K: "200-300K",
    BETWEEN_300K_500K: "300-500K", BETWEEN_500K_800K: "500-800K", BETWEEN_800K_1M: "800K-1M",
    OVER_1M: "> 1M", UNKNOWN: "ไม่ระบุ",
};

function buildConsultCountMaps(bookings: any[]) {
    const countMap = new Map<number, number>();
    const riskMap = new Map<number, number>();
    bookings.forEach(b => {
        countMap.set(b.student_id, (countMap.get(b.student_id) || 0) + 1);
        if (!riskMap.has(b.student_id) && b.risk_level) riskMap.set(b.student_id, b.risk_level);
    });
    return { countMap, riskMap };
}

function shapeConsultations(students: any[], countMap: Map<number, number>, riskMap: Map<number, number>) {
    return students.map(s => ({
        studentId: s.student_id,
        name: `${s.prefix ?? ""} ${s.first_name} ${s.last_name}`.trim(),
        nickname: s.nickname, year: s.admit_year ? (CURRENT_BE_YEAR - s.admit_year) : null,
        count: countMap.get(s.student_id) || 0, latestRisk: riskMap.get(s.student_id) || 0,
    })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
}

function shapeTrend(bookings: any[], studentMap: Map<number, any>) {
    const map = new Map<string, Map<number, number>>();
    bookings.forEach(b => {
        if (!map.has(b.month)) map.set(b.month, new Map());
        const m = map.get(b.month)!;
        m.set(b.student_id, (m.get(b.student_id) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([month, sc]) => ({
        month, total: Array.from(sc.values()).reduce((s, v) => s + v, 0),
        students: Array.from(sc.entries()).map(([sid, cnt]) => {
            const s = studentMap.get(sid);
            return { studentId: sid, name: s ? s.first_name : `ID${sid}`, count: cnt };
        }).sort((a, b) => b.count - a.count),
    }));
}

function shapeCards(students: any[], countMap: Map<number, number>, riskMap: Map<number, number>) {
    return students.map(s => ({
        studentId: s.student_id,
        name: `${s.prefix ?? ""} ${s.first_name} ${s.last_name}`.trim(),
        nickname: s.nickname, year: s.admit_year ? (CURRENT_BE_YEAR - s.admit_year) : null,
        bloodGroup: s.blood_group, familyStatus: s.parental_status,
        familyStatusCode: s.parental_status_code, income: s.income_bracket,
        incomeCode: s.income_bracket_code, gender: s.gender,
        phone: s.phone_number,
        totalBookings: countMap.get(s.student_id) || 0, latestRisk: riskMap.get(s.student_id) || 0,
    })).filter(s => s.totalBookings > 0).sort((a, b) => b.totalBookings - a.totalBookings);
}

function shapeProblemDonut(bookings: any[]) {
    const m = new Map<string, number>();
    bookings.forEach(b => { const c = b.problem_name || "ไม่ระบุ"; m.set(c, (m.get(c) || 0) + 1); });
    return Array.from(m.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
}

function shapeComparison(bookings: any[], studentMap: Map<number, any>) {
    // Income
    const incMap = new Map<string, Set<number>>();
    bookings.forEach(b => {
        const s = studentMap.get(b.student_id);
        const code = s?.income_bracket_code || "UNKNOWN";
        if (!incMap.has(code)) incMap.set(code, new Set());
        incMap.get(code)!.add(b.student_id);
    });
    const incomeVsCount = INCOME_ORDER.map(code => ({
        incomeRange: INCOME_LABEL[code] || code, code,
        studentCount: incMap.get(code)?.size || 0,
    })).filter(x => x.studentCount > 0);

    // Family
    const famMap = new Map<string, Set<number>>();
    bookings.forEach(b => {
        const s = studentMap.get(b.student_id);
        const ps = s?.parental_status || "ไม่ระบุ";
        if (!famMap.has(ps)) famMap.set(ps, new Set());
        famMap.get(ps)!.add(b.student_id);
    });
    const familyVsCount = Array.from(famMap.entries())
        .map(([familyStatus, set]) => ({ familyStatus, studentCount: set.size }))
        .sort((a, b) => b.studentCount - a.studentCount);

    return { incomeVsCount, familyVsCount };
}

function shapeHighRisk(bookings: any[], studentMap: Map<number, any>) {
    const map = new Map<number, any>();
    bookings.filter(b => b.risk_level && b.risk_level >= 4).forEach(b => {
        if (!map.has(b.student_id)) {
            const s = studentMap.get(b.student_id);
            map.set(b.student_id, {
                studentId: b.student_id,
                name: s ? `${s.prefix ?? ""} ${s.first_name} ${s.last_name}`.trim() : `ID${b.student_id}`,
                nickname: s?.nickname || null, year: s?.admit_year ? (CURRENT_BE_YEAR - s.admit_year) : null,
                riskLevel: b.risk_level, lastNote: b.consultant_note,
                lastDate: b.slot_date, problemCategory: b.problem_name,
            });
        }
    });
    return Array.from(map.values()).sort((a, b) => b.riskLevel - a.riskLevel || (b.lastDate ?? "").localeCompare(a.lastDate ?? ""));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            select: { account_role: true, account_home_university_id: true },
        });
        if (!account || account.account_role !== "ADVISOR")
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const advisor = await prisma.advisor.findUnique({
            where: { account_id: token.accountId },
            select: { advisor_id: true, advisor_prefix: true, advisor_first_name: true, advisor_last_name: true },
        });
        if (!advisor) return NextResponse.json({ success: false, error: "Advisor not found" }, { status: 404 });

        const universityId = account.account_home_university_id;
        if (!universityId) return NextResponse.json({ success: false, error: "No university" }, { status: 404 });

        const sp = req.nextUrl.searchParams;
        const section = (sp.get("section") || "all") as Section;
        const filters = parseFilters(sp);
        const advisorId = advisor.advisor_id;
        const advisorName = `${advisor.advisor_prefix ?? ""} ${advisor.advisor_first_name} ${advisor.advisor_last_name}`.trim();

        // Fetch base data (shared across sections)
        const students = await fetchStudents(advisorId, universityId, filters);
        if (students.length === 0) {
            const empty = { advisor: { name: advisorName } } as any;
            if (section === "all" || section === "consultations") empty.consultations = [];
            if (section === "all" || section === "trend") empty.trend = [];
            if (section === "all" || section === "cards") empty.cards = [];
            if (section === "all" || section === "problems") empty.problems = [];
            if (section === "all" || section === "comparison") empty.comparison = { incomeVsCount: [], familyVsCount: [] };
            if (section === "all" || section === "highrisk") empty.highrisk = [];
            return NextResponse.json({ success: true, data: empty });
        }

        const studentIds = students.map(s => s.student_id);
        const studentMap = new Map(students.map(s => [s.student_id, s]));
        const bookings = await fetchBookings(universityId, studentIds, filters);
        const { countMap, riskMap } = buildConsultCountMaps(bookings);

        // Build only requested section(s)
        const data: any = { advisor: { name: advisorName } };

        if (section === "all" || section === "consultations") {
            data.consultations = shapeConsultations(students, countMap, riskMap);
        }
        if (section === "all" || section === "trend") {
            data.trend = shapeTrend(bookings, studentMap);
        }
        if (section === "all" || section === "cards") {
            data.cards = shapeCards(students, countMap, riskMap);
        }
        if (section === "all" || section === "problems") {
            data.problems = shapeProblemDonut(bookings);
        }
        if (section === "all" || section === "comparison") {
            data.comparison = shapeComparison(bookings, studentMap);
        }
        if (section === "all" || section === "highrisk") {
            data.highrisk = shapeHighRisk(bookings, studentMap);
        }

        // Problem categories for filter UI (only on first load)
        if (section === "all" || sp.get("include_categories") === "true") {
            const cats = await prisma.problemCategory.findMany({
                select: { problem_category_id: true, problem_category_name_th: true },
                orderBy: { problem_category_id: "asc" },
            });
            data.problemCategories = cats.map(c => ({ id: c.problem_category_id, name: c.problem_category_name_th }));

            const seasons = await prisma.season.findMany({
                select: { season_id: true, season_name_th: true },
                orderBy: { sort_order: "asc" },
            });
            data.seasons = seasons.map(s => ({ id: s.season_id, name: s.season_name_th }));
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[ADVISOR_DETAIL_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
