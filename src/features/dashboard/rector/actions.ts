"use server";

import { RectorService } from "@/services/rector/rector-service";

// Actions now take user context or ID to identify university
// Assuming we pass universityId directly for simplicity, or we derive from session if we had server session.
// Since we use client-side useRoleAuth, we will pass the universityId found in the user object.

export async function getRectorKPI(universityId: number, filters?: { startDate?: string; endDate?: string }) {
  return await RectorService.getRectorKPI(universityId, filters);
}

export async function getMentalHealthTrends(universityId: number, filters?: { startDate?: string; endDate?: string }) {
  return await RectorService.getMentalHealthTrends(universityId, filters);
}

export async function getRectorRiskDistribution(universityId: number, filters?: { startDate?: string; endDate?: string }) {
  return await RectorService.getRiskDistribution(universityId, filters);
}

export async function getFacultyStats(universityId: number, filters?: { startDate?: string; endDate?: string }) {
  return await RectorService.getFacultyStats(universityId, filters);
}
