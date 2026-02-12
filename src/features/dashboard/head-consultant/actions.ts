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

export async function getBookingStats() {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return null;
    return await HeadConsultantService.getBookingStats(uniId);
  } catch (err) {
    console.error("getBookingStats failed:", err);
    return null;
  }
}

export async function getCategoryDistribution() {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getProblemCategoryDistribution(uniId);
  } catch (err) {
    console.error("getCategoryDistribution failed:", err);
    return [];
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

export async function getConsultantRatings() {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getConsultantRatings(uniId);
  } catch (err) {
    console.error("getConsultantRatings failed:", err);
    return [];
  }
}

export async function getTeamOverview() {
  try {
    const uniId = await getUniversityId();
    if (!uniId) return [];
    return await HeadConsultantService.getTeamOverview(uniId);
  } catch (err) {
    console.error("getTeamOverview failed:", err);
    return [];
  }
}
