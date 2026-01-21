// src/features/booking/api.ts
import type { TimeSlot } from './types';

interface GetTimeSlotsResponse {
  success: boolean;
  date: string;
  universityId: number;
  slots: TimeSlot[];
}

// ถ้าคุณมี store เก็บ selected university สำหรับ staff ให้ส่งเข้ามาได้
export async function getTimeSlots(date: string, opts?: { universityId?: number }): Promise<TimeSlot[]> {
  const headers: Record<string, string> = {};

  if (opts?.universityId) {
    headers['x-university-id'] = String(opts.universityId);
  }

  const res = await fetch(`/api/v2/time-slots?date=${encodeURIComponent(date)}`, {
    method: 'GET',
    headers,
    credentials: 'include', // ✅ ส่ง cookie auth_token ไปด้วย
  });

  if (!res.ok) {
    // ช่วย debug
    const msg = await res.text().catch(() => '');
    throw new Error(`Failed to fetch time slots (${res.status}): ${msg}`);
  }

  const data: GetTimeSlotsResponse = await res.json();

  if (!data.success) {
    throw new Error('API returned unsuccessful response');
  }

  return data.slots;
}
