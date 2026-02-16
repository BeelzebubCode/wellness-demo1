import prisma from "@/lib/prisma";
import {
  getBorrowRequestById,
  getBorrowWindowDays,
  listActiveUniversitiesExclude,
} from "../repo";
import { safeParseDetail } from "../validators";
import { haversineKm } from "../ranking/haversine";
import type { RankedUniversity } from "../types";

export async function getPlatformBorrowRequest(borrowRequestId: number) {
  const req = await getBorrowRequestById(borrowRequestId);
  if (!req) throw new Error("BorrowRequest not found");

  const parsedDetail = safeParseDetail(req.borrow_request_detail ?? null);
  const requiredTopics = (parsedDetail.requiredTopics ?? []).map(t => t.trim()).filter(Boolean);

  const fromUni = req.fromUniversity;
  const fromLat = fromUni?.university_latitude ? Number(fromUni.university_latitude) : null;
  const fromLng = fromUni?.university_longitude ? Number(fromUni.university_longitude) : null;

  const universities = await listActiveUniversitiesExclude(req.from_university_id);
  const uniIds = universities.map((u) => u.university_id);

  const windowDays = await getBorrowWindowDays(null); // Global policy
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
  
  const requestStart = req.borrow_needed_from ? new Date(req.borrow_needed_from) : null;
  const requestEnd = req.borrow_needed_to ? new Date(req.borrow_needed_to) : null;

  // 1. Fetch Consultants
  const consultants = await prisma.consultant.findMany({
    where: { university_id: { in: uniIds } },
    include: {
      profile: true,
      specializations: true,
    },
  });

  // 2. Fetch Busy Shifts
  const busyShifts = await prisma.consultantBorrowAvailability.findMany({
    where: {
      consultant_id: { in: consultants.map((c) => c.consultant_id) },
      status: "ACTIVE",
      availability_start_date: { lt: windowEnd }, // Overlap logic
      availability_end_date: { gt: now },
    },
    select: {
      consultant_id: true,
      availability_start_date: true,
      availability_end_date: true,
    },
  });

  const busyMap = new Map<number, typeof busyShifts>();
  for (const s of busyShifts) {
    const arr = busyMap.get(s.consultant_id) ?? [];
    arr.push(s);
    busyMap.set(s.consultant_id, arr);
  }

  const consultantsByUni = new Map<number, typeof consultants>();
  for (const c of consultants) {
    const uniId = c.university_id;
    const arr = consultantsByUni.get(uniId) ?? [];
    arr.push(c);
    consultantsByUni.set(uniId, arr);
  }

  const rankedUniversities: RankedUniversity[] = universities.map((u) => {
    const uLat = u.university_latitude ? Number(u.university_latitude) : null;
    const uLng = u.university_longitude ? Number(u.university_longitude) : null;

    const distanceKm =
      fromLat != null && fromLng != null && uLat != null && uLng != null
        ? haversineKm(fromLat, fromLng, uLat, uLng)
        : null;

    const uniConsultants = consultantsByUni.get(u.university_id) ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consultantMap = new Map<number, any>();

    for (const c of uniConsultants) {
      const id = c.consultant_id;
      
      const busyArr = busyMap.get(id) ?? [];
      let isBusy = false;
      if (requestStart && requestEnd) {
          isBusy = busyArr.some(s => s.availability_start_date < requestEnd && s.availability_end_date > requestStart);
      }

      if (isBusy) continue;

      const profile = c.profile;
      const name =
        profile
          ? `${profile.consultant_first_name ?? ""} ${profile.consultant_last_name ?? ""}`.trim() ||
            `Consultant#${id}`
          : `Consultant#${id}`;

      const specTopics: string[] = (c.specializations ?? []).map((x) =>
        String(x.consultant_specialization_topic ?? "")
      );

      const matchedTopics =
        requiredTopics.length === 0
          ? []
          : specTopics.filter((t) =>
              requiredTopics.some((r) => t.includes(r) || r.includes(t))
            );

      const entry = consultantMap.get(id) ?? {
        consultantId: id,
        consultantUniversityId: c.university_id,
        consultantName: name,
        matchedTopics: [],
        shifts: [],
      };

      entry.matchedTopics = matchedTopics;
      consultantMap.set(id, entry);
    }

    const availableConsultants = Array.from(consultantMap.values());

    const distanceScore = distanceKm == null ? 0 : Math.max(0, 100 - distanceKm);
    
    // Shift score: In new model, simplified. If available, 10 points.
    const shiftScore = Math.min(60, availableConsultants.length * 10);
    
    const topicScore =
      requiredTopics.length === 0
        ? 10
        : Math.min(
            80,
            availableConsultants.reduce((s, c) => s + c.matchedTopics.length, 0) * 20
          );

    const matchScore = distanceScore * 1.2 + shiftScore * 1.5 + topicScore * 1.3;

    const reasons: string[] = [];
    if (distanceKm != null) reasons.push(`ใกล้: ~${distanceKm.toFixed(1)} กม.`);
    reasons.push(`มีผู้เชี่ยวชาญพร้อม: ${availableConsultants.length} คน`);
    if (requiredTopics.length) reasons.push(`ตรงความเชี่ยวชาญ: ${requiredTopics.join(", ")}`);

    availableConsultants.sort((a, b) => {
      const aScore = a.matchedTopics.length * 100 + 10;
      const bScore = b.matchedTopics.length * 100 + 10;
      return bScore - aScore;
    });

    return {
      universityId: u.university_id,
      universityCode: u.university_code,
      universityNameTh: u.university_name_th,
      distanceKm,
      matchScore,
      reasons,
      availableConsultants,
    };
  });

  rankedUniversities.sort((a, b) => b.matchScore - a.matchScore);

  return {
    request: req,
    parsedDetail,
    rankedUniversities,
  };
}
