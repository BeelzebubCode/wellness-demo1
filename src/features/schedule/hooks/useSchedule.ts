// src/features/schedule/hooks/useSchedule.ts
"use client";

import { useCallback, useState } from "react";
import { scheduleApi } from "../api";
import type { DayStatus, TimeSlot } from "../types";

export function useSchedule() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null); // v2 ยังไม่มี ก็จะเป็น null ตลอด
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (date: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await scheduleApi.getSlots(date); // ✅ v2
      if (!res.success) {
        setError(res.error ?? "ไม่สามารถโหลดข้อมูลได้");
        setSlots([]);
        setDayStatus(null);
        return;
      }

      setSlots(res.slots);
      setDayStatus(res.dayStatus ?? null); // v2 ไม่ส่งก็ null
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
