// src/app/api/v2/dashboards/dean/academic-periods/route.ts
// Returns academic periods (กลางภาค / ปลายภาค) for the dean's university
// Used by the DepartmentConsultationChart exam-period filter.

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

        // Fetch all academic terms for this university (newest year first)
        const terms = await prisma.academicTerm.findMany({
            where: { university_id: faculty.university_id },
            orderBy: [{ academic_year: "desc" }, { academic_term_type_id: "asc" }],
            select: {
                term_id: true,
                academic_year: true,
                term_start_date: true,
                term_end_date: true,
                is_active: true,
                academicTermType: {
                    select: {
                        academic_term_type_id: true,
                        academic_term_type_code: true,
                        academic_term_type_name_th: true,
                    },
                },
                periods: {
                    orderBy: { sort_order: "asc" },
                    select: {
                        period_id: true,
                        period_name_th: true,
                        period_name_en: true,
                        period_start_date: true,
                        period_end_date: true,
                        sort_order: true,
                        academicPeriodType: {
                            select: {
                                academic_period_type_id: true,
                                code: true,
                                name_th: true,
                                name_en: true,
                            },
                        },
                    },
                },
            },
        });

        // Flatten into a single list of periods with term context
        const periods = terms.flatMap(term =>
            term.periods.map(p => ({
                periodId:       p.period_id,
                nameTh:         p.period_name_th,
                nameEn:         p.period_name_en ?? "",
                startDate:      p.period_start_date.toISOString().split("T")[0],
                endDate:        p.period_end_date.toISOString().split("T")[0],
                sortOrder:      p.sort_order,
                termYear:       term.academic_year,
                termNameTh:     term.academicTermType.academic_term_type_name_th,
                termCode:       term.academicTermType.academic_term_type_code,
                isActiveTerm:   term.is_active,
                periodTypeCode: p.academicPeriodType.code,
                periodTypeName: p.academicPeriodType.name_th,
            }))
        );

        // Term summary list (for UI grouping)
        const termList = terms.map(t => ({
            termId:    t.term_id,
            year:      t.academic_year,
            nameTh:    t.academicTermType.academic_term_type_name_th,
            code:      t.academicTermType.academic_term_type_code,
            isActive:  t.is_active,
            startDate: t.term_start_date.toISOString().split("T")[0],
            endDate:   t.term_end_date.toISOString().split("T")[0],
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
