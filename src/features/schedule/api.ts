// src/features/schedule/api.ts

import type { TimeSlot, CreateSlotDTO, AutoGenerateSlotDTO } from './types';

const API_BASE = '/api/v1/time-slots';

export const scheduleApi = {
  // Get slots for a date
  async getSlots(date: string, showAll = true): Promise<{ success: boolean; slots: TimeSlot[] }> {
    const params = new URLSearchParams({ date });
    if (showAll) params.set('all', 'true');
    
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    return res.json();
  },

  // Create single slot
  async createSlot(data: CreateSlotDTO): Promise<{ success: boolean; slot?: TimeSlot; error?: string }> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    const result = await res.json();
    return {
      success: result.success,
      slot: result.slots?.[0],
      error: result.error,
    };
  },

  // Auto-generate slots for a day
  async autoGenerateSlots(data: AutoGenerateSlotDTO): Promise<{ success: boolean; slots?: TimeSlot[]; error?: string }> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: data.date,
        autoGenerate: true,
        startHour: data.startHour,
        endHour: data.endHour,
        slotDuration: data.slotDuration,
        maxCapacity: data.maxCapacity ?? 1,
      }),
    });
    return res.json();
  },

  // Delete slots for a date
  async deleteSlots(date: string): Promise<{ success: boolean; deleted?: number; error?: string }> {
    const res = await fetch(`${API_BASE}?date=${date}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // Update slot status (lock/unlock)
  async updateSlotStatus(
    slotId: number,
    status: 'AVAILABLE' | 'LOCKED'
  ): Promise<{ success: boolean; error?: string }> {
    const res = await fetch(`${API_BASE}/${slotId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};

export default scheduleApi;