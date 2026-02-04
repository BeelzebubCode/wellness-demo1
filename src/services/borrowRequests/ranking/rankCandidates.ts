import { haversineKm } from "./haversine";
import type { BorrowRequestDetailJson, RankedUniversity } from "../types";

export function rankUniversities(params: {
  from: { lat?: number | null; lng?: number | null };
  universities: Array<{
    university_id: number;
    university_code: string;
    university_name_th: string;
    university_latitude: any; // Decimal | null
    university_longitude: any; // Decimal | null
  }>;
  shifts: Array<any>;
  detail: BorrowRequestDetailJson;
}) {
  const { from, universities, shifts, detail } = params;

  const fromLat = from.lat ?? null;
  const fromLng = from.lng ?? null;

  const requiredTopics = (detail.requiredTopics ?? []).map((s) => s.trim()).filter(Boolean);

  // group shifts by university
  const shiftsByUni = new Map<number, any[]>();
  for (const sh of shifts) {
    const uniId = sh.consultant_university_id;
    const arr = shiftsByUni.get(uniId) ?? [];
    arr.push(sh);
    shiftsByUni.set(uniId, arr);
  }

  const ranked: RankedUniversity[] = universities.map((u) => {
    const uLat = u.university_latitude ? Number(u.university_latitude) : null;
    const uLng = u.university_longitude ? Number(u.university_longitude) : null;

    const distanceKm =
      fromLat != null && fromLng != null && uLat != null && uLng != null
        ? haversineKm(fromLat, fromLng, uLat, uLng)
        : null;

    const uniShifts = shiftsByUni.get(u.university_id) ?? [];

    // Build consultant availability list
    const consultantMap = new Map<number, any>();
    for (const sh of uniShifts) {
      const c = sh.consultant;
      if (!c) continue;
      const id = c.consultant_id;

      const profile = c.profile;
      const name =
        profile
          ? `${profile.consultant_first_name ?? ""} ${profile.consultant_last_name ?? ""}`.trim() ||
            `Consultant#${id}`
          : `Consultant#${id}`;

      const specTopics: string[] =
        (c.specializations ?? []).map((x: any) => String(x.consultant_specialization_topic));

      const matchedTopics = requiredTopics.length
        ? specTopics.filter((t) => requiredTopics.some((r) => t.includes(r) || r.includes(t)))
        : [];

      const entry = consultantMap.get(id) ?? {
        consultantId: id,
        consultantUniversityId: sh.consultant_university_id,
        consultantName: name,
        matchedTopics: [],
        shifts: [],
      };

      entry.matchedTopics = Array.from(new Set([...entry.matchedTopics, ...matchedTopics]));
      entry.shifts.push({
        borrowOnCallShiftId: sh.borrow_on_call_shift_id,
        startAt: sh.on_call_start_at.toISOString(),
        endAt: sh.on_call_end_at.toISOString(),
        status: sh.on_call_status,
      });

      consultantMap.set(id, entry);
    }

    const availableConsultants = Array.from(consultantMap.values());

    // ---- Scoring ----
    // distance score: ใกล้ = ได้คะแนนมาก (ถ้าไม่มี distance ให้ 0)
    const distanceScore =
      distanceKm == null ? 0 : Math.max(0, 100 - distanceKm); // 0..100 (ประมาณ)

    // shift score: มี shift มากขึ้น = ได้คะแนน
    const shiftScore = Math.min(60, availableConsultants.reduce((sum, c) => sum + c.shifts.length, 0) * 10);

    // topic score: match topics มากขึ้น = ได้คะแนน
    const topicScore = requiredTopics.length
      ? Math.min(80, availableConsultants.reduce((sum, c) => sum + c.matchedTopics.length, 0) * 20)
      : 10; // ถ้าไม่ระบุ topics ให้ baseline นิดนึง

    const matchScore = distanceScore * 1.2 + shiftScore * 1.5 + topicScore * 1.3;

    const reasons: string[] = [];
    if (distanceKm != null) reasons.push(`ใกล้: ~${distanceKm.toFixed(1)} กม.`);
    reasons.push(`มีเวรว่าง: ${availableConsultants.length} คน`);
    if (requiredTopics.length) reasons.push(`ตรงความเชี่ยวชาญ: ${requiredTopics.join(", ")}`);

    // sort consultant inside uni: คนที่ match topic + shift เยอะอยู่บน
    availableConsultants.sort((a, b) => {
      const aScore = a.matchedTopics.length * 100 + a.shifts.length * 10;
      const bScore = b.matchedTopics.length * 100 + b.shifts.length * 10;
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

  // sort universities: score desc (มี distance/shift/topic รวม)
  ranked.sort((a, b) => b.matchScore - a.matchScore);

  return ranked;
}
