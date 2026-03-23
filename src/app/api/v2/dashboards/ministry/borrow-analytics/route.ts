import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("from"); // ISO string
    const dateTo = searchParams.get("to");     // ISO string

    // Build date filter fragment
    let brDateFilter = Prisma.sql`1=1`;
    let baDateFilter = Prisma.sql`1=1`;
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      brDateFilter = Prisma.sql`br.borrow_request_created_at >= ${from} AND br.borrow_request_created_at <= ${to}`;
      baDateFilter = Prisma.sql`br.borrow_request_created_at >= ${from} AND br.borrow_request_created_at <= ${to}`;
    } else if (dateFrom) {
      const from = new Date(dateFrom);
      brDateFilter = Prisma.sql`br.borrow_request_created_at >= ${from}`;
      baDateFilter = Prisma.sql`br.borrow_request_created_at >= ${from}`;
    } else if (dateTo) {
      const to = new Date(dateTo);
      brDateFilter = Prisma.sql`br.borrow_request_created_at <= ${to}`;
      baDateFilter = Prisma.sql`br.borrow_request_created_at <= ${to}`;
    }

    // 1. Summary stats (with date filter)
    const summary = await prisma.$queryRaw<[{
      total_requests: number;
      total_assigned: number;
      total_completed: number;
    }]>`
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (WHERE br.borrow_request_status IN ('ASSIGNED','COMPLETED'))::int AS total_assigned,
        COUNT(*) FILTER (WHERE br.borrow_request_status = 'COMPLETED')::int AS total_completed
      FROM borrow_request br
      WHERE ${brDateFilter}
    `;

    // 2. University pairs
    const pairs = await prisma.$queryRaw<{
      from_id: number; from_code: string; from_name: string; from_lat: number; from_lng: number;
      to_id: number; to_code: string; to_name: string; to_lat: number; to_lng: number;
      borrow_count: number; problems: string;
    }[]>`
      SELECT
        br.from_university_id AS from_id,
        uf.university_code AS from_code,
        uf.university_name_th AS from_name,
        uf.university_latitude AS from_lat,
        uf.university_longitude AS from_lng,
        ba.consultant_university_id AS to_id,
        ut.university_code AS to_code,
        ut.university_name_th AS to_name,
        ut.university_latitude AS to_lat,
        ut.university_longitude AS to_lng,
        COUNT(*)::int AS borrow_count,
        STRING_AGG(DISTINCT br.borrow_request_title, ', ' ORDER BY br.borrow_request_title) AS problems
      FROM borrow_assignment ba
      JOIN borrow_request br ON br.borrow_request_id = ba.borrow_request_id
      JOIN university uf ON uf.university_id = br.from_university_id
      JOIN university ut ON ut.university_id = ba.consultant_university_id
      WHERE uf.university_latitude IS NOT NULL AND ut.university_latitude IS NOT NULL
        AND ${baDateFilter}
      GROUP BY br.from_university_id, uf.university_code, uf.university_name_th, uf.university_latitude, uf.university_longitude,
               ba.consultant_university_id, ut.university_code, ut.university_name_th, ut.university_latitude, ut.university_longitude
      ORDER BY borrow_count DESC
    `;

    // 3. Top 10 borrowing universities
    const topBorrowers = await prisma.$queryRaw<{
      uni_id: number; code: string; name: string; lat: number; lng: number; total_borrowed: number;
    }[]>`
      SELECT
        br.from_university_id AS uni_id,
        u.university_code AS code,
        u.university_name_th AS name,
        u.university_latitude AS lat,
        u.university_longitude AS lng,
        COUNT(*)::int AS total_borrowed
      FROM borrow_request br
      JOIN university u ON u.university_id = br.from_university_id
      WHERE br.borrow_request_status IN ('ASSIGNED','COMPLETED','APPROVED')
        AND u.university_latitude IS NOT NULL
        AND ${brDateFilter}
      GROUP BY br.from_university_id, u.university_code, u.university_name_th, u.university_latitude, u.university_longitude
      ORDER BY total_borrowed DESC
      LIMIT 10
    `;

    // Get top 3 destinations for each top borrower
    const topBorrowerIds = topBorrowers.map((b) => b.uni_id);
    const destinations = topBorrowerIds.length > 0 ? await prisma.$queryRaw<{
      from_id: number; to_id: number; to_code: string; to_name: string; to_lat: number; to_lng: number; cnt: number;
    }[]>`
      SELECT
        br.from_university_id AS from_id,
        ba.consultant_university_id AS to_id,
        ut.university_code AS to_code,
        ut.university_name_th AS to_name,
        ut.university_latitude AS to_lat,
        ut.university_longitude AS to_lng,
        COUNT(*)::int AS cnt
      FROM borrow_assignment ba
      JOIN borrow_request br ON br.borrow_request_id = ba.borrow_request_id
      JOIN university ut ON ut.university_id = ba.consultant_university_id
      WHERE br.from_university_id = ANY(${topBorrowerIds})
        AND ut.university_latitude IS NOT NULL
        AND ${baDateFilter}
      GROUP BY br.from_university_id, ba.consultant_university_id, ut.university_code, ut.university_name_th, ut.university_latitude, ut.university_longitude
      ORDER BY br.from_university_id, cnt DESC
    ` : [];

    // Group destinations by borrower
    const destMap = new Map<number, typeof destinations>();
    for (const d of destinations) {
      if (!destMap.has(d.from_id)) destMap.set(d.from_id, []);
      destMap.get(d.from_id)!.push(d);
    }

    const topBorrowersWithDests = topBorrowers.map((b) => ({
      ...b,
      topDestinations: (destMap.get(b.uni_id) || []).slice(0, 3).map((d) => ({
        code: d.to_code,
        name: d.to_name,
        lat: d.to_lat,
        lng: d.to_lng,
        count: d.cnt,
      })),
    }));

    // 4. Problem category breakdown
    const problemBreakdown = await prisma.$queryRaw<{
      problem: string; count: number;
    }[]>`
      SELECT
        borrow_request_title AS problem,
        COUNT(*)::int AS count
      FROM borrow_request br
      WHERE br.borrow_request_status IN ('ASSIGNED','COMPLETED','APPROVED')
        AND ${brDateFilter}
      GROUP BY borrow_request_title
      ORDER BY count DESC
    `;

    const totalProblems = problemBreakdown.reduce((s, p) => s + p.count, 0);

    // 5. Seasons and term types (static reference data)
    const seasons = await prisma.$queryRaw<{
      season_id: number; season_code: string; season_name_th: string; month_start: number; month_end: number;
    }[]>`SELECT season_id, season_code, season_name_th, month_start, month_end FROM season ORDER BY sort_order`;

    const termTypes = await prisma.$queryRaw<{
      id: number; code: string; name_th: string;
    }[]>`SELECT academic_term_type_id AS id, academic_term_type_code AS code, academic_term_type_name_th AS name_th FROM academic_term_type ORDER BY sort_order`;

    // Distinct academic years available
    const years = await prisma.$queryRaw<{ year: number }[]>`
      SELECT DISTINCT academic_year AS year FROM academic_term ORDER BY academic_year DESC
    `;

    return NextResponse.json({
      summary: summary[0],
      universityPairs: pairs,
      topBorrowers: topBorrowersWithDests,
      problemBreakdown: problemBreakdown.map((p) => ({
        ...p,
        percentage: totalProblems > 0 ? Math.round((p.count / totalProblems) * 100) : 0,
      })),
      filters: {
        seasons,
        termTypes,
        academicYears: years.map((y) => y.year),
      },
    });
  } catch (error) {
    console.error("Borrow analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
