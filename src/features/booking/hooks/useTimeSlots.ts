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

export function useTimeSlots(selectedDate: Date): UseTimeSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const dateStr = toISODateString(selectedDate);
      const slots = await getTimeSlots(dateStr);
      setSlots(slots);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลช่วงเวลาได้');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

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
