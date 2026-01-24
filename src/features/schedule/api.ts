// src/features/schedule/api.ts
import type { TimeSlot, AutoGenerateSlotDTO, UpdateSlotDTO, CreateSlotDTO } from "./types";

const API_BASE = "/api/v2/time-slots";

export type SlotsResponse = {
  success: boolean;
  date?: string;
  dayStatus?: "OPEN" | "CLOSED";
  slots: TimeSlot[];
  error?: string;
};

type V2GetSlotsResponse = {
  success: boolean;
  date?: string;
  universityId?: number;
  slots?: any[];
  error?: string;
  message?: string;
};

async function safeJson<T = any>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function pickError(res: Response, body: any) {
  return body?.error || body?.message || `HTTP ${res.status}`;
}

/**
 * ✅ normalize กัน server เปลี่ยน shape แล้ว UI พังเงียบ ๆ
 * สำคัญ: TimeSlotCore.universityId เป็น number (required) ห้ามปล่อย undefined
 */
function normalizeSlot(s: any): TimeSlot {
  const id = Number(s?.id);
  const universityId = Number(s?.universityId);

  return {
    id: Number.isFinite(id) ? id : 0,
    universityId: Number.isFinite(universityId) ? universityId : 0,

    date: String(s?.date ?? ""),
    startTime: String(s?.startTime ?? ""),
    endTime: String(s?.endTime ?? ""),

    startDateTime: s?.startDateTime ? String(s.startDateTime) : undefined,
    endDateTime: s?.endDateTime ? String(s.endDateTime) : undefined,

    maxCapacity: Number(s?.maxCapacity ?? 0),
    bookedCount: Number(s?.bookedCount ?? 0),
    availableCount: Number(s?.availableCount ?? 0),

    status: (s?.status ?? "AVAILABLE") as any,
    isAvailable: Boolean(s?.isAvailable),
    isClosed: Boolean(s?.isClosed),
    isPastTime: Boolean(s?.isPastTime),

    unavailableReason: (s?.unavailableReason ?? null) as any,
  };
}

export const scheduleApi = {
  async getSlots(date: string): Promise<SlotsResponse> {
    const params = new URLSearchParams({ date });

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const json = await safeJson<V2GetSlotsResponse>(res);

    if (!res.ok || json?.success === false) {
      return { success: false, slots: [], error: pickError(res, json) };
    }

    const slots = Array.isArray(json?.slots) ? json!.slots.map(normalizeSlot) : [];
    return { success: true, date: json?.date, slots };
  },

  /**
   * v2: ยังไม่รองรับ create รายตัว
   * ✅ แต่ให้ signature รับ data เพื่อให้ hook/UI type ตรงกัน
   */
  async createSlot(_data: CreateSlotDTO): Promise<SlotsResponse> {
    return { success: false, slots: [], error: "v2 ยังไม่รองรับการสร้าง slot รายตัว" };
  },

  async autoGenerateSlots(data: AutoGenerateSlotDTO): Promise<SlotsResponse> {
    const res = await fetch(API_BASE, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        date: data.date,
        generateDefault: true,
        // maxCapacity: data.maxCapacity ?? 2,
      }),
    });

    const json = await safeJson<any>(res);
    if (!res.ok || json?.success === false) {
      return { success: false, slots: [], error: pickError(res, json) };
    }

    return this.getSlots(data.date);
  },

  async deleteSlots(date: string): Promise<SlotsResponse> {
    const res = await fetch(`${API_BASE}?date=${encodeURIComponent(date)}`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const json = await safeJson<any>(res);
    if (!res.ok || json?.success === false) {
      return { success: false, slots: [], error: pickError(res, json) };
    }

    return this.getSlots(date);
  },

  async regenerate(date: string): Promise<SlotsResponse> {
    const params = new URLSearchParams({ date, action: "regenerate" });

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const json = await safeJson<any>(res);
    if (!res.ok || json?.success === false) {
      return { success: false, slots: [], error: pickError(res, json) };
    }

    return this.getSlots(date);
  },

  async updateSlot(slotId: number, updates: UpdateSlotDTO): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/${slotId}`, {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(updates),
    });

    const json = await safeJson<any>(res);
    if (!res.ok || json?.success === false) {
      return { success: false, error: pickError(res, json) };
    }
    return { success: true };
  },

  async deleteSlot(slotId: number): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/${slotId}`, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    const json = await safeJson<any>(res);
    if (!res.ok || json?.success === false) {
      return { success: false, error: pickError(res, json) };
    }
    return { success: true };
  },

  async setSlotStatus(slotId: number, status: "AVAILABLE" | "LOCKED") {
    return this.updateSlot(slotId, { status });
  },

  async setSlotAvailability(slotId: number, isAvailable: boolean) {
    return this.updateSlot(slotId, { isAvailable });
  },
};

export default scheduleApi;
