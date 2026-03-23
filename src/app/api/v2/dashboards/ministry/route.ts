// src/app/api/v2/ministry/risk-metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCached, setCache, CacheTTL } from "@/lib/redis";

export const dynamic = "force-dynamic";

interface UniversityRiskMetrics {
  universityId: number;
  universityCode: string;
  universityName: string;
  universityType: string;
  province: string;
  regionCode: string;
  regionName: string;

  // Core Metrics
  queueSize: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  therapistUtilization: number;

  // Calculated Risk Score (0-100)
  riskScore: number;
}

interface RegionalRiskMetrics {
  regionCode: string;
  regionName: string;
  totalUniversities: number;
  avgRiskScore: number;
  totalQueue: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  status: "normal" | "warning" | "critical"; // 🟢🟡🔴
}

/**
 * Calculate Risk Score based on multiple factors
 * Score range: 0-100
 */
function calculateRiskScore(metrics: {
  queueSize: number;
  avgWaitTime: number;
  highRiskPercentage: number;
  therapistUtilization: number;
}): number {
  // Weights for each factor
  const weights = {
    queue: 0.30,      // 30%
    waitTime: 0.25,   // 25%
    highRisk: 0.30,   // 30%
    capacity: 0.15,   // 15%
  };

  // Normalize each metric to 0-100 scale
  const queueScore = Math.min((metrics.queueSize / 50) * 100, 100); // 50+ = 100 score
  const waitTimeScore = Math.min((metrics.avgWaitTime / 7) * 100, 100); // 7+ days = 100
  const highRiskScore = metrics.highRiskPercentage; // Already 0-100%
  const capacityScore = Math.min((metrics.therapistUtilization / 90) * 100, 100); // 90%+ = 100

  // Calculate weighted average
  const totalScore =
    queueScore * weights.queue +
    waitTimeScore * weights.waitTime +
    highRiskScore * weights.highRisk +
    capacityScore * weights.capacity;

  return Math.round(totalScore * 10) / 10; // Round to 1 decimal
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region") || undefined;
    const type = searchParams.get("type") || undefined; // PUBLIC/PRIVATE
    const days = parseInt(searchParams.get("days") || "7"); // Default: last 7 days

    console.log(`[RISK_METRICS] Fetching with filters:`, { region, type, days });

    // Cache key
    const cacheKey = `ministry:risk-metrics:region=${region || "all"}:type=${type || "all"}:days=${days}`;

    // Check cache
    const cached = await getCached<{ universities: UniversityRiskMetrics[], regions: RegionalRiskMetrics[] }>(cacheKey);
    if (cached) {
      console.log(`[RISK_METRICS] Cache hit for ${cacheKey}`);
      return NextResponse.json(cached);
    }

    // Date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(`[RISK_METRICS] Fetching universities from database...`);

    // Fetch universities with province and region
    const universities = await prisma.university.findMany({
      where: {
        university_is_active: true,
        ...(type && { university_type: type as any }),
        ...(region && {
          province: {
            region: {
              region_code: region as any,
            },
          },
        }),
      },
      include: {
        province: {
          include: {
            region: true,
          },
        },
        _count: {
          select: {
            students: true,
            consultants: true,
          },
        },
      },
    });

    console.log(`[RISK_METRICS] Found ${universities.length} universities`);

    // If no universities found, return empty result
    if (universities.length === 0) {
      const emptyResponse = {
        universities: [],
        regions: [],
        metadata: {
          totalUniversities: 0,
          dateRange: {
            start: startDate.toISOString(),
            end: new Date().toISOString(),
          },
          filters: { region, type, days },
        },
      };
      return NextResponse.json(emptyResponse);
    }

    // ── Batch queries: 3 SQL statements instead of N×3 ──────────────────────
    const uniIds = universities.map(u => u.university_id);

    interface QueueRow { university_id: number; queue_size: number }
    interface WaitRow { university_id: number; avg_wait_days: number }
    interface RiskRow { university_id: number; total: number; high: number }

    const [queueRows, waitRows, riskRows] = await Promise.all([
      // 1. Queue size per university (1 query)
      prisma.$queryRawUnsafe<QueueRow[]>(`
        SELECT university_id, COUNT(*)::int AS queue_size
        FROM booking
        WHERE university_id = ANY($1::int[])
          AND booking_status IN ('PENDING_ASSIGNMENT','ASSIGNED')
        GROUP BY university_id
      `, uniIds),

      // 2. Avg wait time per university (1 query)
      prisma.$queryRawUnsafe<WaitRow[]>(`
        SELECT b.university_id,
               COALESCE(AVG(GREATEST(EXTRACT(EPOCH FROM (ts.time_slot_start_datetime - b.booking_created_at)) / 86400, 0)), 0)::float AS avg_wait_days
        FROM booking b
        JOIN time_slot ts ON ts.university_id = b.university_id AND ts.time_slot_id = b.time_slot_id
        WHERE b.university_id = ANY($1::int[])
          AND b.booking_status IN ('IN_PROGRESS','COMPLETED')
          AND b.booking_created_at >= $2
        GROUP BY b.university_id
      `, uniIds, startDate),

      // 3. Risk band per university (1 query)
      prisma.$queryRawUnsafe<RiskRow[]>(`
        SELECT university_id, COUNT(*)::int AS total,
               COUNT(CASE WHEN risk_band IN ('VERY_HIGH','HIGH') THEN 1 END)::int AS high
        FROM mv_student_risk_score
        WHERE university_id = ANY($1::int[])
        GROUP BY university_id
      `, uniIds),
    ]);

    // Build lookup maps
    const queueMap = new Map(queueRows.map(r => [r.university_id, r.queue_size]));
    const waitMap = new Map(waitRows.map(r => [r.university_id, r.avg_wait_days]));
    const riskMap = new Map(riskRows.map(r => [r.university_id, { total: r.total, high: r.high }]));

    // Assemble metrics (no more N+1)
    const universityMetrics: UniversityRiskMetrics[] = universities.map(uni => {
      const queueSize = queueMap.get(uni.university_id) ?? 0;
      const avgWaitTime = waitMap.get(uni.university_id) ?? 0;
      const risk = riskMap.get(uni.university_id) ?? { total: 0, high: 0 };
      const highRiskPercentage = risk.total > 0 ? (risk.high / risk.total) * 100 : 0;
      const totalConsultants = uni._count.consultants;
      const therapistUtilization = totalConsultants > 0 ? (queueSize / (totalConsultants * 20)) * 100 : 0;

      const riskScore = calculateRiskScore({
        queueSize,
        avgWaitTime,
        highRiskPercentage,
        therapistUtilization: Math.min(therapistUtilization, 100),
      });

      return {
        universityId: uni.university_id,
        universityCode: uni.university_code,
        universityName: uni.university_name_th,
        universityType: "PUBLIC",
        province: uni.province.province_name_th,
        regionCode: uni.province.region.region_code,
        regionName: uni.province.region.region_name_th,
        queueSize,
        avgWaitTime: Math.round(avgWaitTime * 10) / 10,
        highRiskPercentage: Math.round(highRiskPercentage * 10) / 10,
        therapistUtilization: Math.round(Math.min(therapistUtilization, 100) * 10) / 10,
        riskScore,
      };
    });

    console.log(`[RISK_METRICS] Calculated metrics for ${universityMetrics.length} universities`);

    // Aggregate by region
    const regionMap = new Map<string, RegionalRiskMetrics>();

    universityMetrics.forEach((um) => {
      if (!regionMap.has(um.regionCode)) {
        regionMap.set(um.regionCode, {
          regionCode: um.regionCode,
          regionName: um.regionName,
          totalUniversities: 0,
          avgRiskScore: 0,
          totalQueue: 0,
          avgWaitTime: 0,
          highRiskPercentage: 0,
          status: "normal",
        });
      }

      const regional = regionMap.get(um.regionCode)!;
      regional.totalUniversities++;
      regional.totalQueue += um.queueSize;
      regional.avgWaitTime += um.avgWaitTime;
      regional.highRiskPercentage += um.highRiskPercentage;
      regional.avgRiskScore += um.riskScore;
    });

    // Calculate averages
    const regionalMetrics: RegionalRiskMetrics[] = Array.from(regionMap.values()).map((r) => {
      const avgRiskScore = r.avgRiskScore / r.totalUniversities;
      const avgWaitTime = r.avgWaitTime / r.totalUniversities;
      const avgHighRisk = r.highRiskPercentage / r.totalUniversities;

      // Determine status
      let status: "normal" | "warning" | "critical" = "normal";
      if (avgRiskScore >= 70) status = "critical";
      else if (avgRiskScore >= 50) status = "warning";

      return {
        ...r,
        avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        avgWaitTime: Math.round(avgWaitTime * 10) / 10,
        highRiskPercentage: Math.round(avgHighRisk * 10) / 10,
        status,
      };
    });

    const response = {
      universities: universityMetrics,
      regions: regionalMetrics,
      metadata: {
        totalUniversities: universities.length,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
        filters: { region, type, days },
      },
    };

    console.log(`[RISK_METRICS] Response ready with ${universityMetrics.length} universities and ${regionalMetrics.length} regions`);

    // Cache for 1 hour
    await setCache(cacheKey, response, CacheTTL.UNIVERSITIES);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[RISK_METRICS_API_ERROR]", error);
    console.error("[RISK_METRICS_API_ERROR_STACK]", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Failed to fetch risk metrics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

