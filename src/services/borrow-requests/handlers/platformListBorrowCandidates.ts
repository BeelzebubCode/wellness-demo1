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

  // 3) Calculate active shift teams during the requested borrow period
  let activeTeamOrders: number[] | null = null;
  if (br.borrow_needed_from && br.borrow_needed_to) {
    const epochDate = new Date("2024-01-01"); // from config
    const cycleDays = 56;
    const teamLengthDays = 14;
    const msPerDay = 24 * 60 * 60 * 1000;

    const startMs = br.borrow_needed_from.getTime();
    const endMs = br.borrow_needed_to.getTime();
    const activeTeamsSet = new Set<number>();

    const checkTime = (time: number) => {
      const d = new Date(time);
      const diffMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(epochDate.getFullYear(), Math.floor(epochDate.getMonth()), epochDate.getDate());
      const daysSinceEpoch = Math.floor(diffMs / msPerDay);
      if (daysSinceEpoch >= 0) {
        const cycleDay = daysSinceEpoch % cycleDays;
        const teamOrder = Math.floor(cycleDay / teamLengthDays) + 1;
        activeTeamsSet.add(teamOrder);
      }
    };

    // Check each day in the range
    for (let t = startMs; t <= endMs; t += msPerDay) {
      checkTime(t);
    }
    // Check end time specifically to catch overlaps
    checkTime(endMs);

    activeTeamOrders = Array.from(activeTeamsSet);
  }

  // 4) Fetch the exact shift_team_ids that correspond to the active team orders
  let activeShiftTeamIds: number[] = [];
  const shiftTeamMap = new Map<number, { order: number; name: string }>();

  if (activeTeamOrders && activeTeamOrders.length > 0) {
    const teams = await prisma.consultantShiftTeam.findMany({
      where: {
        team_order: { in: activeTeamOrders },
      },
      select: {
        shift_team_id: true,
        team_order: true,
        team_name: true,
      },
    });
    activeShiftTeamIds = teams.map((t) => t.shift_team_id);
    teams.forEach((t) => {
      shiftTeamMap.set(t.shift_team_id, { order: t.team_order, name: t.team_name });
    });
  }

  // 5) ดึง consultant ทั้งหมดที่ "อยู่มหาลัยอื่น" พร้อมข้อมูลที่เกี่ยวข้อง
  // ✅ Optimize: Include relations to avoid "too many parameters" error from large IN clauses
  const consultants = await prisma.consultant.findMany({
    where: {
      university_id: { not: fromUniversityId }, // ✅ exclude ม.ต้นทาง
      account: {
        account_role: { not: "HEAD_CONSULTANT" }, // ✅ ไม่รวม Head Consultant
      },
      // ✅ Must be in an active shift team during the requested period
      ...(activeShiftTeamIds.length > 0
        ? {
          shift_team_id: { in: activeShiftTeamIds },
        }
        : {}),
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

      // ✅ Remove consultantShiftTeam relation select as it relies on a broken foreign key

      // Also need to select shift_team_id so we can map it later
      shift_team_id: true,
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

    // ✅ Map shifts from manual lookup (since relation is broken)
    const teamInfo = c.shift_team_id ? shiftTeamMap.get(c.shift_team_id) : null;
    const mappedShifts = teamInfo ? [{
      shiftId: teamInfo.order,
      startAt: br.borrow_needed_from?.toISOString() || new Date().toISOString(),
      endAt: br.borrow_needed_to?.toISOString() || new Date().toISOString(),
      status: "ACTIVE",
      currentBorrowCount: 0,
      targetUniversityName: "พร้อมถูกยืม",
    }] : [];

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
