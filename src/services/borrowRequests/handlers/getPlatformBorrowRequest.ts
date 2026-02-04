// src/services/borrowRequests/handlers/getPlatformBorrowRequest.ts

import {
  getBorrowRequestById,
  getBorrowWindowDays,
  listActiveUniversitiesExclude,
  listOnCallShiftsForUniversities,
} from "../repo";
import { safeParseDetail } from "../validators";
import { rankUniversities } from "../ranking/rankCandidates";

export async function getPlatformBorrowRequest(borrowRequestId: number) {
  const req = await getBorrowRequestById(borrowRequestId);
  if (!req) throw new Error("BorrowRequest not found");

  const parsedDetail = safeParseDetail(req.borrow_request_detail ?? null);

  const fromUni = req.fromUniversity;
  const fromLat = fromUni?.university_latitude ? Number(fromUni.university_latitude) : null;
  const fromLng = fromUni?.university_longitude ? Number(fromUni.university_longitude) : null;

  const universities = await listActiveUniversitiesExclude(req.from_university_id);
  const uniIds = universities.map((u) => u.university_id);

  const windowDays = await getBorrowWindowDays(null); // ใช้ global policy ก่อน (ง่าย/ชัวร์)
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const shifts = await listOnCallShiftsForUniversities({
    universityIds: uniIds,
    requestStart: req.borrow_needed_from ?? null,
    requestEnd: req.borrow_needed_to ?? null,
    windowStart: now,
    windowEnd,
  });

  const rankedUniversities = rankUniversities({
    from: { lat: fromLat, lng: fromLng },
    universities,
    shifts,
    detail: parsedDetail,
  });

  return {
    request: req,
    parsedDetail,
    rankedUniversities,
  };
}
