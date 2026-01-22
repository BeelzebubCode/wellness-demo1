// src/features/booking/hooks/useTimeSlots.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toISODateString } from "@/lib/date";
import type { TimeSlot } from "../types";
import { getTimeSlots } from "../api";

interface UseTimeSlotsReturn {
  slots: TimeSlot[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

type Options = {
  /** ถ้า false จะไม่ยิง API (ใช้คู่กับ useRoleAuth เพื่อกันยิงก่อน auth พร้อม) */
  enabled?: boolean;
  /** ถ้าต้องการ override มหาลัยแบบ explicit (ปกติไม่ต้อง เพราะ requireTenant จัดการให้) */
  universityId?: number;
};

export function useTimeSlots(selectedDate: Date, opts?: Options): UseTimeSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = opts?.enabled ?? true;

  // ทำให้ dependency เสถียร
  const dateStr = useMemo(() => toISODateString(selectedDate), [selectedDate]);
  const uniId = opts?.universityId;

  const fetchTimeSlots = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // ✅ getTimeSlots ควร fetch ด้วย credentials: "include"
      const data = await getTimeSlots(dateStr, uniId ? { universityId: uniId } : undefined);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);

      // ถ้าเป็น 401/403 จะได้ข้อความชัด ๆ
      const msg =
        typeof err?.message === "string" && err.message
          ? err.message
          : "ไม่สามารถโหลดข้อมูลช่วงเวลาได้ (กรุณาเข้าสู่ระบบใหม่)";

      setError(msg);
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, dateStr, uniId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  // กันเคสปิด enabled แล้วควร reset state
  useEffect(() => {
    if (!enabled) {
      setSlots([]);
      setError(null);
      setIsLoading(false);
    }
  }, [enabled]);

  return {
    slots,
    isLoading,
    error,
    refetch: fetchTimeSlots,
  };
}
