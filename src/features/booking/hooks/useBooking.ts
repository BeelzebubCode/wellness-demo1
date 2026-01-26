// src/features/booking/hooks/useBooking.ts
"use client";

import { useState, useCallback } from "react";
import type { CreateBookingDTO, BookingListItem } from "@/features/booking/types";

interface UseBookingReturn {
  createBooking: (data: CreateBookingDTO) => Promise<BookingListItem>;
  cancelBooking: (id: string | number, reason: string) => Promise<void>;
  isCreating: boolean;
  isCancelling: boolean;

  error: string | null;
  clearError: () => void;
}

type ApiErrorShape = { error?: string; message?: string; success?: boolean };
type CreateBookingResponse =
  | { success: true; booking?: BookingListItem; bookingId?: string | number }
  | (ApiErrorShape & Record<string, any>);

// helper: parse JSON แบบปลอดภัย (เผื่อ response ว่าง/ไม่ใช่ JSON)
async function safeJson<T = any>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function pickErrorMessage(res: Response, body: any) {
  const msg = body?.error || body?.message;
  if (msg) return String(msg);

  if (res.status === 401) return "กรุณาเข้าสู่ระบบใหม่";
  if (res.status === 403) return "คุณไม่มีสิทธิ์ทำรายการนี้";

  return `Request failed (status ${res.status})`;
}

// ✅ ดึง booking เต็มจาก /api/v2/bookings/:id แล้ว map เป็น BookingListItem
async function fetchBookingById(id: string | number): Promise<BookingListItem> {
  const res = await fetch(`/api/v2/bookings/${id}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const body = await safeJson<any>(res);

  if (!res.ok || body?.success === false) {
    throw new Error(pickErrorMessage(res, body));
  }

  const b = body?.booking;
  if (!b) throw new Error("Invalid booking payload from server");

  // NOTE: ถ้า BookingListItem ของคุณมี field มากกว่านี้ ให้เติม mapping เพิ่ม
  return {
    id: b.id,
    status: b.status,

    studentId: b.student?.id ?? 0,
    studentName: b.student?.name ?? "ไม่ทราบชื่อ",

    problemType: b.problemType ?? "",
    problemCategoryId: b.problemCategoryId ?? 0,

    date: b.date ?? null,
    startTime: b.startTime ?? null,
    endTime: b.endTime ?? null,

    createdAt: b.createdAt,
    updatedAt: b.updatedAt,

    hasFeedback: !!b.feedback,
  } as BookingListItem;
}

export function useBooking(): UseBookingReturn {
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBooking = useCallback(async (data: CreateBookingDTO): Promise<BookingListItem> => {
    setIsCreating(true);
    setError(null);

    try {
      if (!data.studentCode) throw new Error("ไม่พบ studentCode (account_username)");
      if (!data.timeSlotId || Number(data.timeSlotId) <= 0) throw new Error("timeSlotId ไม่ถูกต้อง");
      if (!data.problemCategoryId || Number(data.problemCategoryId) <= 0) throw new Error("problemCategoryId ไม่ถูกต้อง");

      const response = await fetch("/api/v2/bookings", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await safeJson<CreateBookingResponse>(response);

      if (!response.ok || result?.success === false) {
        console.error("[createBooking] status/body:", response.status, result);
        throw new Error(pickErrorMessage(response, result));
      }

      const booking = (result as any)?.booking as BookingListItem | undefined;
      const bookingIdRaw = (result as any)?.bookingId as string | number | undefined;

      if (booking) return booking;

      if (bookingIdRaw !== undefined && bookingIdRaw !== null) {
        const bookingId =
          typeof bookingIdRaw === "string"
            ? Number.parseInt(bookingIdRaw, 10)
            : bookingIdRaw;

        if (!Number.isFinite(bookingId)) throw new Error("Invalid bookingId from server");

        // ✅ ดึงตัวเต็ม
        return await fetchBookingById(bookingId);
      }

      throw new Error("Invalid response from server");
    } catch (err: any) {
      const msg = err?.message || "เกิดข้อผิดพลาดในการจอง";
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id: string | number, reason: string): Promise<void> => {
    setIsCancelling(true);
    setError(null);

    try {
      if (id === null || id === undefined || id === "") throw new Error("booking id ไม่ถูกต้อง");

      const cancelReason = String(reason || "").trim();
      if (!cancelReason) throw new Error("กรุณากรอกเหตุผลในการยกเลิก");

      const response = await fetch(`/api/v2/bookings/${id}/cancel`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason }),
      });

      const result = await safeJson<ApiErrorShape & Record<string, any>>(response);

      if (!response.ok || result?.success === false) {
        console.error("[cancelBooking] status/body:", response.status, result);
        throw new Error(pickErrorMessage(response, result));
      }
    } catch (err: any) {
      const msg = err?.message || "เกิดข้อผิดพลาดในการยกเลิก";
      console.error("[cancelBooking] err:", err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsCancelling(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    createBooking,
    cancelBooking,
    isCreating,
    isCancelling,
    error,
    clearError,
  };
}
