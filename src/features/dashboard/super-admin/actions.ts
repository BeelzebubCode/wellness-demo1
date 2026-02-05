"use server";

import { SuperAdminService } from "@/services/super-admin/super-admin-service";

export async function getSystemStats() {
  return await SuperAdminService.getSystemStats();
}

export async function getUniversityGrowth() {
  return await SuperAdminService.getUniversityGrowth();
}
