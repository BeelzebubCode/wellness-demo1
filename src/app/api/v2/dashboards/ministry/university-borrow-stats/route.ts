// src/app/api/v2/dashboards/ministry/university-borrow-stats/route.ts
// Per-university borrow statistics for Ministry dashboard
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

export const dynamic = "force-dynamic";

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
        const universityId = Number(sp.get("university_id"));
        if (!universityId) {
            return NextResponse.json({ success: false, error: "university_id required" }, { status: 400 });
        }

        // 1. Summary: borrow requests from this university
        const statusCounts = await prisma.borrowRequest.groupBy({
            by: ["borrow_request_status"],
            where: { from_university_id: universityId },
            _count: true,
        });

        const totalRequests = statusCounts.reduce((s, r) => s + r._count, 0);
        const statusMap: Record<string, number> = {};
        for (const s of statusCounts) statusMap[s.borrow_request_status] = s._count;

        // 2. Top source universities (where consultants come from)
        const topSources = await prisma.$queryRawUnsafe<{
            university_id: number;
            university_name_th: string;
            assignment_count: number;
        }[]>(`
            SELECT ba.consultant_university_id AS university_id,
                   u.university_name_th,
                   COUNT(*)::int AS assignment_count
            FROM borrow_assignment ba
            JOIN borrow_request br ON br.borrow_request_id = ba.borrow_request_id
            JOIN university u ON u.university_id = ba.consultant_university_id
            WHERE br.from_university_id = $1
            GROUP BY ba.consultant_university_id, u.university_name_th
            ORDER BY assignment_count DESC
            LIMIT 5
        `, universityId);

        // 3. Consultant specializations borrowed
        const topSpecializations = await prisma.$queryRawUnsafe<{
            topic: string;
            count: number;
        }[]>(`
            SELECT cs.consultant_specialization_topic AS topic,
                   COUNT(*)::int AS count
            FROM borrow_assignment ba
            JOIN borrow_request br ON br.borrow_request_id = ba.borrow_request_id
            JOIN consultant_specialization cs ON cs.consultant_id = ba.consultant_id
            WHERE br.from_university_id = $1
            GROUP BY cs.consultant_specialization_topic
            ORDER BY count DESC
            LIMIT 8
        `, universityId);

        // 4. Organization types of borrowed consultants
        const orgTypes = await prisma.$queryRawUnsafe<{
            org_name: string;
            count: number;
        }[]>(`
            SELECT o.organization_name AS org_name,
                   COUNT(DISTINCT ba.consultant_id)::int AS count
            FROM borrow_assignment ba
            JOIN borrow_request br ON br.borrow_request_id = ba.borrow_request_id
            JOIN consultant c ON c.consultant_id = ba.consultant_id
            JOIN organization o ON o.organization_id = c.organization_id
            WHERE br.from_university_id = $1
            GROUP BY o.organization_name
            ORDER BY count DESC
            LIMIT 5
        `, universityId);

        return NextResponse.json({
            success: true,
            data: {
                totalRequests,
                statusBreakdown: statusMap,
                topSourceUniversities: topSources,
                topSpecializations,
                organizationTypes: orgTypes,
            },
        });
    } catch (error) {
        console.error("[UNI_BORROW_STATS_ERROR]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
