// src/app/api/v2/ministry/universities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v2/ministry/universities
 * Fetch all universities with coordinates for the Ministry map
 */
export async function GET(req: NextRequest) {
  try {
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
        // Get student count
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        university_name_th: "asc",
      },
    });

    // Transform data for the map
    const mapData = universities.map((uni) => ({
      id: uni.university_code,
      code: uni.university_code,
      name: uni.university_name_th,
      nameEn: uni.university_name_en,
      lat: Number(uni.university_latitude),
      lng: Number(uni.university_longitude),
      region: uni.province.region.region_name_en || "Central", // ✅ English name for filtering
      regionCode: uni.province.region.region_code || "UPPER_CENTRAL",
      province: uni.province.province_name_th || "",
      students: uni._count.students,
      type: uni.university_type || "PUBLIC",
      logo: `/images/logo/${uni.university_code}_logo.png`, // ✅ Fixed logo path
    }));

    return NextResponse.json({
      success: true,
      data: mapData,
      count: mapData.length,
    });
  } catch (error) {
    console.error("Error fetching universities for Ministry map:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch universities",
      },
      { status: 500 }
    );
  }
}
