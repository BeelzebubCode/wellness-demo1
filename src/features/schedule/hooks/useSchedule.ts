// src/features/schedule/hooks/useSchedule.ts
"use client";

import { useCallback, useState } from "react";
import { scheduleApi } from "../api";
import type { DayStatus, TimeSlot } from "../types";

export function useSchedule() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await scheduleApi.getSlots(date, true);
      if (!res.success) {
        setError(res.error ?? "ไม่สามารถโหลดข้อมูลได้");
        setSlots([]);
        setDayStatus(null);
        return;
      }
      setSlots(res.slots);
      setDayStatus(res.dayStatus ?? null);
    } catch (e) {
      console.error(e);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    slots,
    dayStatus,
    isLoading,
    error,
    fetchSlots,
    clearError: () => setError(null),
  };
}

export default useSchedule;
