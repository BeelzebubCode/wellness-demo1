// src/features/booking/api.ts
import type { TimeSlot } from './types';

interface GetTimeSlotsResponse {
  success: boolean;
  date: string;
  slots: TimeSlot[];
}

export async function getTimeSlots(date: string): Promise<TimeSlot[]> {
  const res = await fetch(`/api/v1/time-slots?date=${date}`);

  if (!res.ok) {
    throw new Error('Failed to fetch time slots');
  }

  const data: GetTimeSlotsResponse = await res.json();

  if (!data.success) {
    throw new Error('API returned unsuccessful response');
  }

  return data.slots;
}
