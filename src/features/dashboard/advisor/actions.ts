//C:\wellness-demo1\src\features\dashboard\advisor\actions.ts

"use server";

import { AdvisorService } from "@/services/advisor/advisor-service";
import { AuthUser } from "@/features/auth/types";

export async function getAdviseeStats(user: AuthUser) {
  try {
    return await AdvisorService.getAdviseeStats(user.id);
  } catch (error) {
    console.error("Failed to fetch advisee stats:", error);
    return null;
  }
}

export async function getMyStudents(user: AuthUser, filters?: { search?: string; riskLevel?: string }) {
  try {
    return await AdvisorService.getMyStudents(user.id, filters);
  } catch (error) {
    console.error("Failed to fetch advisee list:", error);
    return [];
  }
}

export async function getAdvisorRiskTrends(
  user: AuthUser,
  filters?: { startDate?: Date; endDate?: Date }
) {
    try {
        return await AdvisorService.getStudentRiskTrends(user.id, filters);
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getAdvisorAnalytics(
  user: AuthUser,
  filters?: { startDate?: Date; endDate?: Date; problemCategoryId?: number; gender?: string }
) {
    try {
        return await AdvisorService.getAdvisorAnalytics(user.id, filters);
    } catch (error) {
        console.error("Failed to fetch advisor analytics:", error);
        return null;
    }
}

export async function getStudentDetail(user: AuthUser, studentId: number) {
    try {
        return await AdvisorService.getStudentDetail(user.id, studentId);
    } catch (error) {
        console.error("Failed to fetch student detail:", error);
        return null;
    }
}
