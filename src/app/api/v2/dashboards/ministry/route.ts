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

    // Calculate metrics for each university
    const universityMetrics: UniversityRiskMetrics[] = await Promise.all(
      universities.map(async (uni) => {
        try {
          // 1. Queue Size (pending bookings - PENDING_ASSIGNMENT or ASSIGNED)
          const queueSize = await prisma.booking.count({
            where: {
              university_id: uni.university_id,
              booking_status: { in: ["PENDING_ASSIGNMENT", "ASSIGNED"] },
            },
          });

          //2. Average Wait Time (from booking creation to time slot start)
          const completedBookings = await prisma.booking.findMany({
            where: {
              university_id: uni.university_id,
              booking_status: { in: ["IN_PROGRESS", "COMPLETED"] },
              booking_created_at: { gte: startDate },
            },
            select: {
              booking_created_at: true,
              timeSlot: {
                select: {
                  time_slot_start_datetime: true,
                },
              },
            },
          });

          const avgWaitTime =
            completedBookings.length > 0
              ? completedBookings.reduce((sum, b) => {
                  const waitDays = Math.floor(
                    (new Date(b.timeSlot.time_slot_start_datetime).getTime() -
                      new Date(b.booking_created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return sum + Math.max(waitDays, 0); // Ensure non-negative
                }, 0) / completedBookings.length
              : 0;

          // 3. High Risk Percentage
          const totalOutcomes = await prisma.bookingOutcome.count({
            where: {
              booking: {
                university_id: uni.university_id,
              },
              booking_outcome_recorded_at: { gte: startDate },
            },
          });

          const highRiskOutcomes = await prisma.bookingOutcome.count({
            where: {
              booking: {
                university_id: uni.university_id,
              },
              booking_outcome_risk_level: { gte: 7 }, // 7-10 = High Risk
              booking_outcome_recorded_at: { gte: startDate },
            },
          });

          const highRiskPercentage =
            totalOutcomes > 0 ? (highRiskOutcomes / totalOutcomes) * 100 : 0;

          // 4. Therapist Utilization (stub - TODO: calculate from actual slots)
          const totalConsultants = uni._count.consultants;
          const therapistUtilization = totalConsultants > 0 ? (queueSize / (totalConsultants * 20)) * 100 : 0; // Assume 20 slots per consultant

          // Calculate Risk Score
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
            universityType: uni.university_type || "PUBLIC",
            province: uni.province.province_name_th,
            regionCode: uni.province.region.region_code,
            regionName: uni.province.region.region_name_th,
            queueSize,
            avgWaitTime: Math.round(avgWaitTime * 10) / 10,
            highRiskPercentage: Math.round(highRiskPercentage * 10) / 10,
            therapistUtilization: Math.round(Math.min(therapistUtilization, 100) * 10) / 10,
            riskScore,
          };
        } catch (err) {
          console.error(`[RISK_METRICS] Error calculating metrics for university ${uni.university_code}:`, err);
          // Return default metrics on error
          return {
            universityId: uni.university_id,
            universityCode: uni.university_code,
            universityName: uni.university_name_th,
            universityType: uni.university_type || "PUBLIC",
            province: uni.province.province_name_th,
            regionCode: uni.province.region.region_code,
            regionName: uni.province.region.region_name_th,
            queueSize: 0,
            avgWaitTime: 0,
            highRiskPercentage: 0,
            therapistUtilization: 0,
            riskScore: 0,
          };
        }
      })
    );

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

