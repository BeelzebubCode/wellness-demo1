// src/services/borrowRequests/handlers/getBorrowRequest.ts

import prisma from "@/lib/prisma";
import { safeParseDetail } from "../validators";
import { haversineKm } from "../helpers";

// --------------------
// helpers
// --------------------
function iso(d: Date | null | undefined) {
  return d ? d.toISOString() : null;
}

function normalizeTopics(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((x) => String(x).trim()).filter(Boolean);
}

async function getBorrowWindowDays(): Promise<number> {
  const policy = await prisma.borrowWindowPolicy.findFirst({
    where: { is_active: true },
    orderBy: { created_at: "desc" },
  });
  return policy?.borrow_window_days ?? 14;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBorrowRequest(pr: any) {
  return {
    borrowRequestId: pr.borrow_request_id,

    fromUniversityId: pr.from_university_id,
    fromUniversityCode: pr.fromUniversity?.university_code ?? null,
    fromUniversityNameTh: pr.fromUniversity?.university_name_th ?? null,

    // ✅ object-friendly
    fromUniversity: pr.fromUniversity
      ? {
        id: pr.fromUniversity.university_id,
        code: pr.fromUniversity.university_code ?? null,
        nameTh: pr.fromUniversity.university_name_th ?? null,
        nameEn: pr.fromUniversity.university_name_en ?? null,
      }
      : undefined,

    requestedByAccountId: pr.requested_by_account_id,
    requestedByName: pr.requestedBy?.account_username ?? null,

    // ✅ object-friendly
    requestedBy: pr.requestedBy
      ? {
        accountId: pr.requestedBy.account_id,
        username: pr.requestedBy.account_username ?? null,
        role: pr.requestedBy.account_role ?? null,
      }
      : undefined,

    borrowRequestTitle: pr.borrow_request_title,
    borrowRequestReason: pr.borrow_request_reason,
    borrowRequestDetail: pr.borrow_request_detail ?? null,

    borrowNeededFrom: iso(pr.borrow_needed_from),
    borrowNeededTo: iso(pr.borrow_needed_to),
    borrowNeededCount: pr.borrow_needed_count ?? 1,

    borrowRequestStatus: pr.borrow_request_status,

    borrowSubmittedAt: iso(pr.borrow_submitted_at),
    borrowApprovedAt: iso(pr.borrow_approved_at),

    // ❌ ลบทิ้ง: borrowRejectedAt, borrowRejectReason

    borrowRequestCreatedAt: iso(pr.borrow_request_created_at)!,
    borrowRequestUpdatedAt: iso(pr.borrow_request_updated_at)!,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssignment(a: any) {
  const first = a.consultant?.profile?.consultant_first_name?.trim?.() ?? "";
  const last = a.consultant?.profile?.consultant_last_name?.trim?.() ?? "";
  const fullName = `${first} ${last}`.trim() || `Consultant#${a.consultant_id}`;
  const nickname = a.consultant?.profile?.consultant_nickname ?? null;

  return {
    borrowAssignmentId: a.borrow_assignment_id,
    borrowRequestId: a.borrow_request_id,

    consultantId: a.consultant_id,
    consultantUniversityId: a.consultant_university_id,

    consultantName: fullName,
    consultantUniversityCode: a.consultantUniversity?.university_code ?? null,

    // ✅ object-friendly (optional ใช้ทีหลัง)
    consultant: {
      id: a.consultant_id,
      fullName,
      nickname,
    },
    consultantUniversity: a.consultantUniversity
      ? {
        id: a.consultantUniversity.university_id,
        code: a.consultantUniversity.university_code ?? null,
        nameTh: a.consultantUniversity.university_name_th ?? null,
        nameEn: a.consultantUniversity.university_name_en ?? null,
      }
      : undefined,

    borrowAssignStartAt: a.borrow_assign_start_at.toISOString(),
    borrowAssignEndAt: a.borrow_assign_end_at.toISOString(),

    borrowAssignedByAccountId: a.borrow_assigned_by_account_id,
    borrowAssignedAt: a.borrow_assigned_at
      ? a.borrow_assigned_at.toISOString()
      : new Date().toISOString(),

    borrowAssignmentNote: a.borrow_assignment_note ?? null,

    // ✅ bonus: ใคร assign (optional)
    assignedBy: a.assignedBy
      ? {
        accountId: a.assignedBy.account_id,
        username: a.assignedBy.account_username ?? null,
      }
      : undefined,
  };
}

// --------------------
// main
// --------------------
export async function getBorrowRequest(params: {
  borrowRequestId: number;
  includeRanking?: boolean; // platform view: true
}) {
  const req = await prisma.borrowRequest.findUnique({
    where: { borrow_request_id: params.borrowRequestId },
    include: {
      fromUniversity: {
        select: {
          university_id: true,
          university_code: true,
          university_name_th: true,
          university_name_en: true,
          university_latitude: true,
          university_longitude: true,
        },
      },
      requestedBy: {
        select: {
          account_id: true,
          account_username: true,
          account_role: true,
          // account_display_name ถ้ามีจริงค่อยใส่ (ตอนนี้ใน schema ที่ส่งมาไม่มี)
        },
      },
      assignments: {
        orderBy: { borrow_assigned_at: "desc" },
        include: {
          consultant: {
            include: {
              profile: true,
            },
          },
          consultantUniversity: true,
          assignedBy: true,
        },
      },
    },
  });
  if (!req) throw new Error("BorrowRequest not found");

  // ---- base detail (flat) ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detail: any = {
    ...mapBorrowRequest(req),
    assignments: (req.assignments ?? []).map(mapAssignment),
  };

  if (!params.includeRanking) {
    return detail; // ✅ FE รับ BorrowRequestDetail ได้เลย
  }

  // ---- ranking part ----
  const parsedDetail = safeParseDetail(req.borrow_request_detail ?? null);
  const requiredTopics = normalizeTopics(parsedDetail.requiredTopics);

  const fromLat = req.fromUniversity?.university_latitude
    ? Number(req.fromUniversity.university_latitude)
    : null;
  const fromLng = req.fromUniversity?.university_longitude
    ? Number(req.fromUniversity.university_longitude)
    : null;

  const universities = await prisma.university.findMany({
    where: {
      university_is_active: true,
      university_id: { not: req.from_university_id },
    },
    select: {
      university_id: true,
      university_code: true,
      university_name_th: true,
      university_latitude: true,
      university_longitude: true,
    },
  });

  const uniIds = universities.map((u) => u.university_id);

  const windowDays = await getBorrowWindowDays();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

  const requestStart = req.borrow_needed_from ? new Date(req.borrow_needed_from) : null;
  const requestEnd = req.borrow_needed_to ? new Date(req.borrow_needed_to) : null;

  const shifts = await prisma.borrowOnCallShift.findMany({
    where: {
      consultant_university_id: { in: uniIds },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on_call_status: { in: ["SCHEDULED", "ACTIVE"] as any },
      on_call_start_at: { gte: now, lte: windowEnd },
      ...(requestStart && requestEnd
        ? {
          AND: [
            { on_call_start_at: { lt: requestEnd } },
            { on_call_end_at: { gt: requestStart } },
          ],
        }
        : {}),
    },
    include: {
      consultant: {
        include: {
          profile: true,
          specializations: true,
        },
      },
    },
    orderBy: { on_call_start_at: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shiftsByUni = new Map<number, any[]>();
  for (const sh of shifts) {
    const uniId = sh.consultant_university_id;
    const arr = shiftsByUni.get(uniId) ?? [];
    arr.push(sh);
    shiftsByUni.set(uniId, arr);
  }

  const rankedUniversities = universities.map((u) => {
    const uLat = u.university_latitude ? Number(u.university_latitude) : null;
    const uLng = u.university_longitude ? Number(u.university_longitude) : null;

    const distanceKm =
      fromLat != null && fromLng != null && uLat != null && uLng != null
        ? haversineKm(fromLat, fromLng, uLat, uLng)
        : null;

    const uniShifts = shiftsByUni.get(u.university_id) ?? [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      const specTopics: string[] = (c.specializations ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (x: any) =>
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

    const distanceScore = distanceKm == null ? 0 : Math.max(0, 100 - distanceKm);
    const shiftScore = Math.min(
      60,
      availableConsultants.reduce((s, c) => s + c.shifts.length, 0) * 10
    );
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
    reasons.push(`มีเวรว่าง: ${availableConsultants.length} คน`);
    if (requiredTopics.length) reasons.push(`ตรงความเชี่ยวชาญ: ${requiredTopics.join(", ")}`);

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

  const independentIdx = rankedUniversities.findIndex(
    (x) => x.universityCode === "INDEPENDENT"
  );
  rankedUniversities.sort((a, b) => b.matchScore - a.matchScore);

  const hasAnyConsultant = rankedUniversities.some((u) => u.availableConsultants.length > 0);
  if (!hasAnyConsultant && independentIdx >= 0) {
    const independent = rankedUniversities.splice(independentIdx, 1)[0];
    rankedUniversities.unshift(independent);
  }

  // ✅ ใส่เพิ่มแบบ optional ตาม FE types
  detail.parsedDetail = parsedDetail;
  detail.rankedUniversities = rankedUniversities;

  return detail;
}
