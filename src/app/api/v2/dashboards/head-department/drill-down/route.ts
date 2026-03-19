// src/app/api/v2/dashboards/head-department/drill-down/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Drill-down: Top N students for a given problem category OR risk level
// RBAC: HEAD_DEPARTMENT only, scoped to user's department
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth/token";

interface DrillDownStudent {
    studentId: number;
    studentCode: string | null;
    fullName: string;
    gender: string | null;
    phone: string | null;
    yearLevel: number;
    facultyName: string;
    departmentName: string;
    province: string | null;
    advisorName: string | null;
    advisorPhone: string | null;
    bookingCount: number;
}

export async function GET(req: NextRequest) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────
        const token = await verifyToken(extractToken(req) || "");
        if (!token) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const account = await prisma.account.findUnique({
            where: { account_id: token.accountId },
            include: {
                roleCategory: { select: { code: true } },
                departmentsHead: {
                    select: {
                        department_id: true,
                        university_id: true,
                        faculty_id: true,
                    },
                },
            },
        });

        if (!account || account.roleCategory.code !== "HEAD_DEPARTMENT") {
            return NextResponse.json(
                { success: false, error: "Forbidden: Head Department access required" },
                { status: 403 },
            );
        }

        const dept = account.departmentsHead[0];
        if (!dept) {
            return NextResponse.json(
                { success: false, error: "No department assigned" },
                { status: 404 },
            );
        }

        // ── Params ────────────────────────────────────────────────────────
        const sp = req.nextUrl.searchParams;
        const categoryName = sp.get("category_name");
        const riskLevel = sp.get("risk_level"); // "1"-"5" or "null" for unknown

        if (!categoryName && !riskLevel) {
            return NextResponse.json(
                { success: false, error: "category_name or risk_level is required" },
                { status: 400 },
            );
        }

        const limit = Math.min(parseInt(sp.get("limit") ?? "10", 10) || 10, 50);
        const offset = parseInt(sp.get("offset") ?? "0", 10) || 0;

        // Buddhist year for year-level calculation
        const buddhistYear = new Date().getFullYear() + 543;

        // ── Build WHERE clause based on drill-down type ───────────────────
        let filterJoin = "";
        let filterWhere = "";
        const paramValues: any[] = [];

        if (categoryName) {
            // Problem category drill-down
            filterJoin = `JOIN problem_category pc ON pc.problem_category_id = b.problem_category_id`;
            filterWhere = `AND pc.problem_category_name_th = $1`;
            paramValues.push(categoryName);
        } else if (riskLevel) {
            // Risk level drill-down
            filterJoin = `LEFT JOIN booking_outcome bo ON bo.booking_id = b.booking_id AND bo.university_id = b.university_id`;
            if (riskLevel === "null" || riskLevel === "UNKNOWN") {
                filterWhere = `AND bo.risk_level_id IS NULL`;
            } else {
                filterWhere = `AND bo.risk_level_id = $1`;
                paramValues.push(parseInt(riskLevel, 10));
            }
        }

        // ── Query ─────────────────────────────────────────────────────────
        const queryText = `SELECT
                s.student_id,
                s.student_code,
                sp.student_first_name_th AS first_name,
                sp.student_last_name_th  AS last_name,
                gc.code                  AS gender,
                sp.student_phone_number  AS phone,
                sa.student_admit_academic_year AS admit_year,
                f.faculty_name_th        AS faculty_name,
                d.department_name_th     AS department_name,
                pv.province_name_th      AS province_name,
                CASE WHEN adv.advisor_id IS NOT NULL
                     THEN CONCAT(
                         COALESCE(adv.advisor_academic_rank, ''), ' ',
                         adv.advisor_first_name, ' ', adv.advisor_last_name
                     )
                     ELSE NULL
                END AS advisor_name,
                adv.advisor_phone_number AS advisor_phone,
                COUNT(b.booking_id)      AS booking_count
            FROM booking b
            JOIN student s          ON s.university_id = b.university_id AND s.student_id = b.student_id
            JOIN student_academic sa ON sa.university_id = s.university_id AND sa.student_id = s.student_id
            JOIN student_profile sp  ON sp.university_id = s.university_id AND sp.student_id = s.student_id
            LEFT JOIN gender_category gc ON gc.gender_category_id = sp.gender_category_id
            JOIN faculty f           ON f.university_id = sa.university_id AND f.faculty_id = sa.faculty_id
            JOIN department d        ON d.university_id = sa.university_id AND d.department_id = sa.department_id
            ${filterJoin}
            LEFT JOIN advisor adv    ON adv.advisor_id = sa.advisor_id
            LEFT JOIN student_address addr
                ON addr.university_id = s.university_id
                AND addr.student_id = s.student_id
                AND addr.address_type_id IN (SELECT address_type_id FROM address_type_category WHERE code = 'CURRENT')
            LEFT JOIN province pv    ON pv.province_id = addr.province_id
            WHERE sa.department_id = ${dept.department_id}
                AND sa.university_id = ${dept.university_id}
                AND sa.faculty_id = ${dept.faculty_id}
                AND b.booking_status = 'COMPLETED'
                ${filterWhere}
            GROUP BY
                s.student_id, s.student_code,
                sp.student_first_name_th, sp.student_last_name_th,
                gc.code, sp.student_phone_number,
                sa.student_admit_academic_year,
                f.faculty_name_th, d.department_name_th,
                pv.province_name_th,
                adv.advisor_id, adv.advisor_academic_rank,
                adv.advisor_first_name, adv.advisor_last_name,
                adv.advisor_phone_number
            ORDER BY booking_count DESC, sp.student_first_name_th ASC
            LIMIT ${limit} OFFSET ${offset}`;

        const rows = await prisma.$queryRawUnsafe<
            {
                student_id: number;
                student_code: string | null;
                first_name: string;
                last_name: string;
                gender: string | null;
                phone: string | null;
                admit_year: number | null;
                faculty_name: string;
                department_name: string;
                province_name: string | null;
                advisor_name: string | null;
                advisor_phone: string | null;
                booking_count: bigint;
            }[]
        >(queryText, ...paramValues);

        const students: DrillDownStudent[] = rows.map(r => {
            const admitYear = r.admit_year ?? 0;
            const yearLevel = admitYear > 0
                ? Math.min(buddhistYear - admitYear + 1, 8)
                : 0;

            return {
                studentId: r.student_id,
                studentCode: r.student_code,
                fullName: `${r.first_name} ${r.last_name}`,
                gender: r.gender,
                phone: r.phone,
                yearLevel,
                facultyName: r.faculty_name,
                departmentName: r.department_name,
                province: r.province_name,
                advisorName: r.advisor_name?.trim() || null,
                advisorPhone: r.advisor_phone,
                bookingCount: Number(r.booking_count),
            };
        });

        const label = categoryName ?? `ระดับ ${riskLevel}`;
        return NextResponse.json({ success: true, data: { students, categoryName: label } });
    } catch (error) {
        console.error("[HEAD_DEPT_DRILL_DOWN_ERROR]", error);
        const msg = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: msg },
            { status: 500 },
        );
    }
}
