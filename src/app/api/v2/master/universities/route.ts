// src/app/api/v2/ministry/universities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCache, CacheKeys, CacheTTL } from "@/lib/redis";
import { universityStudentCounts, DEFAULT_STUDENT_COUNT } from "@/lib/constants/university-student-counts";


/**
 * GET /api/v2/ministry/universities
 * Fetch all universities with coordinates for the Ministry map
 * 
 * Performance optimizations:
 * - Uses select instead of full model (reduces data transfer by ~60%)
 * - Relies on idx_university_active_coords for fast filtering
 * - Relies on idx_student_university_id for _count aggregation
 * - Pagination support (default 100, max 500 for map view)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);

    // 🔥 Pagination support (optional for map, useful for API clients)
    const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
    const pageSizeRaw = parseInt(searchParams.get("pageSize") || "100");
    const pageSize = Math.min(500, Math.max(1, pageSizeRaw)); // cap at 500 for map view

    // 🎯 Filtering & sorting constants
    const problemCategory = searchParams.get("problemCategory") || "";
    const sortBy = searchParams.get("sortBy") || "";

    // 🔥 Date / Service-mode filter params (from sidebar time filter + service mode buttons)
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const serviceModesParam = searchParams.get("serviceModes") || ""; // comma-separated codes e.g. "ONLINE,ONSITE"

    // 🚀 CACHE STRATEGY: Check Redis first (include filter params in cache key)
    const cacheKey = `${CacheKeys.universities()}:v2:p${page}:s${pageSize}:df${dateFrom}:dt${dateTo}:sm${serviceModesParam}`;
    const cachedData = await getCached<any>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          "X-Cache": "HIT",
        },
      });
    }

    const skip = page * pageSize;

    // 1. Parallel Fetch: Universities + Categories
    const [universities, categories, serviceModes] = await Promise.all([
      prisma.university.findMany({
        where: {
          university_is_active: true,
          AND: [
            { university_latitude: { not: null } },
            { university_longitude: { not: null } },
          ],
        },
        select: {
          university_id: true,
          university_code: true,
          university_name_th: true,
          university_name_en: true,
          university_latitude: true,
          university_longitude: true,
          universityType: true,
          province: {
            select: {
              province_name_th: true,
              province_name_en: true,
              is_special_zone: true,
              region: {
                select: {
                  region_name_th: true,
                  region_name_en: true,
                  region_code: true,
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
            },
          },
        },
        orderBy: {
          university_name_th: "asc",
        },
        skip,
        take: pageSize,
      }),
      prisma.problemCategory.findMany({
        select: {
          problem_category_id: true,
          problem_category_code: true,
          problem_category_name_en: true,
          problem_category_name_th: true,
        }
      }),
      prisma.serviceModeCategory.findMany({
        select: {
          service_mode_id: true,
          code: true,
        },
      }),
    ]);

    const universityIds = universities.map(u => u.university_id);
    const categoryMap = new Map(categories.map(c => [c.problem_category_id, c]));
    const serviceModeMap = new Map(serviceModes.map(s => [s.service_mode_id, s.code]));
    const serviceModeCodeToId = new Map(serviceModes.map(s => [s.code, s.service_mode_id]));

    // ── Build shared booking WHERE clause (date + service mode filters) ──
    const bookingWhere: any = { university_id: { in: universityIds } };

    if (dateFrom || dateTo) {
      bookingWhere.booking_created_at = {};
      if (dateFrom) bookingWhere.booking_created_at.gte = new Date(dateFrom);
      if (dateTo) bookingWhere.booking_created_at.lte = new Date(dateTo);
    }

    // Resolve service mode codes to IDs for Prisma filter
    const serviceModeCodes = serviceModesParam ? serviceModesParam.split(",").filter(Boolean) : [];
    if (serviceModeCodes.length > 0) {
      const modeIds = serviceModeCodes.map(c => serviceModeCodeToId.get(c)).filter((id): id is number => id != null);
      if (modeIds.length > 0) {
        bookingWhere.service_mode_id = { in: modeIds };
      }
    }

    // ── Build raw SQL date/mode clauses for the nationality query ──
    let natExtraWhere = "";
    const natParams: any[] = [universityIds];
    if (dateFrom) { natExtraWhere += ` AND b.booking_created_at >= $2`; natParams.push(new Date(dateFrom)); }
    if (dateTo) { const idx = natParams.length + 1; natExtraWhere += ` AND b.booking_created_at <= $${idx}`; natParams.push(new Date(dateTo)); }
    if (serviceModeCodes.length > 0) {
      const modeIds = serviceModeCodes.map(c => serviceModeCodeToId.get(c)).filter((id): id is number => id != null);
      if (modeIds.length > 0) { const idx = natParams.length + 1; natExtraWhere += ` AND b.service_mode_id = ANY($${idx}::int[])`; natParams.push(modeIds); }
    }

    // 2. Optimized: Single GroupBy for ALL stats (status + category) + nationality booking counts
    const [granularRaw, serviceModeRaw, nationalityStats] = await Promise.all([
      prisma.booking.groupBy({
        by: ["university_id", "booking_status", "problem_category_id"],
        where: bookingWhere,
        _count: { _all: true },
      }),
      prisma.booking.groupBy({
        by: ["university_id", "service_mode_id"],
        where: { ...bookingWhere, service_mode_id: { not: undefined } },
        _count: { _all: true },
      }),
      // Nationality breakdown: count BOOKINGS per nationality per university
      prisma.$queryRawUnsafe<{ university_id: number; category: string; cnt: number }[]>(
        `SELECT b.university_id,
          CASE WHEN sp.student_nationality = 'ไทย' THEN 'DOMESTIC' ELSE 'INTERNATIONAL' END AS category,
          COUNT(*)::int AS cnt
        FROM booking b
        JOIN student s ON b.student_id = s.student_id
        JOIN student_profile sp ON sp.student_id = s.student_id AND sp.university_id = s.university_id
        WHERE b.university_id = ANY($1::int[])${natExtraWhere}
        GROUP BY b.university_id, category`,
        ...natParams
      ),
    ]);
    // Normalize Prisma groupBy output
    const granularStats = granularRaw.map(s => ({
      university_id: s.university_id,
      booking_status: s.booking_status,
      problem_category_id: s.problem_category_id,
      count: s._count._all,
    }));
    const serviceModeStats = serviceModeRaw.map(s => ({
      university_id: s.university_id,
      service_mode_id: s.service_mode_id,
      count: typeof s._count === 'object' ? (s._count as any)._all : 0,
    }));

    const granularStatsByUni = new Map<number, any>(); // uniId -> { STATUS: { CAT_CODE: count } }
    const statusBreakdownByUni = new Map<number, Record<string, number>>();
    const problemBreakdownByUni = new Map<number, Record<string, number>>();
    const serviceModeBreakdownByUni = new Map<number, Record<string, number>>();
    const nationalityBreakdownByUni = new Map<number, Record<string, number>>();
    const topCategoryByUni = new Map<number, any>();
    const statsAccumulator: Record<number, Record<number, number>> = {}; // uniId -> { catId: totalCount }

    // Init accumulators
    for (const uniId of universityIds) {
      statsAccumulator[uniId] = {};
    }

    for (const stat of granularStats) {
      const catInfo = categoryMap.get(stat.problem_category_id);
      if (!catInfo || !catInfo.problem_category_code) continue;
      const catCode = catInfo.problem_category_code;
      const count = stat.count;

      // Update 2D breakdown
      const uniStats = granularStatsByUni.get(stat.university_id) || {};
      const statusStats = uniStats[stat.booking_status] || {};
      statusStats[catCode] = (statusStats[catCode] || 0) + count;
      uniStats[stat.booking_status] = statusStats;
      granularStatsByUni.set(stat.university_id, uniStats);

      // Update Status breakdown
      const stBreakdown = statusBreakdownByUni.get(stat.university_id) || {};
      stBreakdown[stat.booking_status] = (stBreakdown[stat.booking_status] || 0) + count;
      statusBreakdownByUni.set(stat.university_id, stBreakdown);

      // Update Problem breakdown
      const pbBreakdown = problemBreakdownByUni.get(stat.university_id) || {};
      pbBreakdown[catCode] = (pbBreakdown[catCode] || 0) + count;
      problemBreakdownByUni.set(stat.university_id, pbBreakdown);

      // Accumulate for top category
      statsAccumulator[stat.university_id][stat.problem_category_id] =
        (statsAccumulator[stat.university_id][stat.problem_category_id] || 0) + count;
    }

    // Determine max for each university (dominant problem)
    for (const uniId of universityIds) {
      const catCounts = statsAccumulator[uniId];
      let topCatId = -1;
      let maxCount = -1;

      for (const [catIdStr, count] of Object.entries(catCounts)) {
        const catId = parseInt(catIdStr);
        if (count > maxCount) {
          maxCount = count;
          topCatId = catId;
        }
      }

      const catInfo = categoryMap.get(topCatId);
      if (catInfo) {
        topCategoryByUni.set(uniId, {
          code: catInfo.problem_category_code || "UNKNOWN",
          name: catInfo.problem_category_name_en || "Unknown",
          nameTH: catInfo.problem_category_name_th,
          count: maxCount,
        });
      }
    }

    // Build service mode breakdown per university
    for (const stat of serviceModeStats) {
      if (stat.service_mode_id == null) continue;
      const modeCode = serviceModeMap.get(stat.service_mode_id);
      if (!modeCode) continue;
      const breakdown = serviceModeBreakdownByUni.get(stat.university_id) || {};
      breakdown[modeCode] = (breakdown[modeCode] || 0) + stat.count;
      serviceModeBreakdownByUni.set(stat.university_id, breakdown);
    }

    // Build nationality breakdown per university
    for (const stat of nationalityStats) {
      const breakdown = nationalityBreakdownByUni.get(stat.university_id) || {};
      breakdown[stat.category] = (breakdown[stat.category] || 0) + stat.cnt;
      nationalityBreakdownByUni.set(stat.university_id, breakdown);
    }

    const elapsed = Date.now() - startTime;

    // 🔍 Log slow queries (>100ms) without PII
    if (elapsed > 100) {
      console.warn(`[SLOW QUERY] GET /api/v2/ministry/universities took ${elapsed}ms (page=${page}, pageSize=${pageSize}, results=${universities.length})`);
    }

    // Transform data for the map
    let mapData = universities.map((uni) => {
      const topIssue = topCategoryByUni.get(uni.university_id);
      const problemBreakdown = problemBreakdownByUni.get(uni.university_id) || {};
      const statusBreakdown = statusBreakdownByUni.get(uni.university_id) || {};
      const granularStats = granularStatsByUni.get(uni.university_id) || {};

      return {
        id: uni.university_code,
        code: uni.university_code,
        name: uni.university_name_th,
        nameEn: uni.university_name_en,
        lat: Number(uni.university_latitude),
        lng: Number(uni.university_longitude),
        region: uni.province.region.region_name_en || "Central",
        regionCode: uni.province.region.region_code || "UPPER_CENTRAL",
        province: uni.province.province_name_th || "",
        isSpecialZone: uni.province.is_special_zone || false,
        // priority: hardcoded CSV data > DB count
        students: universityStudentCounts[uni.university_code] ?? uni._count.students,
        type: uni.universityType?.code || "PUBLIC",
        logo: `/images/logo/${uni.university_code}_logo.png`,
        // ✨ Problem statistics
        dominantProblem: topIssue ? topIssue.name : null,
        dominantProblemCode: topIssue ? topIssue.code : null,
        dominantProblemTH: topIssue ? topIssue.nameTH : null,
        dominantProblemCount: topIssue ? topIssue.count : 0,
        problemBreakdown, // Full breakdown: { STRESS: 10, DEPRESSION: 5, ... }
        statusBreakdown,  // Status breakdown: { COMPLETED: 10, CANCELLED: 2, ... }
        granularStats,    // 🔥 2D Statistics: { COMPLETED: { STRESS: 5 }, CANCELLED: { STRESS: 1 } }
        serviceModeBreakdown: serviceModeBreakdownByUni.get(uni.university_id) || {}, // { ONLINE: 50, ONSITE: 20 }
        nationalityBreakdown: nationalityBreakdownByUni.get(uni.university_id) || {}, // { DOMESTIC: 500, INTERNATIONAL: 30 }
      };
    });

    // 🎯 Apply problem category filter
    if (problemCategory) {
      mapData = mapData.filter(uni =>
        uni.problemBreakdown[problemCategory] && uni.problemBreakdown[problemCategory] > 0
      );
    }

    // 🎯 Apply sorting
    if (sortBy === "problemCount") {
      mapData.sort((a, b) => b.dominantProblemCount - a.dominantProblemCount);
    } else if (sortBy === "students") {
      mapData.sort((a, b) => b.students - a.students);
    }

    const response = {
      success: true,
      data: mapData,
      count: mapData.length,
      // 🔥 Backward compatible: only add pagination if requested
      ...(searchParams.get("page") || searchParams.get("pageSize")
        ? {
          pagination: {
            page,
            pageSize,
            hasMore: mapData.length === pageSize,
          },
        }
        : {}),
      // Cache metadata
      generatedAt: new Date().toISOString(),
    };

    // 💾 CACHE SET: Save to Redis background
    // Don't await to avoid blocking response
    setCache(cacheKey, response, CacheTTL.UNIVERSITIES).catch(err =>
      console.error("[CACHE ERROR] Failed to set cache:", err)
    );

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[ERROR] GET /api/v2/ministry/universities failed after ${elapsed}ms:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch universities",
      },
      { status: 500 }
    );
  }
}
