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
    
    // 🚀 CACHE STRATEGY: Check Redis first
    // Cache key includes pagination to avoid incorrect data
    const cacheKey = `${CacheKeys.universities()}:p${page}:s${pageSize}`;
    const cachedData = await getCached<any>(cacheKey);

    if (cachedData) {
      // ⚡ Cache Hit!
      const elapsed = Date.now() - startTime;
      if (elapsed > 100) {
        console.warn(`[SLOW CACHE] GET /api/v2/ministry/universities cache hit took ${elapsed}ms`);
      }

      return NextResponse.json(cachedData, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
          "X-Cache": "HIT",
        },
      });
    }

    const skip = page * pageSize;

    // 🚀 Performance: Use select instead of loading full models
    const universities = await prisma.university.findMany({
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
    });

    // 🔥 Aggergate Dominant Problem Category
    const universityIds = universities.map(u => u.university_id);
    
    // 1. Get counts by (uni, category)
    const categoryStats = await prisma.booking.groupBy({
      by: ["university_id", "problem_category_id"],
      where: {
        university_id: { in: universityIds },
      },
      _count: {
        _all: true,
      },
    });

    // 2. Get category details (cacheable)
    // In a real app we might cache this separately, but it's small enough to fetch
    const categories = await prisma.problemCategory.findMany({
      select: {
        problem_category_id: true,
        problem_category_name_en: true,
        problem_category_name_th: true,
      }
    });
    const categoryMap = new Map(categories.map(c => [c.problem_category_id, c]));

    // 3. Find top category per university
    const topCategoryByUni = new Map<number, any>(); // uniId -> { categoryName, count }
    
    // Group stats by university first
    const statsByUni: Record<number, typeof categoryStats> = {};
    for (const stat of categoryStats) {
      if (!statsByUni[stat.university_id]) statsByUni[stat.university_id] = [];
      statsByUni[stat.university_id].push(stat);
    }

    // Determine max for each
    for (const uniId of universityIds) {
      const stats = statsByUni[uniId];
      if (!stats || stats.length === 0) continue;

      // Find max count
      const top = stats.reduce((prev, current) => 
        (current._count._all > prev._count._all) ? current : prev
      );

      const catInfo = categoryMap.get(top.problem_category_id);
      if (catInfo) {
        topCategoryByUni.set(uniId, {
          name: catInfo.problem_category_name_en || "Unknown", // Prefer EN for variable consistency or TH if needed
          nameTH: catInfo.problem_category_name_th,
          count: top._count._all,
        });
      }
    }

    const elapsed = Date.now() - startTime;
    
    // 🔍 Log slow queries (>100ms) without PII
    if (elapsed > 100) {
      console.warn(`[SLOW QUERY] GET /api/v2/ministry/universities took ${elapsed}ms (page=${page}, pageSize=${pageSize}, results=${universities.length})`);
    }

    // Transform data for the map
    const mapData = universities.map((uni) => {
      const topIssue = topCategoryByUni.get(uni.university_id);
      
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
        // ✨ New field
        dominantProblem: topIssue ? topIssue.name : null,
        dominantProblemTH: topIssue ? topIssue.nameTH : null,
      };
    });

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
