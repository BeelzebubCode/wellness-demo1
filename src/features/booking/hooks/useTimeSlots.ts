// src/features/booking/hooks/useTimeSlots.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toISODateString } from '@/lib/date';
import type { TimeSlot } from '../types';
import { getTimeSlots } from '../api';

interface UseTimeSlotsReturn {
  slots: TimeSlot[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTimeSlots(selectedDate: Date, opts?: { universityId?: number }): UseTimeSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = toISODateString(selectedDate);
      const slots = await getTimeSlots(dateStr, opts);
      setSlots(slots);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลช่วงเวลาได้ (กรุณาเข้าสู่ระบบใหม่)');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, opts?.universityId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  return {
    slots,
    isLoading,
    error,
    refetch: fetchTimeSlots,
  };
}
