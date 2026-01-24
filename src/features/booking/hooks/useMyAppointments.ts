"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { MyBooking, BookingStatus } from "@/features/booking/types";

interface UseMyAppointmentsReturn {
  bookings: MyBooking[];
  activeBooking: MyBooking | null;
  pastBookings: MyBooking[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasActiveBooking: boolean;
}

async function safeJson<T = any>(res: Response): Promise<T | null> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function useMyAppointments(): UseMyAppointmentsReturn {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const fetchBookings = useCallback(async () => {
    // เพิ่ม request id
    const reqId = ++reqIdRef.current;

    // ยกเลิก request เก่า
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v2/bookings/my", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      const data = await safeJson<any>(res);

      // ถ้าไม่ใช่ request ล่าสุดแล้ว ไม่ต้องทำอะไรต่อ
      if (reqId !== reqIdRef.current) return;

      if (!res.ok || data?.success === false) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setBookings((data?.bookings || []) as MyBooking[]);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      // ถ้าไม่ใช่ request ล่าสุดแล้ว ไม่ต้องทำอะไรต่อ
      if (reqId !== reqIdRef.current) return;

      console.error("Error fetching bookings:", err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลการจองได้");
      setBookings([]);
    } finally {
      // ถ้าไม่ใช่ request ล่าสุดแล้ว ไม่ต้องปิด loading
      if (reqId !== reqIdRef.current) return;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    return () => abortRef.current?.abort();
  }, [fetchBookings]);

  const activeBooking = useMemo(() => {
    const activeSet = new Set<BookingStatus>([
      "PENDING_ASSIGNMENT",
      "ASSIGNED",
      "IN_PROGRESS",
    ]);
    return bookings.find((b) => activeSet.has(b.status)) || null;
  }, [bookings]);

  const pastBookings = useMemo(() => {
    const pastSet = new Set<BookingStatus>(["COMPLETED", "CANCELLED"]);
    return bookings.filter((b) => pastSet.has(b.status));
  }, [bookings]);

  return {
    bookings,
    activeBooking,
    pastBookings,
    isLoading,
    error,
    refetch: fetchBookings,
    hasActiveBooking: !!activeBooking,
  };
}
