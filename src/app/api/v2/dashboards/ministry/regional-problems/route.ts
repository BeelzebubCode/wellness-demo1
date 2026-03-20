// src/app/api/v2/dashboards/ministry/regional-problems/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Regional Problem Drill-Down: Region → Province → University
// + Demographic & Season filters
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

type DrillLevel = "region" | "province" | "university";

function toYYYYMM(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseCSV(sp: URLSearchParams, key: string): string[] | undefined {
    const v = sp.get(key); return v ? v.split(",").filter(Boolean) : undefined;
}

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

        const sp = req.nextUrl.searchParams;
        const level = (sp.get("level") ?? "region") as DrillLevel;
        const regionId = sp.get("region_id") ? Number(sp.get("region_id")) : undefined;
        const provinceId = sp.get("province_id") ? Number(sp.get("province_id")) : undefined;

        // Date filters
        const allTime = sp.get("all_time") === "true";
        const filterClauses: string[] = [];
        if (!allTime) {
            const ds = sp.get("date_start"), de = sp.get("date_end");
            if (ds) filterClauses.push(`bs.month >= '${toYYYYMM(new Date(ds))}'`);
            if (de) filterClauses.push(`bs.month <= '${toYYYYMM(new Date(de))}'`);
        }

        // Demographic filters
        const income = parseCSV(sp, "income_bracket");
        const parental = parseCSV(sp, "parental_status");
        const blood = parseCSV(sp, "blood_group");
        if (income?.length) filterClauses.push(`bs.income_bracket_code IN (${income.map(v => `'${v}'`).join(",")})`);
        if (parental?.length) filterClauses.push(`bs.parental_status_code IN (${parental.map(v => `'${v}'`).join(",")})`);
        if (blood?.length) filterClauses.push(`bs.blood_group_code IN (${blood.map(v => `'${v}'`).join(",")})`);

        // Season filter — map season months to MV month column
        const seasonMonthsParam = sp.get("season_months"); // e.g. "03,04,05" for summer
        const seasonYear = sp.get("season_year"); // e.g. "2025"
        if (seasonMonthsParam && seasonYear) {
            const months = seasonMonthsParam.split(",").map(m => `'${seasonYear}-${m.padStart(2, "0")}'`);
            filterClauses.push(`bs.month IN (${months.join(",")})`);
        }

        const filterWhere = filterClauses.length > 0 ? `AND ${filterClauses.join(" AND ")}` : "";

        // Build breadcrumb
        const breadcrumb: { id?: number; name: string; level: DrillLevel }[] = [
            { name: "ทั้งหมด", level: "region" },
        ];

        if (regionId && (level === "province" || level === "university")) {
            const region = await prisma.region.findUnique({
                where: { region_id: regionId },
                select: { region_name_th: true },
            });
            breadcrumb.push({ id: regionId, name: region?.region_name_th ?? "", level: "province" });
        }

        if (provinceId && level === "university") {
            const province = await prisma.province.findUnique({
                where: { province_id: provinceId },
                select: { province_name_th: true },
            });
            breadcrumb.push({ id: provinceId, name: province?.province_name_th ?? "", level: "university" });
        }

        let items: { id: number; name: string; totalProblems: number }[] = [];
        let problemSummary: { label: string; count: number }[] = [];

        if (level === "region") {
            const rows = await prisma.$queryRawUnsafe<
                { region_id: number; region_name_th: string; total: number }[]
            >(`
                SELECT r.region_id, r.region_name_th, COALESCE(SUM(bs.total_bookings), 0)::int AS total
                FROM region r
                JOIN province p ON p.region_id = r.region_id
                JOIN university u ON u.province_id = p.province_id AND u.university_is_active = true
                LEFT JOIN mv_booking_summary bs ON bs.university_id = u.university_id
                    ${filterWhere}
                GROUP BY r.region_id, r.region_name_th
                ORDER BY total DESC
            `);
            items = rows.map(r => ({ id: r.region_id, name: r.region_name_th, totalProblems: r.total }));

            problemSummary = await prisma.$queryRawUnsafe<{ label: string; count: number }[]>(`
                SELECT bs.problem_category_name_th AS label, SUM(bs.total_bookings)::int AS count
                FROM mv_booking_summary bs
                WHERE bs.problem_category_id != 0
                    ${filterWhere}
                GROUP BY bs.problem_category_name_th
                ORDER BY count DESC
                LIMIT 10
            `);

        } else if (level === "province") {
            if (!regionId) {
                return NextResponse.json({ success: false, error: "region_id required for province level" }, { status: 400 });
            }

            const rows = await prisma.$queryRawUnsafe<
                { province_id: number; province_name_th: string; total: number }[]
            >(`
                SELECT p.province_id, p.province_name_th, COALESCE(SUM(bs.total_bookings), 0)::int AS total
                FROM province p
                JOIN university u ON u.province_id = p.province_id AND u.university_is_active = true
                LEFT JOIN mv_booking_summary bs ON bs.university_id = u.university_id
                    ${filterWhere}
                WHERE p.region_id = ${regionId}
                GROUP BY p.province_id, p.province_name_th
                ORDER BY total DESC
            `);
            items = rows.map(r => ({ id: r.province_id, name: r.province_name_th, totalProblems: r.total }));

            problemSummary = await prisma.$queryRawUnsafe<{ label: string; count: number }[]>(`
                SELECT bs.problem_category_name_th AS label, SUM(bs.total_bookings)::int AS count
                FROM mv_booking_summary bs
                JOIN university u ON u.university_id = bs.university_id AND u.university_is_active = true
                JOIN province p ON p.province_id = u.province_id
                WHERE p.region_id = ${regionId}
                    AND bs.problem_category_id != 0
                    ${filterWhere}
                GROUP BY bs.problem_category_name_th
                ORDER BY count DESC
                LIMIT 10
            `);

        } else if (level === "university") {
            if (!provinceId) {
                return NextResponse.json({ success: false, error: "province_id required for university level" }, { status: 400 });
            }

            const rows = await prisma.$queryRawUnsafe<
                { university_id: number; university_name_th: string; total: number }[]
            >(`
                SELECT u.university_id, u.university_name_th, COALESCE(SUM(bs.total_bookings), 0)::int AS total
                FROM university u
                LEFT JOIN mv_booking_summary bs ON bs.university_id = u.university_id
                    ${filterWhere}
                WHERE u.province_id = ${provinceId} AND u.university_is_active = true
                GROUP BY u.university_id, u.university_name_th
                ORDER BY total DESC
            `);
            items = rows.map(r => ({ id: r.university_id, name: r.university_name_th, totalProblems: r.total }));

            problemSummary = await prisma.$queryRawUnsafe<{ label: string; count: number }[]>(`
                SELECT bs.problem_category_name_th AS label, SUM(bs.total_bookings)::int AS count
                FROM mv_booking_summary bs
                JOIN university u ON u.university_id = bs.university_id AND u.university_is_active = true
                WHERE u.province_id = ${provinceId}
                    AND bs.problem_category_id != 0
                    ${filterWhere}
                GROUP BY bs.problem_category_name_th
                ORDER BY count DESC
                LIMIT 10
            `);
        }

        // Data range
        const rangeRows = await prisma.$queryRawUnsafe<{ min_date: string; max_date: string }[]>(`
            SELECT MIN(month) AS min_date, MAX(month) AS max_date FROM mv_booking_summary
        `);
        const dataRange = rangeRows[0]
            ? { minDate: rangeRows[0].min_date, maxDate: rangeRows[0].max_date }
            : null;

        // Seasons list
        const seasons = await prisma.season.findMany({
            select: { season_id: true, season_name_th: true },
            orderBy: { season_id: "asc" },
        });

        return NextResponse.json({
            success: true,
            data: {
                level,
                breadcrumb,
                items,
                problemSummary,
                dataRange,
                seasons: seasons.map(s => ({ id: s.season_id, name: s.season_name_th })),
            },
        });
    } catch (error) {
        console.error("[MINISTRY_REGIONAL_PROBLEMS_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
