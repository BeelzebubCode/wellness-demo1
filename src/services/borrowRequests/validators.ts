// src/services/borrowRequests/validators.ts
import type { BorrowRequestDetailJson } from "./types";

function isObj(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toInt(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toIsoOrNull(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new Error("Invalid datetime");
  return d.toISOString();
}

export function safeParseDetail(detailText: string | null): BorrowRequestDetailJson {
  if (!detailText) return {};
  try {
    const obj = JSON.parse(detailText);
    if (obj && typeof obj === "object") return obj as BorrowRequestDetailJson;
    return {};
  } catch {
    return {};
  }
}

export function parseCreateBorrowRequestBody(body: unknown) {
  if (!isObj(body)) throw new Error("Invalid body");

  const title = String(body.title ?? "").trim();
  const reason = String(body.reason ?? "").trim();
  if (title.length < 3) throw new Error("title too short");
  if (reason.length < 3) throw new Error("reason too short");

  const detail = body.detail ?? null; // string | null (ของ FE ส่ง detail เป็น string)
  const neededFrom = body.neededFrom ? toIsoOrNull(body.neededFrom) : null;
  const neededTo = body.neededTo ? toIsoOrNull(body.neededTo) : null;

  const neededCount = body.neededCount === undefined ? 1 : toInt(body.neededCount, 1);
  if (neededCount < 1 || neededCount > 50) throw new Error("neededCount out of range");

  return {
    title,
    reason,
    detail,
    neededFrom,
    neededTo,
    neededCount,
  };
}

export function parseUpdateBorrowRequestBody(body: unknown) {
  if (!isObj(body)) throw new Error("Invalid body");

  const patch: any = {};

  if (body.title !== undefined) {
    const title = String(body.title ?? "").trim();
    if (title.length < 3) throw new Error("title too short");
    patch.title = title;
  }
  if (body.reason !== undefined) {
    const reason = String(body.reason ?? "").trim();
    if (reason.length < 3) throw new Error("reason too short");
    patch.reason = reason;
  }
  if (body.detail !== undefined) {
    patch.detail = body.detail === null ? null : String(body.detail);
  }
  if (body.neededFrom !== undefined) patch.neededFrom = body.neededFrom ? toIsoOrNull(body.neededFrom) : null;
  if (body.neededTo !== undefined) patch.neededTo = body.neededTo ? toIsoOrNull(body.neededTo) : null;

  if (body.neededCount !== undefined) {
    const neededCount = toInt(body.neededCount, 1);
    if (neededCount < 1 || neededCount > 50) throw new Error("neededCount out of range");
    patch.neededCount = neededCount;
  }

  // status update เฉพาะ CANCELLED/DRAFT ตาม types ฝั่ง FE
  if (body.status !== undefined) {
    const st = String(body.status);
    if (!["CANCELLED", "DRAFT"].includes(st)) throw new Error("invalid status");
    patch.status = st;
  }

  return patch as {
    title?: string;
    reason?: string;
    detail?: string | null;
    neededFrom?: string | null;
    neededTo?: string | null;
    neededCount?: number;
    status?: "CANCELLED" | "DRAFT";
  };
}

export function parseAssignBorrowRequestBody(body: unknown) {
  if (!isObj(body)) throw new Error("Invalid body");
  if (!Array.isArray(body.items) || body.items.length === 0) throw new Error("items is required");

  const items = body.items.map((it: any, idx: number) => {
    if (!isObj(it)) throw new Error(`items[${idx}] invalid`);
    const consultantId = toInt(it.consultantId, NaN);
    const consultantUniversityId = toInt(it.consultantUniversityId, NaN);
    if (!Number.isFinite(consultantId)) throw new Error(`items[${idx}].consultantId invalid`);
    if (!Number.isFinite(consultantUniversityId)) throw new Error(`items[${idx}].consultantUniversityId invalid`);

    const startAt = toIsoOrNull(it.startAt);
    const endAt = toIsoOrNull(it.endAt);
    if (!startAt || !endAt) throw new Error(`items[${idx}].startAt/endAt required`);

    const note = it.note === undefined ? null : (it.note === null ? null : String(it.note));

    return {
      consultantId,
      consultantUniversityId,
      startAt,
      endAt,
      note,
    };
  });

  return { items };
}

export function parseRejectBorrowRequestBody(body: unknown) {
  if (!isObj(body)) throw new Error("Invalid body");
  const reason = String(body.reason ?? "").trim();
  if (reason.length < 3) throw new Error("reason too short");
  return { reason };
}
