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

  // 3) ดึง consultant ทั้งหมดที่ "อยู่มหาลัยอื่น" พร้อมข้อมูลที่เกี่ยวข้อง
  // ✅ Optimize: Include relations to avoid "too many parameters" error from large IN clauses
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

      // ✅ Include BUSY shifts (Active)
      borrowAvailabilities: {
        where: {
          status: "ACTIVE",
          ...(br.borrow_needed_from && br.borrow_needed_to
            ? {
                availability_start_date: { lt: br.borrow_needed_to },
                availability_end_date: { gt: br.borrow_needed_from },
              }
            : {}),
        },
        select: {
          consultant_borrow_availability_id: true,
          availability_start_date: true,
          availability_end_date: true,
          status: true,
          targetUniversity: {
            select: {
              university_name_th: true,
            },
          },
        },
      },

      // ✅ Include Active Assignments (Already assigned to this or other requests)
      borrowAssignments: {
        where: {
          borrowRequest: {
            borrow_request_status: { in: ["APPROVED", "ASSIGNED"] },
          },
          ...(br.borrow_needed_from && br.borrow_needed_to
            ? {
                borrow_assign_start_at: { lt: br.borrow_needed_to },
                borrow_assign_end_at: { gt: br.borrow_needed_from },
              }
            : {}),
        },
        select: {
          borrow_assignment_id: true,
        },
      },
    },
  });

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
          targetUniversityName?: string;
        }>;
      }>;
    }
  >();

  for (const c of consultants) {
    const u = c.university;
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

    const topicMatchCount = problemTopics.length
      ? specializations.filter((spec) =>
          problemTopics.some((req) => spec.includes(req) || req.includes(spec))
        ).length
      : 0;

    // ✅ Map shifts from relation
    const mappedShifts = c.borrowAvailabilities.map((shift) => ({
      shiftId: shift.consultant_borrow_availability_id,
      startAt: shift.availability_start_date.toISOString(),
      endAt: shift.availability_end_date.toISOString(),
      status: shift.status,
      currentBorrowCount: 1, 
      targetUniversityName: shift.targetUniversity.university_name_th,
    }));

    // ✅ Check active assignments from relation
    const isAlreadyAssigned = c.borrowAssignments.length > 0;

    map.get(uniId)!.consultants.push({
      consultantId: c.consultant_id,
      fullName,
      nickname,
      specializations,
      topicMatchCount,
      alreadyAssigned: isAlreadyAssigned,
      shifts: mappedShifts,
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
