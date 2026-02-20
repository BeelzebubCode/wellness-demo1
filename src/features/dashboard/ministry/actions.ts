"use server";

import { MinistryService } from "@/services/dashboards/handlers/getMinistryDashboard";

export async function getMinistryStats() {
  try {
    const stats = await MinistryService.getNationalStats();
    
    // Calculate mocks for now if data is empty (for demo)
    // In real prod, just return stats.
    
    return {
       nationalAvgRisk: 0, // Need complex calc
       criticalUniversities: 0, // Need complex calc from ranking
       ...stats
    };
  } catch (error) {
    console.error("Failed to fetch ministry stats:", error);
    return null;
  }
}

export async function getMinistryRiskDistribution() {
    try {
        return await MinistryService.getRiskDistribution();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getRiskyUniversities() {
  try {
    return await MinistryService.getUniversityRankings();
  } catch (error) {
    console.error(error);
    return [];
  }
}
