// src/features/schedule/api.ts
import type {
  TimeSlot,
  CreateSlotDTO,
  AutoGenerateSlotDTO,
  UpdateSlotDTO,
} from "./types";

const API_BASE = "/api/v1/time-slots";

export type SlotsResponse = {
  success: boolean;
  date?: string;
  dayStatus?: "OPEN" | "CLOSED";
  slots: TimeSlot[];
  error?: string;
};

export const scheduleApi = {
  async getSlots(date: string, showAll = true): Promise<SlotsResponse> {
    const params = new URLSearchParams({ date });
    if (showAll) params.set("all", "true");

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      cache: "no-store",
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, slots: [], error: json?.error ?? "Failed" };
    }

    return {
      success: !!json.success,
      date: json.date,
      dayStatus: json.dayStatus,
      slots: json.slots ?? [],
      error: json.error,
    };
  },

  // ✅ create slot: POST แล้ว refetch (เพราะ backend ไม่คืน slots)
  async createSlot(data: CreateSlotDTO): Promise<SlotsResponse> {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: data.date,
        slots: [
          {
            startTime: data.startTime,
            endTime: data.endTime,
            maxCapacity: data.maxCapacity ?? 1,
          },
        ],
      }),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      return {
        success: false,
        slots: [],
        error: json?.error ?? "Create failed",
      };
    }

    return this.getSlots(data.date, true);
  },

  // ✅ auto-generate: backend ใช้ generateDefault=true
  async autoGenerateSlots(data: AutoGenerateSlotDTO): Promise<SlotsResponse> {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: data.date,
        generateDefault: true,
        maxCapacity: data.maxCapacity ?? 1,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      return {
        success: false,
        slots: [],
        error: json?.error ?? "Auto-generate failed",
      };
    }

    return this.getSlots(data.date, true);
  },

  async deleteSlots(date: string): Promise<SlotsResponse> {
    const res = await fetch(`${API_BASE}?date=${date}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok || !json?.success) {
      return {
        success: false,
        slots: [],
        error: json?.error ?? "Delete failed",
      };
    }

    return this.getSlots(date, true);
  },

  // ✅ schema: time_slot_id เป็น Int => slotId ต้องเป็น number
  async updateSlot(
    slotId: number,
    updates: UpdateSlotDTO
  ): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const json = await res.json();
    if (!res.ok || !json?.success) {
      return { success: false, error: json?.error ?? "Update failed" };
    }
    return { success: true };
  },

  async deleteSlot(
    slotId: number
  ): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/${slotId}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok || !json?.success) {
      return { success: false, error: json?.error ?? "Delete slot failed" };
    }
    return { success: true };
  },

  // ✅ helper สำหรับ lock/unlock (optional)
  async setSlotStatus(slotId: number, status: "AVAILABLE" | "LOCKED") {
    return this.updateSlot(slotId, { status } as any);
  },

  async setSlotAvailability(slotId: number, isAvailable: boolean) {
    return this.updateSlot(slotId, { isAvailable });
  },
};

export default scheduleApi;
