// src/services/borrowRequests/handlers/platformListBorrowCandidates.ts

import prisma from "@/lib/prisma";
import { haversineKm } from "../ranking/haversine";

// ✅ Prisma Decimal -> number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decToNumber(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "object" && typeof v.toNumber === "function") return v.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Response ที่ FE modal จะใช้:
 * {
 *   fromUniversityId: number,
 *   groups: [
 *     {
 *       universityId: number,
 *       universityNameTh: string,
 *       universityNameEn?: string | null,
 *       distanceKm: number | null,
 *       consultants: [
 *         {
 *           consultantId: number,
 *           fullName: string,
 *           nickname?: string | null,
 *           specializations: string[]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function platformListBorrowCandidates(input: {
  accountId: number; // (ไว้ให้ pattern เดียวกับ handler อื่น ๆ)
  borrowRequestId: number;
  fromUniversityId?: number;
}) {
  // 1) หา borrow request เพื่อรู้ from_university_id + detail (problem topics) + เวลาที่ต้องการยืม
  const br = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: input.borrowRequestId },
    select: {
      borrow_request_id: true,
      from_university_id: true,
      borrow_request_status: true,
      borrow_request_detail: true, // ✅ เพิ่ม detail เพื่อดูหัวข้อปัญหา
      borrow_needed_from: true, // ✅ เวลาเริ่มต้นที่ต้องการยืม
      borrow_needed_to: true, // ✅ เวลาสิ้นสุดที่ต้องการยืม
    },
  });

  if (!br) throw new Error("NOT_FOUND");

  const fromUniversityId = input.fromUniversityId ?? br.from_university_id;

  // ✅ Parse detail JSON เพื่อดูหัวข้อปัญหา (problem topics)

  let problemTopics: string[] = [];
  try {
    if (br.borrow_request_detail) {
      const parsed = JSON.parse(br.borrow_request_detail);
      problemTopics = (parsed.requiredTopics || []).map((s: string) => s.trim()).filter(Boolean);
    }
  } catch {
    // ถ้า parse ไม่ได้ให้เป็น array ว่าง
  }

  // 2) โหลด coords ของมหาลัยต้นทาง
  const fromUni = await prisma.university.findUnique({
    where: { university_id: fromUniversityId },
    select: {
      university_id: true,
      university_name_th: true,
      university_name_en: true,
      university_latitude: true,
      university_longitude: true,
    },
  });

  if (!fromUni) throw new Error("FROM_UNIVERSITY_NOT_FOUND");

  const fromLat = decToNumber(fromUni.university_latitude);
  const fromLng = decToNumber(fromUni.university_longitude);

  // 3) ดึง consultant ทั้งหมดที่ "อยู่มหาลัยอื่น" + include profile + specializations
  const consultants = await prisma.consultant.findMany({
    where: {
      university_id: { not: fromUniversityId }, // ✅ exclude ม.ต้นทาง
    },
    select: {
      consultant_id: true,
      university_id: true,

      profile: {
        select: {
          consultant_first_name: true,
          consultant_last_name: true,
          consultant_nickname: true,
        },
      },

      specializations: {
        select: {
          consultant_specialization_topic: true,
        },
      },

      university: {
        select: {
          university_id: true,
          university_name_th: true,
          university_name_en: true,
          university_latitude: true,
          university_longitude: true,
        },
      },
    },
  });

  // ✅ 3.5) โหลด BorrowOnCallShift สำหรับ consultant ทั้งหมด (filter ตาม shift overlap)
  const consultantIds = consultants.map((c) => c.consultant_id);

  const shifts = await prisma.borrowOnCallShift.findMany({
    where: {
      consultant_id: { in: consultantIds },
      on_call_status: { in: ["SCHEDULED", "ACTIVE"] }, // ✅ เฉพาะ shift ที่ active
      // ✅ Shift overlap logic: shift.start <= borrow.end AND shift.end >= borrow.start
      ...(br.borrow_needed_from && br.borrow_needed_to
        ? {
          on_call_start_at: { lte: br.borrow_needed_to },
          on_call_end_at: { gte: br.borrow_needed_from },
        }
        : {}),
    },
    select: {
      borrow_on_call_shift_id: true,
      consultant_id: true,
      on_call_start_at: true,
      on_call_end_at: true,
      on_call_status: true,
      // ✅ ดูว่า shift นี้ถูกยืมไปแล้วหรือยัง
      borrowAssignments: {
        select: {
          borrow_assignment_id: true,
          borrow_assign_start_at: true,
          borrow_assign_end_at: true,
        },
      },
    },
  });

  // ✅ สร้าง Map: consultantId -> shifts[]
  const shiftsByConsultant = new Map<number, typeof shifts>();
  for (const shift of shifts) {
    if (!shiftsByConsultant.has(shift.consultant_id)) {
      shiftsByConsultant.set(shift.consultant_id, []);
    }
    shiftsByConsultant.get(shift.consultant_id)!.push(shift);
  }

  // ✅ แสดง consultant ทั้งหมด (ไม่กรองตาม shift)
  // shift info จะแสดงเป็น optional information เท่านั้น
  const filteredConsultants = consultants;

  // ✅ ดึง borrow assignment ที่ active อยู่ เพื่อเช็คว่า consultant ถูกมอบหมายแล้วหรือไม่
  const activeAssignments = await prisma.borrowAssignment.findMany({
    where: {
      consultant_id: { in: consultantIds },
      borrowRequest: {
        borrow_request_status: { in: ["APPROVED", "ASSIGNED"] as any },
      },
      // เฉพาะที่ช่วงเวลาซ้อนกับคำขอนี้
      ...(br.borrow_needed_from && br.borrow_needed_to
        ? {
          borrow_assign_start_at: { lt: br.borrow_needed_to },
          borrow_assign_end_at: { gt: br.borrow_needed_from },
        }
        : {}),
    },
    select: {
      consultant_id: true,
    },
  });
  const alreadyAssignedSet = new Set(activeAssignments.map((a) => a.consultant_id));

  // 4) group by university
  const map = new Map<
    number,
    {
      universityId: number;
      universityNameTh: string;
      universityNameEn?: string | null;
      distanceKm: number | null;
      consultants: Array<{
        consultantId: number;
        fullName: string;
        nickname?: string | null;
        specializations: string[];
        topicMatchCount: number;
        alreadyAssigned: boolean; // ✅ ถูกมอบหมายแล้ว
        shifts: Array<{
          shiftId: number;
          startAt: string;
          endAt: string;
          status: string;
          currentBorrowCount: number;
        }>;
      }>;
    }
  >();

  for (const c of filteredConsultants) { // ✅ ใช้ filtered consultants
    const u = c.university; // ✅ relation จริงชื่อ university
    if (!u) continue;

    const uLat = decToNumber(u.university_latitude);
    const uLng = decToNumber(u.university_longitude);

    const canCalc =
      fromLat != null && fromLng != null && uLat != null && uLng != null;

    const distanceKm = canCalc ? haversineKm(fromLat, fromLng, uLat, uLng) : null;

    const uniId = u.university_id;

    if (!map.has(uniId)) {
      map.set(uniId, {
        universityId: uniId,
        universityNameTh: u.university_name_th || `University #${uniId}`,
        universityNameEn: u.university_name_en ?? null,
        distanceKm,
        consultants: [],
      });
    } else {
      // ✅ ถ้ามีหลาย consultant ในมหาลัยเดียวกัน ระยะทางควรเหมือนกัน
      // แต่เผื่อบางคน lat/lng null จะได้ไม่ทับค่าที่คำนวณได้
      const prev = map.get(uniId)!;
      if (prev.distanceKm == null && distanceKm != null) prev.distanceKm = distanceKm;
    }

    const first = c.profile?.consultant_first_name?.trim() || "";
    const last = c.profile?.consultant_last_name?.trim() || "";
    const fullName = `${first} ${last}`.trim() || `Consultant #${c.consultant_id}`;

    const nickname = c.profile?.consultant_nickname ?? null;

    const specializations =
      (c.specializations || [])
        .map((x) => x.consultant_specialization_topic)
        .filter((x): x is string => !!x && !!String(x).trim())
        .slice(0, 12);

    // ✅ นับจำนวน topic ที่ match กับหัวข้อปัญหา
    const topicMatchCount = problemTopics.length
      ? specializations.filter((spec) =>
        problemTopics.some((req) => spec.includes(req) || req.includes(spec))
      ).length
      : 0;

    // ✅ ดึง shift info สำหรับ consultant นี้
    const consultantShifts = shiftsByConsultant.get(c.consultant_id) || [];
    const shifts = consultantShifts.map((shift) => ({
      shiftId: shift.borrow_on_call_shift_id,
      startAt: shift.on_call_start_at.toISOString(),
      endAt: shift.on_call_end_at.toISOString(),
      status: shift.on_call_status,
      currentBorrowCount: shift.borrowAssignments.length, // จำนวนครั้งที่ถูกยืมใน shift นี้
    }));

    map.get(uniId)!.consultants.push({
      consultantId: c.consultant_id,
      fullName,
      nickname,
      specializations,
      topicMatchCount,
      alreadyAssigned: alreadyAssignedSet.has(c.consultant_id), // ✅ flag ถูกมอบหมายแล้ว
      shifts,
    });
  }

  // 5) sort: ระยะทางใกล้ก่อน (null ไปท้าย) + ภายในมหาลัย sort ตาม topic match > ชื่อ
  const groups = Array.from(map.values())
    .map((g) => ({
      ...g,
      consultants: [...g.consultants].sort((a, b) => {
        // ✅ เรียงตามจำนวน topic match ก่อน (มากสุดอยู่บน)
        if (b.topicMatchCount !== a.topicMatchCount) {
          return b.topicMatchCount - a.topicMatchCount;
        }
        // ถ้าจำนวน topic เท่ากัน ให้เรียงตามชื่อ
        return a.fullName.localeCompare(b.fullName, "th");
      }),
    }))
    .sort((a, b) => {
      const ad = a.distanceKm;
      const bd = b.distanceKm;
      if (ad == null && bd == null)
        return a.universityNameTh.localeCompare(b.universityNameTh, "th");
      if (ad == null) return 1;
      if (bd == null) return -1;
      return ad - bd;
    });

  return {
    fromUniversityId,
    groups,
  };
}
