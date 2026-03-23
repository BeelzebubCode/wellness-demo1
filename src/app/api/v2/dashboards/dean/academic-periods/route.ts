// src/app/api/v2/dashboards/dean/academic-periods/route.ts
// Returns academic periods (กลางภาค / ปลายภาค) for the dean's university
// Uses raw SQL to avoid Prisma generated client field-name mismatches.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

export async function GET(req: NextRequest) {
    try {
        const token = await verifyToken(extractToken(req) || "");
        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            include: {
                roleCategory: { select: { code: true } },
                facultiesDean: {
                    select: { faculty_id: true, university_id: true },
                },
            },
        });

        if (!account || account.roleCategory.code !== "DEAN") {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        const faculty = account.facultiesDean[0];
        if (!faculty) {
            return NextResponse.json({ success: false, error: "No faculty assigned" }, { status: 404 });
        }

        const univId = faculty.university_id;

        // Raw query for periods + term info
        const rawPeriods = await prisma.$queryRaw`
            SELECT
                ap.period_id,
                ap.period_name_th,
                ap.period_name_en,
                ap.period_start_date,
                ap.period_end_date,
                ap.sort_order,
                at.academic_year,
                at.is_active,
                att.academic_term_type_code,
                att.academic_term_type_name_th,
                aptc.code AS period_type_code,
                aptc.name_th AS period_type_name
            FROM academic_period ap
            JOIN academic_term at ON ap.academic_term_id = at.academic_term_id
            JOIN academic_term_type att ON at.academic_term_type_id = att.academic_term_type_id
            JOIN academic_period_type_category aptc ON ap.academic_period_type_id = aptc.academic_period_type_id
            WHERE ap.university_id = ${univId}
            ORDER BY at.academic_year DESC, at.academic_term_type_id ASC, ap.sort_order ASC
        ` as any[];

        const periods = rawPeriods.map((r: any) => ({
            periodId:       r.period_id,
            nameTh:         r.period_name_th,
            nameEn:         r.period_name_en ?? "",
            startDate:      r.period_start_date instanceof Date
                                ? r.period_start_date.toISOString().split("T")[0]
                                : String(r.period_start_date),
            endDate:        r.period_end_date instanceof Date
                                ? r.period_end_date.toISOString().split("T")[0]
                                : String(r.period_end_date),
            sortOrder:      r.sort_order,
            termYear:       r.academic_year,
            termNameTh:     r.academic_term_type_name_th,
            termCode:       r.academic_term_type_code,
            isActiveTerm:   r.is_active,
            periodTypeCode: r.period_type_code,
            periodTypeName: r.period_type_name,
        }));

        // Terms summary
        const rawTerms = await prisma.$queryRaw`
            SELECT
                at.academic_term_id AS term_id,
                at.academic_year,
                at.term_start_date,
                at.term_end_date,
                at.is_active,
                att.academic_term_type_code AS code,
                att.academic_term_type_name_th AS name_th
            FROM academic_term at
            JOIN academic_term_type att ON at.academic_term_type_id = att.academic_term_type_id
            WHERE at.university_id = ${univId}
            ORDER BY at.academic_year DESC, at.academic_term_type_id ASC
        ` as any[];

        const termList = rawTerms.map((t: any) => ({
            termId:    t.term_id,
            year:      t.academic_year,
            nameTh:    t.name_th,
            code:      t.code,
            isActive:  t.is_active,
            startDate: t.term_start_date instanceof Date
                            ? t.term_start_date.toISOString().split("T")[0]
                            : String(t.term_start_date),
            endDate:   t.term_end_date instanceof Date
                            ? t.term_end_date.toISOString().split("T")[0]
                            : String(t.term_end_date),
        }));

        return NextResponse.json({
            success: true,
            data: { periods, terms: termList },
        });
    } catch (err) {
        console.error("[DEAN_ACADEMIC_PERIODS]", err);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
