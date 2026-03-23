"use server";

import { SuperAdminService } from "@/services/super-admin/super-admin-service";

export async function getSystemOverview() {
  return await SuperAdminService.getSystemOverview();
}

export async function getBorrowStats(preset: "7d" | "30d" | "90d" | "all") {
  return await SuperAdminService.getBorrowStats(preset);
}

export async function getBorrowTrend(preset: "7d" | "30d" | "90d" | "all") {
  return await SuperAdminService.getBorrowTrend(preset);
}

export async function getTopUniversities(preset: "7d" | "30d" | "90d" | "all") {
  return await SuperAdminService.getTopUniversities(preset);
}

export async function getSupplyDemandGap() {
  return await SuperAdminService.getSupplyDemandGap();
}

export async function getHighRiskResponseTime() {
  return await SuperAdminService.getHighRiskResponseTime();
}

export async function getLowAdoptionUniversities(preset: "30d" | "90d" | "180d" | "all" = "90d") {
  return await SuperAdminService.getLowAdoptionUniversities(preset);
}

export async function getBorrowSystemHealth() {
  return await SuperAdminService.getBorrowSystemHealth();
}

