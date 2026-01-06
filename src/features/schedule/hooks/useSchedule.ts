// src/features/schedule/hooks/useSchedule.ts
'use client';

import { useState, useCallback } from 'react';
import { scheduleApi } from '../api';
import type { TimeSlot, DaySchedule } from '../types';

export function useSchedule() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await scheduleApi.getSlots(date, true);
      if (response.success) {
        setSlots(response.slots);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDaySchedule = useCallback((date: string): DaySchedule => {
    const daySlots = slots.filter((s) => s.date === date);
    return {
      date,
      slots: daySlots,
      totalSlots: daySlots.length,
      availableSlots: daySlots.filter((s) => s.status === 'AVAILABLE').length,
      bookedSlots: daySlots.filter((s) => s.status === 'BOOKED').length,
    };
  }, [slots]);

  return {
    slots,
    isLoading,
    error,
    fetchSlots,
    getDaySchedule,
    clearError: () => setError(null),
  };
}

export default useSchedule;