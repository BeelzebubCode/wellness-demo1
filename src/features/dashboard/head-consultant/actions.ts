"use server";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/token";
import { HeadConsultantService } from "@/services/consultant/head-consultant-service";

/** ดึง universityId จาก auth_token cookie (server action) */
async function getUniversityId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.activeUniversityId ?? payload?.homeUniversityId ?? null;
}

export async function getBookingStats(from?: string, to?: string) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return null;
    return await HeadConsultantService.getBookingStats(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
    });
  } catch (err) {
    console.error("getBookingStats failed:", err);
    return null;
  }
}

export async function getTopStudents(limit = 10) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getTopStudentsByPoints(uniId, limit);
  } catch (err) {
    console.error("getTopStudents failed:", err);
    return [];
  }
}

export async function getCategoryDistribution(from?: string, to?: string, riskLevels?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getProblemCategoryDistribution(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      riskLevels,
    });
  } catch (err) {
    console.error("getCategoryDistribution failed:", err);
    return [];
  }
}



export async function getConsultantRatings(from?: string, to?: string) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getConsultantRatings(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
    });
  } catch (err) {
    console.error("getConsultantRatings failed:", err);
    return [];
  }
}

export async function getTeamOverview(from?: string, to?: string) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getTeamOverview(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
    });
  } catch (err) {
    console.error("getTeamOverview failed:", err);
    return [];
  }
}

export async function getConsultantHistory(
  consultantId: number,
  options?: { from?: string; to?: string; skip?: number; take?: number }
) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return { items: [], total: 0 };
    
    return await HeadConsultantService.getConsultantCaseHistory(uniId, consultantId, {
      startDate: options?.from ? new Date(options.from) : undefined,
      endDate: options?.to ? new Date(options.to) : undefined,
      skip: options?.skip,
      take: options?.take,
    });
  } catch (err) {
    console.error("getConsultantHistory failed:", err);
    return { items: [], total: 0 };
  }
}

export async function getRiskDistribution(from?: string, to?: string, serviceModes?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return { distribution: [], highRiskCount: 0 };
    return await HeadConsultantService.getRiskDistribution(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      serviceModes,
    });
  } catch (err) {
    console.error("getRiskDistribution failed:", err);
    return { distribution: [], highRiskCount: 0 };
  }
}

export async function getBookingTrend(from?: string, to?: string, serviceModes?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getBookingTrend(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      serviceModes,
    });
  } catch (err) {
    console.error("getBookingTrend failed:", err);
    return [];
  }
}

export async function getWorkloadBalance() {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getWorkloadBalance(uniId);
  } catch (err) {
    console.error("getWorkloadBalance failed:", err);
    return [];
  }
}

export async function getResponseTimeMetrics(from?: string, to?: string, riskLevels?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return { avgAssignmentHours: 0, avgConsultationHours: 0, overdueCount: 0 };
    return await HeadConsultantService.getResponseTimeMetrics(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      riskLevels,
    });
  } catch (err) {
    console.error("getResponseTimeMetrics failed:", err);
    return { avgAssignmentHours: 0, avgConsultationHours: 0, overdueCount: 0 };
  }
}

export async function getPeakHoursMetrics(from?: string, to?: string, serviceModes?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getPeakHoursMetrics(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      serviceModes,
    });
  } catch (err) {
    console.error("getPeakHoursMetrics failed:", err);
    return [];
  }
}

export async function getAttendanceInsights(from?: string, to?: string, serviceModes?: number[]) {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return { checkedIn: 0, late: 0, noShow: 0, pending: 0, cancelledByConsultant: 0, pendingExceptions: 0 };
    return await HeadConsultantService.getAttendanceInsights(uniId, {
      startDate: from ? new Date(from) : undefined,
      endDate: to ? new Date(to) : undefined,
      serviceModes,
    });
  } catch (err) {
    console.error("getAttendanceInsights failed:", err);
    return { checkedIn: 0, late: 0, noShow: 0, pending: 0, cancelledByConsultant: 0, pendingExceptions: 0 };
  }
}

