// src/app/api/v2/master/time-filters/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCached, setCache } from "@/lib/redis";

const CACHE_KEY = "master:time-filters:v1";
const CACHE_TTL = 3600; // 1 hour — static data rarely changes

export async function GET() {
  try {
    const cached = await getCached<any>(CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", "X-Cache": "HIT" },
      });
    }

    const [seasons, termTypes, years] = await Promise.all([
      prisma.$queryRaw<{ season_id: number; season_code: string; season_name_th: string; month_start: number; month_end: number }[]>`
        SELECT season_id, season_code, season_name_th, month_start, month_end FROM season ORDER BY sort_order
      `,
      prisma.$queryRaw<{ id: number; code: string; name_th: string }[]>`
        SELECT academic_term_type_id AS id, academic_term_type_code AS code, academic_term_type_name_th AS name_th
        FROM academic_term_type ORDER BY sort_order
      `,
      prisma.$queryRaw<{ year: number }[]>`
        SELECT DISTINCT academic_year AS year FROM academic_term ORDER BY academic_year DESC
      `,
    ]);

    const data = {
      success: true,
      seasons,
      termTypes,
      academicYears: years.map((y) => y.year),
    };

    setCache(CACHE_KEY, data, CACHE_TTL).catch(() => {});

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[time-filters] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch time filters" }, { status: 500 });
  }
}
