// src/app/api/v2/ministry/universities/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: {
    code: string;
  };
}

/**
 * GET /api/v2/ministry/universities/[code]
 * Fetch single university details with connections
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { code } = params;

    const university = await prisma.university.findUnique({
      where: {
        university_code: code,
      },
      select: {
        university_id: true,
        university_code: true,
        university_name_th: true,
        university_name_en: true,
        university_latitude: true,
        university_longitude: true,
        university_type_id: true,
        universityType: { select: { code: true, name_th: true } },
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
        connectionsFrom: {
          select: {
            connection_id: true,
            distance_km: true,
            connection_rank: true,
            targetUniversity: {
              select: {
                university_code: true,
                university_name_th: true,
                university_latitude: true,
                university_longitude: true,
              },
            },
          },
          orderBy: {
            connection_rank: "asc",
          },
          take: 10,
        },
      },
    });

    if (!university) {
      return NextResponse.json(
        { success: false, error: "University not found" },
        { status: 404 }
      );
    }

    // Transform data (stats removed — analytics API handles this)
    const result = {
      university_id: university.university_id,
      id: university.university_code,
      code: university.university_code,
      name: university.university_name_th,
      nameEn: university.university_name_en,
      lat: Number(university.university_latitude),
      lng: Number(university.university_longitude),
      region: university.province.region.region_name_en || "Central",
      regionCode: university.province.region.region_code,
      regionNameTh: university.province.region.region_name_th,
      province: university.province.province_name_th,
      students: university._count.students,
      type: university.universityType?.code || "PUBLIC",
      logo: `/images/logo/${university.university_code}_logo.png`,
      connections: university.connectionsFrom.map((conn) => ({
        universityCode: conn.targetUniversity.university_code,
        universityName: conn.targetUniversity.university_name_th,
        distance: Number(conn.distance_km),
        rank: conn.connection_rank,
        lat: Number(conn.targetUniversity.university_latitude),
        lng: Number(conn.targetUniversity.university_longitude),
      })),

    };

    return NextResponse.json(
      { success: true, university: result },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching university details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch university details",
      },
      { status: 500 }
    );
  }
}
