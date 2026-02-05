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

export async function getAdvisorRiskTrends(user: AuthUser) {
    try {
        return await AdvisorService.getStudentRiskTrends(user.id);
    } catch (error) {
        console.error(error);
        return [];
    }
}
