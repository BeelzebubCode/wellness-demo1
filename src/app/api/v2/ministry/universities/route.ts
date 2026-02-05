// src/app/api/v2/ministry/universities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCache, CacheKeys, CacheTTL } from "@/lib/redis";


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
    // ... (query remains the same)
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
        // 🔥 _count is optimized by idx_student_university_id
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

    const elapsed = Date.now() - startTime;
    
    // 🔍 Log slow queries (>100ms) without PII
    if (elapsed > 100) {
      console.warn(`[SLOW QUERY] GET /api/v2/ministry/universities took ${elapsed}ms (page=${page}, pageSize=${pageSize}, results=${universities.length})`);
    }

    // Transform data for the map
    const mapData = universities.map((uni) => ({
      id: uni.university_code,
      code: uni.university_code,
      name: uni.university_name_th,
      nameEn: uni.university_name_en,
      lat: Number(uni.university_latitude),
      lng: Number(uni.university_longitude),
      region: uni.province.region.region_name_en || "Central",
      regionCode: uni.province.region.region_code || "UPPER_CENTRAL",
      province: uni.province.province_name_th || "",
      students: uni._count.students,
      type: uni.university_type || "PUBLIC",
      logo: `/images/logo/${uni.university_code}_logo.png`,
    }));

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
