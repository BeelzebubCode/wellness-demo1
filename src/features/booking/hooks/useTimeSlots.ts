// src/features/booking/hooks/useTimeSlots.ts
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  enabled?: boolean;
  universityId?: number;
};

// ✅ helper: parse err msg แบบ robust
function toErrMsg(err: any) {
  if (typeof err?.message === "string" && err.message.trim()) return err.message;
  return "ไม่สามารถโหลดข้อมูลช่วงเวลาได้ (กรุณาเข้าสู่ระบบใหม่)";
}

export function useTimeSlots(selectedDate: Date, opts?: Options): UseTimeSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = opts?.enabled ?? true;

  // ทำ dependency ให้เสถียร
  const dateStr = useMemo(() => toISODateString(selectedDate), [selectedDate]);
  const uniId = opts?.universityId ?? null;
  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const fetchTimeSlots = useCallback(async () => {
    if (!enabled) return;

    const reqId = ++reqIdRef.current;

    // cancel request เก่า
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getTimeSlots(
        dateStr,
        uniId ? { universityId: uniId, signal: controller.signal as any } : { signal: controller.signal as any }
      );

      // ถ้าไม่ใช่ request ล่าสุด ไม่ต้อง set state
      if (reqId !== reqIdRef.current) return;

      setSlots(Array.isArray(data) ? (data as TimeSlot[]) : []);
    } catch (err: any) {
      // abort ไม่ถือเป็น error
      if (err?.name === "AbortError") return;
      if (reqId !== reqIdRef.current) return;

      console.error(err);
      setError(toErrMsg(err));
      setSlots([]);
    } finally {
      if (reqId !== reqIdRef.current) return;
      setIsLoading(false);
    }
  }, [enabled, dateStr, uniId]);

  useEffect(() => {
    fetchTimeSlots();
    return () => abortRef.current?.abort();
  }, [fetchTimeSlots]);

  // ✅ ปิด enabled แล้ว reset state
  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
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
