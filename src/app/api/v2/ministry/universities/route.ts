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
    
    // 🚀 CACHE STRATEGY: Check Redis first
    const cacheKey = `${CacheKeys.universities()}:v2:p${page}:s${pageSize}`;
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
    const [universities, categories] = await Promise.all([
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
          university_type: true,
          province: {
            select: {
              province_name_th: true,
              province_name_en: true,
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
      })
    ]);

    const universityIds = universities.map(u => u.university_id);
    const categoryMap = new Map(categories.map(c => [c.problem_category_id, c]));

    // 2. Optimized: Single GroupBy for ALL stats (status + category)
    // This replaces two separate heavy queries with one.
    const granularStats = await prisma.booking.groupBy({
      by: ["university_id", "booking_status", "problem_category_id"],
      where: {
        university_id: { in: universityIds },
      },
      _count: {
        _all: true,
      },
    });

    const granularStatsByUni = new Map<number, any>(); // uniId -> { STATUS: { CAT_CODE: count } }
    const statusBreakdownByUni = new Map<number, Record<string, number>>(); 
    const problemBreakdownByUni = new Map<number, Record<string, number>>(); 
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
      const count = stat._count._all;

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
        // priority: hardcoded CSV data > DB count
        students: universityStudentCounts[uni.university_code] ?? uni._count.students,
        type: uni.university_type || "PUBLIC",
        logo: `/images/logo/${uni.university_code}_logo.png`,
        // ✨ Problem statistics
        dominantProblem: topIssue ? topIssue.name : null,
        dominantProblemCode: topIssue ? topIssue.code : null,
        dominantProblemTH: topIssue ? topIssue.nameTH : null,
        dominantProblemCount: topIssue ? topIssue.count : 0,
        problemBreakdown, // Full breakdown: { STRESS: 10, DEPRESSION: 5, ... }
        statusBreakdown,  // Status breakdown: { COMPLETED: 10, CANCELLED: 2, ... }
        granularStats,    // 🔥 2D Statistics: { COMPLETED: { STRESS: 5 }, CANCELLED: { STRESS: 1 } }
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
